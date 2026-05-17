import { Suspense } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { getProjects, getUniqueTags } from "@/db/queries"
import { AdminProjectsList } from "@/components/admin-projects-list"

async function AdminProjectsData() {
  "use cache"
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 })
  cacheTag("projects")

  let data: Awaited<ReturnType<typeof getProjects>> = []
  let tags: string[] = []

  try {
    ;[data, tags] = await Promise.all([getProjects(), getUniqueTags()])
  } catch (error) {
    console.error("Failed to fetch projects data:", error)
    data = []
    tags = []
  }

  return <AdminProjectsList data={data} tags={tags} />
}

function AdminProjectsFallback() {
  return (
    <div className="space-y-6">
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default async function AdminProjectsPage() {
  return (
    <Suspense fallback={<AdminProjectsFallback />}>
      <AdminProjectsData />
    </Suspense>
  )
}
