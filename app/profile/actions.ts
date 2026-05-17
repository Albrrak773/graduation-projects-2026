"use server"

import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { config } from "@/lib/config"
import { votesTable } from "@/db/schema"
import { getUserVotedProjects } from "@/db/queries"

export async function getMyVotedProjects() {
  const { userId } = await auth()
  if (!userId) return []
  return getUserVotedProjects(userId)
}

export async function removeMyVote(voteId: string) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "غير مصرح" }

  const [vote] = await config.db
    .select({ id: votesTable.id, userId: votesTable.userId })
    .from(votesTable)
    .where(eq(votesTable.id, voteId))
    .limit(1)

  if (!vote || vote.userId !== userId) {
    return { success: false, error: "لم يتم العثور على الصوت" }
  }

  await config.db.delete(votesTable).where(eq(votesTable.id, voteId))
  revalidatePath("/profile")
  revalidatePath("/projects")
  return { success: true }
}
