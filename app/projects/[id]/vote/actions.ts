"use server"

import { auth } from "@clerk/nextjs/server"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { config } from "@/lib/config"
import { projectsTable, votesTable } from "@/db/schema"
import { isVotingYear } from "@/lib/votes"

type VoteResult = { success: true } | { success: false; error: string }

async function getProjectYear(projectId: string) {
  const project = await config.db.query.projectsTable.findFirst({
    columns: { year: true },
    where: eq(projectsTable.id, projectId),
  })
  return project?.year ?? null
}

export async function castVote(projectId: string): Promise<VoteResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "يجب تسجيل الدخول للتصويت" }

  const year = await getProjectYear(projectId)
  if (year === null) return { success: false, error: "المشروع غير موجود" }
  if (!isVotingYear(year)) {
    return { success: false, error: "التصويت متاح لمشاريع السنة الحالية فقط" }
  }

  const existing = await config.db
    .select({ id: votesTable.id })
    .from(votesTable)
    .where(and(eq(votesTable.userId, userId), eq(votesTable.projectId, projectId)))
    .limit(1)

  if (existing.length > 0) {
    return { success: true }
  }

  if (Number.isFinite(config.votes.maxPerUser) && config.votes.maxPerUser > 0) {
    const [row] = await config.db
      .select({ value: sql<number>`count(*)`.as("value") })
      .from(votesTable)
      .where(eq(votesTable.userId, userId))

    if (row.value >= config.votes.maxPerUser) {
      return { success: false, error: "وصلت إلى الحد الأقصى لعدد الأصوات" }
    }
  }

  await config.db.insert(votesTable).values({ userId, projectId }).onConflictDoNothing()
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function removeVote(projectId: string): Promise<VoteResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "يجب تسجيل الدخول للتصويت" }

  await config.db.delete(votesTable).where(and(eq(votesTable.userId, userId), eq(votesTable.projectId, projectId)))
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
