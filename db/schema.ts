import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import { COLLEDGE_VALUES, SECTION_VALUES } from "./enums"

export const sectionEnum = pgEnum("section", [...SECTION_VALUES])
export const colledgeEnum = pgEnum("colledge", [...COLLEDGE_VALUES])
export const baseEnum = pgEnum("base", ["Main", "Unaizah", "Ar-Rass"])
export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "project_owner"])

export const projectsTable = pgTable("projects", {
  id: uuid().defaultRandom().primaryKey(),
  image_url: varchar(),
  title: varchar({ length: 255 }).notNull(),
  discription: varchar({ length: 10000 }),
  supervisor: varchar({ length: 255 }).notNull(),
  is_public: boolean().default(false),
  section: sectionEnum().notNull(),
  colledge: colledgeEnum().notNull(),
  base: baseEnum().notNull(),
  project_external_link: varchar(),
  year: integer().default(sql`EXTRACT(YEAR FROM CURRENT_DATE)`),
})

export const tagsTable = pgTable("tags", {
  id: serial().primaryKey(),
  project_id: uuid()
    .references(() => projectsTable.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar({ length: 255 }).notNull(),
})

export const projectParticipantsTable = pgTable("project_participants", {
  project_id: uuid()
    .references(() => projectsTable.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar({ length: 255 }).notNull(),
  uni_id: varchar({ length: 9 }).notNull(),
  x_url: varchar(),
  linked_url: varchar(),
  github_url: varchar(),
  email: varchar(),
})

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  keys: text("keys").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const adminsTable = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  role: adminRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const adminProjectsTable = pgTable("admin_projects", {
  adminId: uuid("admin_id")
    .references(() => adminsTable.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projectsTable.id, { onDelete: "cascade" })
    .notNull(),
})

export const projectsRelations = relations(projectsTable, ({ many }) => ({
  tags: many(tagsTable),
  participants: many(projectParticipantsTable),
}))

export const tagsRelations = relations(tagsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [tagsTable.project_id],
    references: [projectsTable.id],
  }),
}))

export const projectParticipantsRelations = relations(projectParticipantsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectParticipantsTable.project_id],
    references: [projectsTable.id],
  }),
}))

export const adminsRelations = relations(adminsTable, ({ many }) => ({
  projects: many(adminProjectsTable),
}))

export const adminProjectsRelations = relations(adminProjectsTable, ({ one }) => ({
  admin: one(adminsTable, {
    fields: [adminProjectsTable.adminId],
    references: [adminsTable.id],
  }),
  project: one(projectsTable, {
    fields: [adminProjectsTable.projectId],
    references: [projectsTable.id],
  }),
}))
