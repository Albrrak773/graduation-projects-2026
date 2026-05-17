import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserVotedProjectIds } from "@/db/queries"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ votedProjectIds: [] })
  }

  const votedProjectIds = await getUserVotedProjectIds(userId)
  return NextResponse.json({ votedProjectIds })
}
