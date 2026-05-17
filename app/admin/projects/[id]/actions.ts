"use server"

import { verifySession } from "@/lib/auth"
import { getProjectVotes } from "@/db/queries"

export async function fetchProjectVotes(projectId: string) {
  if (!(await verifySession())) return []
  return getProjectVotes(projectId)
}
