import { config } from "@/lib/config"
import { desc, eq, isNotNull, type SQL } from "drizzle-orm"
import { projectsTable, tagsTable } from "@/db/schema"

export async function getProjects(where?: SQL) {
  return config.db.query.projectsTable.findMany({
    with: { tags: true, participants: true },
    where: where,
    orderBy: [desc(projectsTable.year), desc(projectsTable.id)],
  })
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
