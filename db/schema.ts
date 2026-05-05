import { boolean, pgEnum, pgTable, serial, uuid, varchar } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { COLLEDGE_VALUES, SECTION_VALUES } from "./enums"

export const sectionEnum = pgEnum("section", [...SECTION_VALUES])
export const colledgeEnum = pgEnum("colledge", [...COLLEDGE_VALUES])
export const baseEnum = pgEnum("base", ["Main", "Unaizah", "Ar-Rass"])

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
