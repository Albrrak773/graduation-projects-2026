"use client"

import dynamic from "next/dynamic"

const NotificationBanner = dynamic(
  () => import("@/components/notification-banner").then((m) => ({ default: m.NotificationBanner })),
  { ssr: false }
)

export function NotificationBannerSlot() {
  return <NotificationBanner />
}
