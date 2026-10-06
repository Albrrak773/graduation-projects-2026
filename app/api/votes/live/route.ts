import { NextResponse } from "next/server"
import { connection } from "next/server"
import { getLiveBoardCampaign, getVoteLeaderboard } from "@/db/queries"
import { isCampaignActive } from "@/lib/votes"

export type LiveVotesResponse = {
  campaign: { name: string; isActive: boolean } | null
  totalVotes: number
  projects: { projectId: string; title: string; votes: number }[]
}

// Shared across viewers for a couple of seconds so a room full of open dashboards costs one query, not one each.
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=10" }

export async function GET() {
  await connection()

  const campaign = await getLiveBoardCampaign()
  if (!campaign) {
    return NextResponse.json<LiveVotesResponse>(
      { campaign: null, totalVotes: 0, projects: [] },
      { headers: CACHE_HEADERS }
    )
  }

  const { totalVotes, projects } = await getVoteLeaderboard(campaign.id, 10)

  return NextResponse.json<LiveVotesResponse>(
    { campaign: { name: campaign.name, isActive: isCampaignActive(campaign) }, totalVotes, projects },
    { headers: CACHE_HEADERS }
  )
}
