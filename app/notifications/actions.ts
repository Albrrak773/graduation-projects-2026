"use server"

import { eq } from "drizzle-orm"
import webpush from "web-push"
import { config } from "@/lib/config"
import { subscriptionsTable } from "@/db/schema"

webpush.setVapidDetails(
  "mailto:albrrak773@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function subscribeUser(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  try {
    await config.db
      .insert(subscriptionsTable)
      .values({
        endpoint: sub.endpoint,
        keys: JSON.stringify(sub.keys),
      })
      .onConflictDoNothing()
    return { success: true }
  } catch (error) {
    console.error("Error saving subscription:", error)
    return { success: false, error: "Failed to save subscription" }
  }
}

export async function unsubscribeUser(endpoint: string) {
  try {
    await config.db.delete(subscriptionsTable).where(eq(subscriptionsTable.endpoint, endpoint))
    return { success: true }
  } catch (error) {
    console.error("Error removing subscription:", error)
    return { success: false, error: "Failed to remove subscription" }
  }
}

export async function sendNotification(message: string) {
  const allSubs = await config.db.select().from(subscriptionsTable)

  if (allSubs.length === 0) {
    return { success: false, error: "No subscribers" }
  }

  const payload = JSON.stringify({
    title: "مشاريع التخرج",
    body: message,
    icon: "/android-chrome-192x192.png",
  })

  let sent = 0
  let failed = 0

  for (const sub of allSubs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys),
        },
        payload
      )
      sent++
    } catch {
      if (sub.endpoint) {
        await config.db.delete(subscriptionsTable).where(eq(subscriptionsTable.endpoint, sub.endpoint))
      }
      failed++
    }
  }

  return { success: true, sent, failed }
}

export async function getSubscribers() {
  const allSubs = await config.db.select().from(subscriptionsTable)
  return allSubs
}
