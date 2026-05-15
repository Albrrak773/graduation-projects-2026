import { COLLEDGE_VALUES } from "@/db/enums"
import { BentoGrid } from "./bento-grid"
import type { Project } from "@/db/types"

export function AllProjectsSection({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null

  const counts = COLLEDGE_VALUES.map((college) => {
    const collegeProjects = projects.filter((p) => p.colledge === college)
    return { college, count: collegeProjects.length }
  }).filter((item) => item.count > 0)

  const totalCount = projects.length
  const previousCount = projects.filter((p) => p.year && p.year < 2026).length

  return <BentoGrid totalCount={totalCount} counts={counts} previousCount={previousCount} />
}
