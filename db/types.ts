import { type InferSelectModel } from "drizzle-orm"
import { projectParticipantsTable, projectsTable, tagsTable } from "./schema"

type ProjectRow = InferSelectModel<typeof projectsTable>
type TagRow = InferSelectModel<typeof tagsTable>
type ProjectParticipantRow = InferSelectModel<typeof projectParticipantsTable>

export type Project = ProjectRow & { tags: TagRow[]; participants: ProjectParticipantRow[] }
