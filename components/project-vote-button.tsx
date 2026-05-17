import { connection } from "next/server"
import { getActiveCampaign } from "@/db/queries"
import { VoteButton } from "@/components/vote-button"

export async function ProjectVoteButton({ projectId }: { projectId: string }) {
  await connection()
  const campaign = await getActiveCampaign()
  if (!campaign || !campaign.showVoteButton) return null
  return <VoteButton projectId={projectId} campaignId={campaign.id} maxVotesPerUser={campaign.maxVotesPerUser} />
}
