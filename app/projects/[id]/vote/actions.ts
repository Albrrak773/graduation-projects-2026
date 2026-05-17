"use server"

import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { config } from "@/lib/config"
import { projectsTable, votesTable } from "@/db/schema"
import { getActiveCampaign, getUserVoteCount } from "@/db/queries"

type VoteResult = { success: true } | { success: false; error: string }

export async function castVote(projectId: string): Promise<VoteResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "يجب تسجيل الدخول للتصويت" }

  const campaign = await getActiveCampaign()
  if (!campaign) return { success: false, error: "لا توجد حملة تصويت نشطة حالياً" }
  if (!campaign.showVoteButton) return { success: false, error: "التصويت غير متاح حالياً" }

  const project = await config.db.query.projectsTable.findFirst({
    columns: { id: true },
    where: eq(projectsTable.id, projectId),
  })
  if (!project) return { success: false, error: "المشروع غير موجود" }

  const existing = await config.db
    .select({ id: votesTable.id })
    .from(votesTable)
    .where(
      and(eq(votesTable.userId, userId), eq(votesTable.projectId, projectId), eq(votesTable.campaignId, campaign.id))
    )
    .limit(1)

  if (existing.length > 0) {
    return { success: true }
  }

  const currentVotes = await getUserVoteCount(userId, campaign.id)
  if (currentVotes >= campaign.maxVotesPerUser) {
    return { success: false, error: "وصلت إلى الحد الأقصى لعدد الأصوات" }
  }

  await config.db.insert(votesTable).values({ userId, projectId, campaignId: campaign.id }).onConflictDoNothing()
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/projects")
  return { success: true }
}

export async function switchVote(newProjectId: string): Promise<VoteResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "يجب تسجيل الدخول للتصويت" }

  const campaign = await getActiveCampaign()
  if (!campaign) return { success: false, error: "لا توجد حملة تصويت نشطة حالياً" }
  if (!campaign.showVoteButton) return { success: false, error: "التصويت غير متاح حالياً" }

  const project = await config.db.query.projectsTable.findFirst({
    columns: { id: true },
    where: eq(projectsTable.id, newProjectId),
  })
  if (!project) return { success: false, error: "المشروع غير موجود" }

  await config.db.delete(votesTable).where(and(eq(votesTable.userId, userId), eq(votesTable.campaignId, campaign.id)))
  await config.db
    .insert(votesTable)
    .values({ userId, projectId: newProjectId, campaignId: campaign.id })
    .onConflictDoNothing()
  revalidatePath(`/projects/${newProjectId}`)
  revalidatePath("/projects")
  return { success: true }
}

export async function removeVote(projectId: string): Promise<VoteResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "يجب تسجيل الدخول للتصويت" }

  const campaign = await getActiveCampaign()
  if (!campaign) return { success: false, error: "لا توجد حملة تصويت نشطة حالياً" }

  await config.db
    .delete(votesTable)
    .where(
      and(eq(votesTable.userId, userId), eq(votesTable.projectId, projectId), eq(votesTable.campaignId, campaign.id))
    )
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/projects")
  return { success: true }
}
