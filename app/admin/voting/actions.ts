"use server"

import { revalidatePath } from "next/cache"
import { config } from "@/lib/config"
import { votingCampaignsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getCampaigns, getCampaignStats } from "@/db/queries"
import { verifySession } from "@/lib/auth"

const SAUDI_OFFSET_MS = 3 * 60 * 60 * 1000

function saudiLocalToUtc(localDateTimeStr: string): Date {
  const naive = new Date(localDateTimeStr)
  return new Date(naive.getTime() + naive.getTimezoneOffset() * 60000 + SAUDI_OFFSET_MS)
}

type CreateCampaignInput = {
  name: string
  startsAt: string
  endsAt: string
  showVoteButton: boolean
  maxVotesPerUser: number
}

type UpdateCampaignInput = Partial<CreateCampaignInput>

export async function getAllCampaigns() {
  await verifySession()
  return getCampaigns()
}

export async function createCampaign(input: CreateCampaignInput) {
  await verifySession()

  const [campaign] = await config.db
    .insert(votingCampaignsTable)
    .values({
      name: input.name,
      startsAt: saudiLocalToUtc(input.startsAt),
      endsAt: saudiLocalToUtc(input.endsAt),
      showVoteButton: input.showVoteButton,
      maxVotesPerUser: input.maxVotesPerUser,
    })
    .returning()

  revalidatePath("/admin/voting")
  revalidatePath("/projects")
  return campaign
}

export async function updateCampaign(id: string, input: UpdateCampaignInput) {
  await verifySession()

  const values: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) values.name = input.name
  if (input.startsAt !== undefined) values.startsAt = saudiLocalToUtc(input.startsAt)
  if (input.endsAt !== undefined) values.endsAt = saudiLocalToUtc(input.endsAt)
  if (input.showVoteButton !== undefined) values.showVoteButton = input.showVoteButton
  if (input.maxVotesPerUser !== undefined) values.maxVotesPerUser = input.maxVotesPerUser

  const [updated] = await config.db
    .update(votingCampaignsTable)
    .set(values)
    .where(eq(votingCampaignsTable.id, id))
    .returning()

  revalidatePath("/admin/voting")
  revalidatePath("/projects")
  return updated
}

export async function deleteCampaign(id: string) {
  await verifySession()

  await config.db.delete(votingCampaignsTable).where(eq(votingCampaignsTable.id, id))

  revalidatePath("/admin/voting")
  revalidatePath("/projects")
}

export async function getCampaignStatsAction(campaignId: string) {
  await verifySession()
  return getCampaignStats(campaignId)
}

export async function toggleShowVoteButton(id: string, showVoteButton: boolean) {
  await verifySession()

  await config.db
    .update(votingCampaignsTable)
    .set({ showVoteButton, updatedAt: new Date() })
    .where(eq(votingCampaignsTable.id, id))

  revalidatePath("/admin/voting")
  revalidatePath("/projects")
}
