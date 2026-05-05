import { boolean, pgEnum, pgTable, serial, uuid, varchar } from "drizzle-orm/pg-core"

export const sectionEnum = pgEnum("section", ["male", "female"])
export const colledgeEnum = pgEnum("colledge", ["CS", "IT", "COE"])
export const baseEnum = pgEnum("base", ["Main", "Unaizah", "Ar-Rass"])

// all project data is in english (unlike the content of the site which all in arabic)
export const projectsTable = pgTable("projects", {
  id: uuid().defaultRandom().primaryKey(),
  image_url: varchar(),
  title: varchar({ length: 255 }).notNull(),
  discription: varchar({ length: 10000 }),
  supervisor: varchar({ length: 255 }),
  is_public: boolean().default(false),
  section: sectionEnum(),
  colledge: colledgeEnum(),
  base: baseEnum(),
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
