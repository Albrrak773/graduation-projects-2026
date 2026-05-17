import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getActiveCampaign, getUserVotedProjectIds } from "@/db/queries"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ votedProjectIds: [], maxVotesPerUser: 0, campaignId: null })
  }

  const campaign = await getActiveCampaign()
  if (!campaign || !campaign.showVoteButton) {
    return NextResponse.json({ votedProjectIds: [], maxVotesPerUser: 0, campaignId: null })
  }

  const votedProjectIds = await getUserVotedProjectIds(userId, campaign.id)
  return NextResponse.json({
    votedProjectIds,
    maxVotesPerUser: campaign.maxVotesPerUser,
    campaignId: campaign.id,
  })
}
