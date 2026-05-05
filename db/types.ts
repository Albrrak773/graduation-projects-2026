import { type InferSelectModel } from "drizzle-orm"
import { projectsTable, tagsTable } from "./schema"

type ProjectRow = InferSelectModel<typeof projectsTable>
type TagRow = InferSelectModel<typeof tagsTable>

export type Project = ProjectRow & { tags: TagRow[] }
