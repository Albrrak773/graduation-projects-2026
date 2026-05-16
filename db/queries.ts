import { config } from "@/lib/config"
import { and, eq, ne, or, type SQL } from "drizzle-orm"
import { projectsTable } from "@/db/schema"
import type { Project } from "@/db/types"

export async function getProjects(where?: SQL) {
  return config.db.query.projectsTable.findMany({
    with: { tags: true, participants: true },
    where: where,
  })
}

export async function getProjectsForCards(where?: SQL): Promise<Project[]> {
  const projects = await config.db.query.projectsTable.findMany({
    with: { tags: true },
    where: where,
  })

  return projects.map((project) => ({ ...project, participants: [] }))
}

export async function getAllProjectIds() {
  const rows = await config.db.select({ id: projectsTable.id }).from(projectsTable)
  return rows.map((r) => r.id)
}

export async function getProjectById(id: string) {
  return config.db.query.projectsTable.findFirst({
    with: { tags: true, participants: true },
    where: eq(projectsTable.id, id),
  })
}

export async function getRelatedProjects(project: Pick<Project, "id" | "colledge" | "section">): Promise<Project[]> {
  const projects = await config.db.query.projectsTable.findMany({
    with: { tags: true },
    where: and(
      eq(projectsTable.is_public, true),
      ne(projectsTable.id, project.id),
      or(eq(projectsTable.colledge, project.colledge), eq(projectsTable.section, project.section))
    ),
    limit: 3,
  })

  return projects.map((item) => ({ ...item, participants: [] }))
}
