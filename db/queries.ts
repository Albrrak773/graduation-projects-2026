import { config } from "@/lib/config"
import { eq, type SQL } from "drizzle-orm"
import { projectsTable, tagsTable } from "@/db/schema"

export async function getProjects(where?: SQL) {
  return config.db.query.projectsTable.findMany({
    with: { tags: true, participants: true },
    where: where,
  })
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

export async function getUniqueTags() {
  const rows = await config.db.select({ name: tagsTable.name }).from(tagsTable)
  const uniqueNames = Array.from(new Set(rows.map((r) => r.name)))
  return uniqueNames
}
