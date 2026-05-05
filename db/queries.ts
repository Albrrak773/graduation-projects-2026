import { config } from "@/lib/config"
import { type SQL } from "drizzle-orm"

export async function getProjects(where?: SQL) {
  return config.db.query.projectsTable.findMany({
    with: { tags: true },
    where: where,
  })
}
