export type VoteSignalRow = {
  voteId: string
  userId: string
  projectId: string
  projectTitle: string
  createdAt: Date
  voterEmail: string | null
  ipAddress: string | null
  device: string | null
}

export type VoteFlag = "disposable_email" | "concentrated_domain" | "email_alias" | "ip_cluster" | "shared_ip"

/** "suspect" votes are excluded from the clean count; "review" ones are only surfaced for a human look. */
export type FlagLevel = "suspect" | "review"

export const FLAG_LEVEL: Record<VoteFlag, FlagLevel> = {
  disposable_email: "suspect",
  concentrated_domain: "suspect",
  email_alias: "suspect",
  ip_cluster: "suspect",
  shared_ip: "review",
}

export const FLAG_LABEL: Record<VoteFlag, string> = {
  disposable_email: "بريد مؤقت",
  concentrated_domain: "نطاق مركّز",
  email_alias: "بريد مكرر",
  ip_cluster: "تكتل IP",
  shared_ip: "IP مشترك",
}

/** Votes from one IP to one project: at or above this they count as suspect, not just shared Wi-Fi. */
export const IP_CLUSTER_MIN = 15
/** Votes from one IP to one project worth a manual look (a household or a lab can reach this honestly). */
export const SHARED_IP_MIN = 5
/** An uncommon domain needs this many voters before its concentration on one project means anything. */
const CONCENTRATED_DOMAIN_MIN = 5
const CONCENTRATED_DOMAIN_SHARE = 0.9

const COMMON_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "outlook.sa",
  "live.com",
  "msn.com",
  "windowslive.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "yahoo.com",
  "ymail.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
])

const DISPOSABLE_DOMAINS = new Set([
  "emailnox.live",
  "sssonar.com",
  "meshelp.com",
  "mailinator.com",
  "guerrillamail.com",
  "sharklasers.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "tmpmail.org",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "fakeinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "moakt.com",
])

/** Riyadh hours [start, end) when honest traffic should nearly stop. */
export const QUIET_HOURS = { start: 2, end: 5 }
/** Quiet hours as busy as this share of the daytime rate (or more) look automated. */
const QUIET_RATE_ALARM = 0.5
const QUIET_MIN_VOTES = 10
const RIYADH_OFFSET_HOURS = 3
const HOUR_MS = 60 * 60 * 1000

const TIMELINE_BUCKET_MINUTES = [10, 30, 60, 180, 360, 720, 1440]
const TIMELINE_MAX_BUCKETS = 72

export type AnalyzedVote = VoteSignalRow & { domain: string | null; flags: VoteFlag[]; level: FlagLevel | null }

export type VoteAlert = {
  key: string
  flag: VoteFlag
  level: FlagLevel
  /** The domain, IP or address the alert is about. */
  subject: string
  projectId: string
  projectTitle: string
  votes: number
  devices: number
  firstAt: Date
  lastAt: Date
}

export type ProjectStanding = {
  projectId: string
  title: string
  votes: number
  suspect: number
  review: number
  clean: number
  distinctIps: number
  rank: number
  cleanRank: number
}

export type VoteAnalysis = {
  totals: {
    votes: number
    voters: number
    suspect: number
    review: number
    clean: number
    distinctIps: number
    missingSignals: number
    lastHour: number
    peakBucketVotes: number
  }
  bucketMinutes: number
  timeline: { start: Date; votes: number; suspect: number; quiet: boolean }[]
  /** Votes by Riyadh hour of day, index 0-23. */
  hourOfDay: number[]
  /** Average votes per hour inside and outside the quiet hours; `hours` is 0 until a quiet period has passed. */
  quietHours: { hours: number; votes: number; perHour: number; activePerHour: number; alarming: boolean }
  /** Standings always cover the whole campaign so a project's rank stays meaningful when scoped to it. */
  standings: ProjectStanding[]
  domains: { domain: string; votes: number; projects: number; topProjectTitle: string; flag: VoteFlag | null }[]
  ipGroups: {
    ip: string
    votes: number
    projects: number
    topProjectTitle: string
    devices: number
    firstAt: Date
    lastAt: Date
    flag: VoteFlag | null
  }[]
  devices: { device: string; votes: number }[]
  alerts: VoteAlert[]
  /** Newest first. */
  votes: AnalyzedVote[]
}

function emailDomain(email: string | null) {
  const at = email?.lastIndexOf("@") ?? -1
  return email && at > 0 ? email.slice(at + 1).toLowerCase() : null
}

/** Folds "+tag" suffixes (and Gmail's ignored dots) so aliases of one mailbox compare equal. */
function normalizeEmail(email: string) {
  const at = email.lastIndexOf("@")
  const domain = email.slice(at + 1).toLowerCase()
  let local = email.slice(0, at).toLowerCase().split("+")[0]
  if (domain === "gmail.com" || domain === "googlemail.com") local = local.replaceAll(".", "")
  return `${local}@${domain}`
}

function isInstitutional(domain: string) {
  return /(^|\.)(edu|gov|ac)(\.[a-z]{2})?$/.test(domain)
}

function groupBy<T>(items: T[], keyOf: (item: T) => string | null) {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    if (key === null) continue
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }
  return groups
}

function topProject(votes: VoteSignalRow[]) {
  const [top] = [...groupBy(votes, (vote) => vote.projectId).values()].sort((a, b) => b.length - a.length)
  return {
    projectId: top[0].projectId,
    title: top[0].projectTitle,
    votes: top.length,
    projects: new Set(votes.map((v) => v.projectId)).size,
  }
}

function timeRange(votes: VoteSignalRow[]) {
  const times = votes.map((vote) => vote.createdAt.getTime())
  return { firstAt: new Date(Math.min(...times)), lastAt: new Date(Math.max(...times)) }
}

function distinct(values: (string | null)[]) {
  return new Set(values.filter((value) => value !== null)).size
}

/**
 * Flags are always worked out across the whole campaign, then the report is
 * narrowed to `projectId` when given — an alias or a domain only looks
 * suspicious in the context of every vote, not one project's.
 */
export function analyzeVotes(rows: VoteSignalRow[], projectId?: string, now = new Date()): VoteAnalysis {
  const flagsByVote = new Map<string, Set<VoteFlag>>()
  const alerts: VoteAlert[] = []
  const domainFlags = new Map<string, VoteFlag>()
  const ipFlags = new Map<string, VoteFlag>()

  function flag(votes: VoteSignalRow[], voteFlag: VoteFlag, subject: string) {
    for (const vote of votes) {
      const flags = flagsByVote.get(vote.voteId)
      if (flags) flags.add(voteFlag)
      else flagsByVote.set(vote.voteId, new Set([voteFlag]))
    }
    for (const projectVotes of groupBy(votes, (vote) => vote.projectId).values()) {
      alerts.push({
        key: `${voteFlag}:${subject}:${projectVotes[0].projectId}`,
        flag: voteFlag,
        level: FLAG_LEVEL[voteFlag],
        subject,
        projectId: projectVotes[0].projectId,
        projectTitle: projectVotes[0].projectTitle,
        votes: projectVotes.length,
        devices: distinct(projectVotes.map((vote) => vote.device)),
        ...timeRange(projectVotes),
      })
    }
  }

  for (const [domain, votes] of groupBy(rows, (vote) => emailDomain(vote.voterEmail))) {
    if (DISPOSABLE_DOMAINS.has(domain)) {
      domainFlags.set(domain, "disposable_email")
      flag(votes, "disposable_email", domain)
    } else if (
      !COMMON_PROVIDERS.has(domain) &&
      !isInstitutional(domain) &&
      votes.length >= CONCENTRATED_DOMAIN_MIN &&
      topProject(votes).votes / votes.length >= CONCENTRATED_DOMAIN_SHARE
    ) {
      domainFlags.set(domain, "concentrated_domain")
      flag(votes, "concentrated_domain", domain)
    }
  }

  for (const [mailbox, votes] of groupBy(rows, (vote) => vote.voterEmail && normalizeEmail(vote.voterEmail))) {
    // The earliest account is taken as the real one; only the extra accounts are flagged.
    const extras = [...votes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(1)
    if (extras.length > 0) flag(extras, "email_alias", mailbox)
  }

  for (const [ip, votes] of groupBy(rows, (vote) => vote.ipAddress)) {
    for (const projectVotes of groupBy(votes, (vote) => vote.projectId).values()) {
      const ipFlag: VoteFlag | null =
        projectVotes.length >= IP_CLUSTER_MIN ? "ip_cluster" : projectVotes.length >= SHARED_IP_MIN ? "shared_ip" : null
      if (!ipFlag) continue
      if (ipFlags.get(ip) !== "ip_cluster") ipFlags.set(ip, ipFlag)
      flag(projectVotes, ipFlag, ip)
    }
  }

  const analyzed: AnalyzedVote[] = rows.map((row) => {
    const flags = [...(flagsByVote.get(row.voteId) ?? [])]
    const level = flags.some((f) => FLAG_LEVEL[f] === "suspect") ? "suspect" : flags.length > 0 ? "review" : null
    return { ...row, domain: emailDomain(row.voterEmail), flags, level }
  })

  const standings = [...groupBy(analyzed, (vote) => vote.projectId).values()]
    .map((votes) => {
      const suspect = votes.filter((vote) => vote.level === "suspect").length
      return {
        projectId: votes[0].projectId,
        title: votes[0].projectTitle,
        votes: votes.length,
        suspect,
        review: votes.filter((vote) => vote.level === "review").length,
        clean: votes.length - suspect,
        distinctIps: distinct(votes.map((vote) => vote.ipAddress)),
        rank: 0,
        cleanRank: 0,
      }
    })
    .sort((a, b) => b.clean - a.clean || b.votes - a.votes)
  standings.forEach((standing, index) => (standing.cleanRank = index + 1))
  standings.sort((a, b) => b.votes - a.votes || b.clean - a.clean)
  standings.forEach((standing, index) => (standing.rank = index + 1))

  const scoped = (projectId ? analyzed.filter((vote) => vote.projectId === projectId) : analyzed).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
  const suspect = scoped.filter((vote) => vote.level === "suspect").length
  const timeline = buildTimeline(scoped)

  return {
    totals: {
      votes: scoped.length,
      voters: distinct(scoped.map((vote) => vote.userId)),
      suspect,
      review: scoped.filter((vote) => vote.level === "review").length,
      clean: scoped.length - suspect,
      distinctIps: distinct(scoped.map((vote) => vote.ipAddress)),
      missingSignals: scoped.filter((vote) => !vote.voterEmail || !vote.ipAddress).length,
      lastHour: scoped.filter((vote) => now.getTime() - vote.createdAt.getTime() <= 60 * 60 * 1000).length,
      peakBucketVotes: Math.max(0, ...timeline.buckets.map((bucket) => bucket.votes)),
    },
    bucketMinutes: timeline.bucketMinutes,
    timeline: timeline.buckets,
    hourOfDay: Array.from(
      { length: 24 },
      (_, hour) => scoped.filter((vote) => riyadhHour(vote.createdAt) === hour).length
    ),
    quietHours: measureQuietHours(scoped),
    standings,
    domains: [...groupBy(scoped, (vote) => vote.domain)]
      .map(([domain, votes]) => {
        const top = topProject(votes)
        return {
          domain,
          votes: votes.length,
          projects: top.projects,
          topProjectTitle: top.title,
          flag: domainFlags.get(domain) ?? null,
        }
      })
      .sort((a, b) => b.votes - a.votes),
    ipGroups: [...groupBy(scoped, (vote) => vote.ipAddress)]
      .filter(([, votes]) => votes.length >= 3)
      .map(([ip, votes]) => {
        const top = topProject(votes)
        return {
          ip,
          votes: votes.length,
          projects: top.projects,
          topProjectTitle: top.title,
          devices: distinct(votes.map((vote) => vote.device)),
          ...timeRange(votes),
          flag: ipFlags.get(ip) ?? null,
        }
      })
      .sort((a, b) => b.votes - a.votes),
    devices: [...groupBy(scoped, (vote) => vote.device)]
      .map(([device, votes]) => ({ device, votes: votes.length }))
      .sort((a, b) => b.votes - a.votes),
    alerts: alerts
      .filter((alert) => !projectId || alert.projectId === projectId)
      .sort((a, b) => Number(b.level === "suspect") - Number(a.level === "suspect") || b.votes - a.votes),
    votes: scoped,
  }
}

export function riyadhHour(date: Date) {
  return (date.getUTCHours() + RIYADH_OFFSET_HOURS) % 24
}

function isQuietHour(date: Date) {
  const hour = riyadhHour(date)
  return hour >= QUIET_HOURS.start && hour < QUIET_HOURS.end
}

/** Compares the vote rate in the small hours with the rest of the day, over the hours voting has actually run. */
function measureQuietHours(votes: AnalyzedVote[]) {
  if (votes.length === 0) return { hours: 0, votes: 0, perHour: 0, activePerHour: 0, alarming: false }

  const { firstAt, lastAt } = timeRange(votes)
  let quietHours = 0
  let activeHours = 0
  for (let hour = Math.floor(firstAt.getTime() / HOUR_MS); hour <= Math.floor(lastAt.getTime() / HOUR_MS); hour++) {
    if (isQuietHour(new Date(hour * HOUR_MS))) quietHours++
    else activeHours++
  }

  const quietVotes = votes.filter((vote) => isQuietHour(vote.createdAt)).length
  const perHour = quietHours > 0 ? quietVotes / quietHours : 0
  const activePerHour = activeHours > 0 ? (votes.length - quietVotes) / activeHours : 0
  return {
    hours: quietHours,
    votes: quietVotes,
    perHour,
    activePerHour,
    alarming: quietVotes >= QUIET_MIN_VOTES && perHour >= activePerHour * QUIET_RATE_ALARM,
  }
}

function buildTimeline(votes: AnalyzedVote[]) {
  if (votes.length === 0) return { bucketMinutes: TIMELINE_BUCKET_MINUTES[0], buckets: [] }

  const { firstAt, lastAt } = timeRange(votes)
  const spanMinutes = (lastAt.getTime() - firstAt.getTime()) / 60000
  const bucketMinutes =
    TIMELINE_BUCKET_MINUTES.find((minutes) => spanMinutes / minutes < TIMELINE_MAX_BUCKETS) ??
    Math.ceil(spanMinutes / TIMELINE_MAX_BUCKETS / 1440) * 1440
  const bucketMs = bucketMinutes * 60000
  const firstBucket = Math.floor(firstAt.getTime() / bucketMs)
  const buckets = Array.from({ length: Math.floor(lastAt.getTime() / bucketMs) - firstBucket + 1 }, (_, index) => ({
    start: new Date((firstBucket + index) * bucketMs),
    votes: 0,
    suspect: 0,
    // Day-sized buckets span the quiet hours rather than fall inside them.
    quiet: bucketMinutes <= 60 && isQuietHour(new Date((firstBucket + index) * bucketMs)),
  }))

  for (const vote of votes) {
    const bucket = buckets[Math.floor(vote.createdAt.getTime() / bucketMs) - firstBucket]
    bucket.votes += 1
    if (vote.level === "suspect") bucket.suspect += 1
  }

  return { bucketMinutes, buckets }
}
