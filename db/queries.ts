import { config } from "@/lib/config"
import { and, desc, eq, isNotNull, ne, or, type SQL, sql } from "drizzle-orm"
import { projectParticipantsTable, projectsTable, tagsTable, votingCampaignsTable, votesTable } from "@/db/schema"
import type { Project } from "@/db/types"

export async function getProjects(where?: SQL) {
  return config.db.query.projectsTable.findMany({
    with: { tags: true, participants: true },
    where: where,
    orderBy: [desc(projectsTable.year), desc(projectsTable.id)],
  })
}

export async function getProjectsForCards(where?: SQL): Promise<Project[]> {
  const projects = await config.db.query.projectsTable.findMany({
    with: { tags: true },
    where: where,
    orderBy: [desc(projectsTable.year), desc(projectsTable.id)],
  })

  return projects.map((project) => ({ ...project, participants: [] }))
}

export async function getRelatedProjects(project: Project, limit = 3): Promise<Project[]> {
  const projects = await config.db.query.projectsTable.findMany({
    with: { tags: true },
    where: and(
      eq(projectsTable.is_public, true),
      ne(projectsTable.id, project.id),
      or(eq(projectsTable.colledge, project.colledge), eq(projectsTable.section, project.section))
    ),
    orderBy: [desc(projectsTable.year), desc(projectsTable.id)],
    limit,
  })

  return projects.map((item) => ({ ...item, participants: [] }))
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

export async function getActiveCampaign() {
  const now = new Date()
  return config.db.query.votingCampaignsTable.findFirst({
    where: and(sql`${votingCampaignsTable.startsAt} <= ${now}`, sql`${votingCampaignsTable.endsAt} >= ${now}`),
  })
}

export async function getCampaigns() {
  return config.db.query.votingCampaignsTable.findMany({
    orderBy: [desc(votingCampaignsTable.startsAt)],
  })
}

export async function getCampaignById(id: string) {
  return config.db.query.votingCampaignsTable.findFirst({
    where: eq(votingCampaignsTable.id, id),
  })
}

export async function getUserVotedProjectIds(userId: string, campaignId: string) {
  const rows = await config.db
    .select({ projectId: votesTable.projectId })
    .from(votesTable)
    .where(and(eq(votesTable.userId, userId), eq(votesTable.campaignId, campaignId)))
  return rows.map((row) => row.projectId)
}

export async function getUserVoteCount(userId: string, campaignId: string) {
  const [row] = await config.db
    .select({ value: sql<number>`count(*)`.as("value") })
    .from(votesTable)
    .where(and(eq(votesTable.userId, userId), eq(votesTable.campaignId, campaignId)))
  return row.value
}

export async function getCampaignStats(campaignId: string) {
  const totalVotesResult = await config.db
    .select({ value: sql<number>`count(*)`.as("value") })
    .from(votesTable)
    .where(eq(votesTable.campaignId, campaignId))

  const totalVotes = totalVotesResult[0].value

  const topProjects = await config.db
    .select({
      projectId: projectsTable.id,
      title: projectsTable.title,
      votes: sql<number>`count(*)`.as("votes"),
    })
    .from(votesTable)
    .innerJoin(projectsTable, eq(votesTable.projectId, projectsTable.id))
    .where(eq(votesTable.campaignId, campaignId))
    .groupBy(projectsTable.id, projectsTable.title)
    .orderBy(desc(sql`count(*)`))
    .limit(5)

  const recentVotes = await config.db
    .select({
      voteId: votesTable.id,
      userId: votesTable.userId,
      projectId: votesTable.projectId,
      projectTitle: projectsTable.title,
      createdAt: votesTable.createdAt,
    })
    .from(votesTable)
    .innerJoin(projectsTable, eq(votesTable.projectId, projectsTable.id))
    .where(eq(votesTable.campaignId, campaignId))
    .orderBy(desc(votesTable.createdAt))
    .limit(50)

  return { totalVotes, topProjects, recentVotes }
}

export async function getVotesSummaryByProject(campaignId: string) {
  const rows = await config.db
    .select({
      projectId: projectsTable.id,
      title: projectsTable.title,
      year: projectsTable.year,
      colledge: projectsTable.colledge,
      section: projectsTable.section,
      votes: sql<number>`COUNT(DISTINCT ${votesTable.id})`.as("votes"),
      participants: sql<number>`(
        SELECT COUNT(*) FROM ${projectParticipantsTable}
        WHERE ${projectParticipantsTable.project_id} = ${projectsTable.id}
      )`.as("participants"),
    })
    .from(projectsTable)
    .leftJoin(votesTable, and(eq(votesTable.projectId, projectsTable.id), eq(votesTable.campaignId, campaignId)))
    .groupBy(projectsTable.id, projectsTable.title, projectsTable.year, projectsTable.colledge, projectsTable.section)
    .orderBy(desc(sql`COUNT(DISTINCT ${votesTable.id})`), desc(projectsTable.year), desc(projectsTable.id))

  return rows
}

export async function getVotesFirehose(campaignId: string) {
  return config.db
    .select({
      voteId: votesTable.id,
      userId: votesTable.userId,
      projectId: votesTable.projectId,
      createdAt: votesTable.createdAt,
      projectTitle: projectsTable.title,
      projectYear: projectsTable.year,
      projectColledge: projectsTable.colledge,
      projectSection: projectsTable.section,
      projectParticipants: sql<number>`(
        SELECT COUNT(*) FROM ${projectParticipantsTable}
        WHERE ${projectParticipantsTable.project_id} = ${projectsTable.id}
      )`.as("projectParticipants"),
    })
    .from(votesTable)
    .innerJoin(projectsTable, eq(votesTable.projectId, projectsTable.id))
    .where(eq(votesTable.campaignId, campaignId))
    .orderBy(desc(votesTable.createdAt))
}

export async function getProjectVotes(projectId: string) {
  return config.db
    .select({
      voteId: votesTable.id,
      userId: votesTable.userId,
      createdAt: votesTable.createdAt,
    })
    .from(votesTable)
    .where(eq(votesTable.projectId, projectId))
    .orderBy(desc(votesTable.createdAt))
}
