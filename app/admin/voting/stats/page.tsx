import { Suspense } from "react"
import { redirect } from "next/navigation"
import { IconTrophy } from "@tabler/icons-react"
import { AdminVoteStats } from "@/components/admin-vote-stats"
import { getCampaigns, getVoteSignalRows } from "@/db/queries"
import { verifySession } from "@/lib/auth"
import { analyzeVotes } from "@/lib/vote-analysis"
import { isCampaignActive } from "@/lib/votes"
import { VotingTabs } from "../voting-tabs"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default function AdminVotingStatsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">إدارة التصويت</h1>
        <p className="mt-1 text-sm text-muted-foreground">إحصائيات الأصوات ومؤشرات محاولات التلاعب.</p>
      </div>
      <VotingTabs active="stats" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <StatsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function StatsContent({ searchParams }: { searchParams: SearchParams }) {
  // Voter emails and IPs are shown here, so don't rely on the proxy guard alone.
  if (!(await verifySession())) redirect("/admin/login")

  const params = await searchParams
  const campaigns = await getCampaigns()
  const campaign =
    campaigns.find((c) => c.id === params.campaign) ?? campaigns.find((c) => isCampaignActive(c)) ?? campaigns[0]

  if (!campaign) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <IconTrophy className="mx-auto size-12 text-muted-foreground/30" />
        <p className="mt-4 font-heading text-lg font-bold text-muted-foreground">لا توجد حملات تصويت بعد</p>
      </div>
    )
  }

  const rows = await getVoteSignalRows(campaign.id)
  const projectId = rows.find((row) => row.projectId === params.project)?.projectId

  return (
    <AdminVoteStats
      campaigns={campaigns}
      campaign={campaign}
      projectId={projectId}
      flaggedOnly={params.only === "flagged"}
      analysis={analyzeVotes(rows, projectId)}
    />
  )
}
