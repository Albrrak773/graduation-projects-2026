"use client"

import { useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import { IconBellRinging } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/notification-provider"

const DISMISS_KEY = "notification-banner-dismissed-until"
const DISMISS_TTL_MS = 60 * 60 * 1000

const dismissCallbacks = new Set<() => void>()

function subscribeDismiss(callback: () => void) {
  dismissCallbacks.add(callback)
  const onStorage = (e: StorageEvent) => {
    if (e.key === DISMISS_KEY) callback()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    dismissCallbacks.delete(callback)
    window.removeEventListener("storage", onStorage)
  }
}

function getDismissSnapshot() {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return "0"
  return Number(raw) > Date.now() ? "1" : "0"
}

function getDismissServerSnapshot() {
  return "0"
}

function dismissBanner() {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_TTL_MS))
  dismissCallbacks.forEach((cb) => cb())
}

export function NotificationBanner() {
  const pathname = usePathname()
  const { subscription, setOpenModal } = useNotification()
  const dismissed = useSyncExternalStore(subscribeDismiss, getDismissSnapshot, getDismissServerSnapshot) === "1"

  if (pathname.startsWith("/admin")) return null
  if (subscription || dismissed) return null

  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 md:px-12">
        <div className="flex flex-1 items-center gap-3 text-sm text-foreground">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <IconBellRinging className="size-5" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="font-heading text-base font-bold">جااااك العلم</span>
            <span className="text-xs text-muted-foreground">لا تفوتك أخبار الحفل، فعّل الإشعارات وتابع أول بأول.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setOpenModal(true)}>
            فعّل الآن
          </Button>
          <Button size="sm" variant="ghost" onClick={dismissBanner}>
            إخفاء
          </Button>
        </div>
      </div>
    </div>
  )
}
