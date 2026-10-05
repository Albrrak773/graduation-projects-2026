import { currentUser } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { describeDevice } from "@/lib/vote-device"

export type VoteSignals = {
  voterEmail: string | null
  ipAddress: string | null
  device: string | null
}

/**
 * Reads who is voting and from where. Never throws: a vote must still be cast
 * when Clerk or the proxy headers are unavailable.
 */
export async function captureVoteSignals(): Promise<VoteSignals> {
  const signals: VoteSignals = { voterEmail: null, ipAddress: null, device: null }

  try {
    const headerList = await headers()
    const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim()
    signals.ipAddress = (forwardedFor || headerList.get("x-real-ip") || "").slice(0, 64) || null
    signals.device = describeDevice(headerList.get("user-agent"))
  } catch {}

  try {
    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress
    signals.voterEmail = email ? email.toLowerCase().slice(0, 255) : null
  } catch {}

  return signals
}
