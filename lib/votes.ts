import { getActiveCampaign } from "@/db/queries"
import type { VotingCampaign } from "@/db/types"

export function isCampaignActive(campaign: VotingCampaign | null | undefined): campaign is VotingCampaign {
  if (!campaign) return false
  const now = new Date()
  return new Date(campaign.startsAt) <= now && new Date(campaign.endsAt) >= now
}

export { getActiveCampaign }
