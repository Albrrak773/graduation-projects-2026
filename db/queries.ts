import { config } from "@/lib/config"
import { and, desc, eq, isNotNull, ne, or, type SQL } from "drizzle-orm"
import { projectsTable, tagsTable } from "@/db/schema"
import type { Project } from "@/db/types"

export async function getProjects(where?: SQL) {
  return config.db.query.projectsTable.findMany({
    with: { tags: true, participants: true },
    where: where,
    orderBy: [desc(projectsTable.year), desc(projectsTable.id)],
  })
}

export async function getProjectsForCards(where?: SQL): Promise<Project[]> {
  const projects = await config.db.query.projectsTable.findMany({
    with: { tags: true },
    where: where,
    orderBy: [desc(projectsTable.year), desc(projectsTable.id)],
  })

  return projects.map((project) => ({ ...project, participants: [] }))
}

export async function getRelatedProjects(project: Project, limit = 3): Promise<Project[]> {
  const projects = await config.db.query.projectsTable.findMany({
    with: { tags: true },
    where: and(
      eq(projectsTable.is_public, true),
      ne(projectsTable.id, project.id),
      or(eq(projectsTable.colledge, project.colledge), eq(projectsTable.section, project.section))
    ),
    orderBy: [desc(projectsTable.year), desc(projectsTable.id)],
    limit,
  })

  return projects.map((item) => ({ ...item, participants: [] }))
}

export async function getAllProjectIds() {
  const rows = await config.db.select({ id: projectsTable.id }).from(projectsTable)
  return rows.map((r) => r.id)
}

export async function getAllProjectSignatures() {
  const rows = await config.db
    .select({ signature: projectsTable.signature })
    .from(projectsTable)
    .where(isNotNull(projectsTable.signature))
  return rows.map((r) => r.signature as string)
}

export async function getProjectById(id: string) {
  return config.db.query.projectsTable.findFirst({
    with: { tags: true, participants: true },
    where: eq(projectsTable.id, id),
  })
}

export async function getProjectBySignature(signature: string) {
  return config.db.query.projectsTable.findFirst({
    with: { tags: true, participants: true },
    where: eq(projectsTable.signature, signature),
  })
}

export async function getUniqueTags() {
  const rows = await config.db.select({ name: tagsTable.name }).from(tagsTable)
  const uniqueNames = Array.from(new Set(rows.map((r) => r.name)))
  return uniqueNames
}
