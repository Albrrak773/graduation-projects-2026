import { Suspense } from "react"
import { connection } from "next/server"
import { getActiveCampaign } from "@/db/queries"
import { VoteCtaCard } from "@/components/vote-cta-card"
import { VoteButton } from "@/components/vote-button"

async function VoteCtaCardInner({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  await connection()
  const campaign = await getActiveCampaign()
  if (!campaign || !campaign.showVoteButton) return null

  const now = new Date()
  if (campaign.endsAt <= now) {
    return <VoteButton projectId={projectId} campaignId={campaign.id} maxVotesPerUser={campaign.maxVotesPerUser} />
  }

  return (
    <VoteCtaCard
      projectId={projectId}
      projectTitle={projectTitle}
      campaignName={campaign.name}
      endsAt={campaign.endsAt}
      maxVotesPerUser={campaign.maxVotesPerUser}
    />
  )
}

export function ProjectVoteCta({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  return (
    <Suspense fallback={null}>
      <VoteCtaCardInner projectId={projectId} projectTitle={projectTitle} />
    </Suspense>
  )
}
