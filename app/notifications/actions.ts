"use server"

import { desc, eq, sql } from "drizzle-orm"
import webpush from "web-push"
import { config } from "@/lib/config"
import { notificationClicksTable, notificationsTable, subscriptionsTable } from "@/db/schema"

webpush.setVapidDetails(
  "mailto:albrrak773@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const SITE_URL = "https://graduation.gdg-q.com"

export async function subscribeUser(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  try {
    await config.db
      .insert(subscriptionsTable)
      .values({
        endpoint: sub.endpoint,
        keys: JSON.stringify(sub.keys),
      })
      .onConflictDoNothing()

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify({
          title: "اهلاااا 🎉",
          body: "الإشعارات فعّالة الحين, راح ياصلك كل جديد أول باول💙",
          icon: "/android-chrome-192x192.png",
          url: SITE_URL,
        })
      )
    } catch (err) {
      console.error("Failed to send welcome notification:", err)
    }

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

export async function sendNotification(title: string, body: string) {
  const allSubs = await config.db.select().from(subscriptionsTable)

  if (allSubs.length === 0) {
    return { success: false, error: "No subscribers" }
  }

  const [notification] = await config.db
    .insert(notificationsTable)
    .values({
      title,
      body,
      sent: 0,
      failed: 0,
    })
    .returning({ id: notificationsTable.id })

  const payload = JSON.stringify({
    title,
    body,
    icon: "/android-chrome-192x192.png",
    url: SITE_URL,
    notificationId: notification.id,
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

  await config.db.update(notificationsTable).set({ sent, failed }).where(eq(notificationsTable.id, notification.id))

  return { success: true, sent, failed, id: notification.id }
}

export async function recordClick(notificationId: string, endpoint: string) {
  try {
    await config.db.insert(notificationClicksTable).values({
      notificationId,
      endpoint,
    })

    await config.db
      .update(notificationsTable)
      .set({ clicked: sql`${notificationsTable.clicked} + 1` })
      .where(eq(notificationsTable.id, notificationId))

    return { success: true }
  } catch (error) {
    console.error("Error recording click:", error)
    return { success: false }
  }
}

export async function getSubscribers() {
  const allSubs = await config.db.select().from(subscriptionsTable)
  return allSubs
}

export async function getNotifications() {
  const allNotifs = await config.db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt))
  return allNotifs
}

export async function getNotificationClicks(notificationId: string) {
  const clicks = await config.db
    .select()
    .from(notificationClicksTable)
    .where(eq(notificationClicksTable.notificationId, notificationId))
    .orderBy(desc(notificationClicksTable.clickedAt))
  return clicks
}
