// Fills voter_email / ip_address / device on votes cast before those columns existed, from Clerk.
// run with infisical run --env=dev -- pnpm tsx db/backfill-vote-signals.ts [--dry-run]
import "dotenv/config"
import { eq, isNull, or, sql } from "drizzle-orm"
import { votesTable } from "./schema.js"
import { config } from "../lib/config.js"
import { formatDevice } from "../lib/vote-device.js"

const CLERK_API = "https://api.clerk.com/v1"
const PAGE_SIZE = 500
const CONCURRENCY = 6
const RETRIES = 4

type ClerkUser = {
  id: string
  primary_email_address_id: string | null
  email_addresses: { id: string; email_address: string }[]
}

type ClerkSession = {
  created_at: number
  latest_activity: {
    ip_address?: string | null
    device_type?: string | null
    browser_name?: string | null
    is_mobile?: boolean | null
  } | null
}

const PLATFORM_NAMES: Record<string, string> = { Macintosh: "Mac", X11: "Linux" }

async function clerk<T>(path: string): Promise<T | null> {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const response = await fetch(CLERK_API + path, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    })
    if (response.ok) return (await response.json()) as T
    if (response.status === 404) return null
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
  }
  throw new Error(`Clerk request failed: ${path}`)
}

function primaryEmail(user: ClerkUser | null | undefined) {
  const address =
    user?.email_addresses.find((email) => email.id === user.primary_email_address_id) ?? user?.email_addresses[0]
  return address?.email_address.toLowerCase() ?? null
}

async function listUserEmails() {
  const emails = new Map<string, string | null>()
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = (await clerk<ClerkUser[]>(`/users?limit=${PAGE_SIZE}&offset=${offset}&order_by=created_at`)) ?? []
    for (const user of page) emails.set(user.id, primaryEmail(user))
    if (page.length < PAGE_SIZE) return emails
  }
}

/** The session opened closest to the vote is the one the vote was cast from. */
async function sessionSignals(userId: string, votedAt: Date) {
  const sessions = (await clerk<ClerkSession[]>(`/sessions?user_id=${userId}&limit=100`)) ?? []
  const [session] = sessions
    .filter((candidate) => candidate.latest_activity?.ip_address)
    .sort((a, b) => Math.abs(a.created_at - votedAt.getTime()) - Math.abs(b.created_at - votedAt.getTime()))
  const activity = session?.latest_activity
  if (!activity) return { ipAddress: null, device: null }

  const platform =
    activity.device_type === "Linux" && activity.is_mobile
      ? "Android"
      : (PLATFORM_NAMES[activity.device_type ?? ""] ?? activity.device_type)
  return {
    ipAddress: activity.ip_address ?? null,
    device: platform || activity.browser_name ? formatDevice(platform, activity.browser_name) : null,
  }
}

async function main() {
  if (!process.env.CLERK_SECRET_KEY) throw new Error("Missing required environment variable: CLERK_SECRET_KEY")
  const dryRun = process.argv.includes("--dry-run")
  const db = config.db

  const votes = await db
    .select({ id: votesTable.id, userId: votesTable.userId, createdAt: votesTable.createdAt })
    .from(votesTable)
    .where(or(isNull(votesTable.voterEmail), isNull(votesTable.ipAddress), isNull(votesTable.device)))

  console.log(`Found ${votes.length} vote(s) missing signals${dryRun ? " (dry run)" : ""}`)
  if (votes.length === 0) process.exit(0)

  const emails = await listUserEmails()
  let withEmail = 0
  let withIp = 0
  let failed = 0
  let next = 0

  async function worker() {
    while (next < votes.length) {
      const vote = votes[next++]
      try {
        // Offset paging can skip accounts created while it runs, so look those up one by one.
        const voterEmail = emails.has(vote.userId)
          ? emails.get(vote.userId)
          : primaryEmail(await clerk<ClerkUser>(`/users/${vote.userId}`))
        const { ipAddress, device } = await sessionSignals(vote.userId, vote.createdAt)
        if (voterEmail) withEmail++
        if (ipAddress) withIp++

        if (!dryRun) {
          // COALESCE keeps anything captured at vote time; Clerk only fills the gaps.
          await db
            .update(votesTable)
            .set({
              voterEmail: sql`COALESCE(${votesTable.voterEmail}, ${voterEmail ?? null})`,
              ipAddress: sql`COALESCE(${votesTable.ipAddress}, ${ipAddress})`,
              device: sql`COALESCE(${votesTable.device}, ${device})`,
            })
            .where(eq(votesTable.id, vote.id))
        }
      } catch (error) {
        failed++
        console.warn(`Could not backfill vote ${vote.id}:`, error)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  console.log(`Done. Votes: ${votes.length}, email found: ${withEmail}, IP found: ${withIp}, failed: ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error("Vote signal backfill failed:", error)
  process.exit(1)
})
