import { COLLEDGE_VALUES } from "@/db/enums"
import { CURRENT_YEAR } from "@/lib/years"
import { BentoGrid } from "./bento-grid"
import type { Project } from "@/db/types"

export function AllProjectsSection({ projects }: { projects: Project[] }) {
  const currentProjects = projects.filter((p) => p.year === CURRENT_YEAR)

  if (currentProjects.length === 0) return null

  const counts = COLLEDGE_VALUES.map((college) => {
    const collegeProjects = currentProjects.filter((p) => p.colledge === college)
    return { college, count: collegeProjects.length }
  }).filter((item) => item.count > 0)

  const totalCount = currentProjects.length
  const previousCount = projects.filter((p) => p.year && p.year < CURRENT_YEAR).length

  return <BentoGrid totalCount={totalCount} counts={counts} previousCount={previousCount} />
}
