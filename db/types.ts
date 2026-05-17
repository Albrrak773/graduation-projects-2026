import { type InferSelectModel } from "drizzle-orm"
import {
  adminsTable,
  notificationClicksTable,
  notificationsTable,
  projectParticipantsTable,
  projectsTable,
  subscriptionsTable,
  tagsTable,
  votesTable,
} from "./schema"

type ProjectRow = InferSelectModel<typeof projectsTable>
type TagRow = InferSelectModel<typeof tagsTable>
type ProjectParticipantRow = InferSelectModel<typeof projectParticipantsTable>

export type Project = ProjectRow & { tags: TagRow[]; participants: ProjectParticipantRow[] }

export type Subscription = InferSelectModel<typeof subscriptionsTable>
export type NotificationRow = InferSelectModel<typeof notificationsTable>
export type NotificationClick = InferSelectModel<typeof notificationClicksTable>
export type Admin = InferSelectModel<typeof adminsTable>
export type Vote = InferSelectModel<typeof votesTable>
