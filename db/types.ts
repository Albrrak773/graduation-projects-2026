import { type InferSelectModel } from "drizzle-orm"
import { adminsTable, projectParticipantsTable, projectsTable, subscriptionsTable, tagsTable } from "./schema"

type ProjectRow = InferSelectModel<typeof projectsTable>
type TagRow = InferSelectModel<typeof tagsTable>
type ProjectParticipantRow = InferSelectModel<typeof projectParticipantsTable>

export type Project = ProjectRow & { tags: TagRow[]; participants: ProjectParticipantRow[] }

export type Subscription = InferSelectModel<typeof subscriptionsTable>
export type Admin = InferSelectModel<typeof adminsTable>
