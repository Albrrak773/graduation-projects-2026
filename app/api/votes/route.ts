import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { inArray } from "drizzle-orm"
import { config } from "@/lib/config"
import { projectsTable } from "@/db/schema"
import { getActiveCampaign, getUserVotedProjectIds } from "@/db/queries"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ votedProjectIds: [], votedProjectTitles: {}, maxVotesPerUser: 0, campaignId: null })
  }

  const campaign = await getActiveCampaign()
  if (!campaign || !campaign.showVoteButton) {
    return NextResponse.json({ votedProjectIds: [], votedProjectTitles: {}, maxVotesPerUser: 0, campaignId: null })
  }

  const votedProjectIds = await getUserVotedProjectIds(userId, campaign.id)
  const votedProjectTitles: Record<string, string> = {}
  if (votedProjectIds.length > 0) {
    const rows = await config.db
      .select({ id: projectsTable.id, title: projectsTable.title })
      .from(projectsTable)
      .where(inArray(projectsTable.id, votedProjectIds))
    for (const row of rows) {
      votedProjectTitles[row.id] = row.title
    }
  }

  return NextResponse.json({
    votedProjectIds,
    votedProjectTitles,
    maxVotesPerUser: campaign.maxVotesPerUser,
    campaignId: campaign.id,
  })
}
