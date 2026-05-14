import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { eq } from "drizzle-orm"
import { projectsTable } from "@/db/schema"
import { getProjects } from "@/db/queries"
import { COLLEDGE_LABELS, COLLEDGE_VALUES } from "@/db/enums"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { BentoGrid } from "./bento-grid"

async function AllProjectsData() {
  "use cache"
  cacheLife("days")
  cacheTag("projects")

  const allProjects = await getProjects(eq(projectsTable.is_public, true))

  const counts = COLLEDGE_VALUES.map((college) => {
    const collegeProjects = allProjects.filter((p) => p.colledge === college)
    return { college, count: collegeProjects.length }
  })

  const totalCount = allProjects.length

  const featuredImages = allProjects.filter((p) => p.image_url && p.image_url.length > 0).slice(0, 4)

  return <BentoGrid totalCount={totalCount} counts={counts} featuredImages={featuredImages} />
}

function AllProjectsFallback() {
  return (
    <section className="relative bg-background px-6 py-20 md:px-12 md:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-64 animate-pulse rounded-3xl bg-muted md:col-span-2" />
          <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    </section>
  )
}

export function AllProjectsSection() {
  return (
    <Suspense fallback={<AllProjectsFallback />}>
      <AllProjectsData />
    </Suspense>
  )
}
