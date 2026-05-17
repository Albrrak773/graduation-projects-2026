import { Suspense } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { connection } from "next/server"
import { eq } from "drizzle-orm"
import { projectsTable } from "@/db/schema"
import { getProjectsForCards, getUniqueTags, getActiveCampaign } from "@/db/queries"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { ProjectsSearch } from "@/components/projects-search"
import { VotingCampaignCard } from "@/components/voting-campaign-card"
import type { Project } from "@/db/types"

async function ProjectsData() {
  "use cache"
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 })
  cacheTag("projects")

  let data: Project[] = []
  let tags: string[] = []

  try {
    ;[data, tags] = await Promise.all([getProjectsForCards(eq(projectsTable.is_public, true)), getUniqueTags()])
  } catch (error) {
    console.error("Failed to fetch projects data:", error)
    data = []
    tags = []
  }

  return <ProjectsSearch data={data} tags={tags} />
}

async function CampaignBanner() {
  await connection()
  const campaign = await getActiveCampaign()
  if (!campaign || !campaign.showVoteButton) return null
  return <VotingCampaignCard campaignName={campaign.name} />
}

function ProjectsFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 md:px-12">
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-3/4 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <NavBar showSearch={false} hideOnScroll />
        <div className="mx-auto max-w-6xl space-y-6 px-6 md:px-12">
          <Suspense fallback={null}>
            <CampaignBanner />
          </Suspense>
        </div>
        <Suspense fallback={<ProjectsFallback />}>
          <ProjectsData />
        </Suspense>
        <Footer />
      </div>
    </div>
  )
}
