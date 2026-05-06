"use client"

import { useSyncExternalStore } from "react"
import { IconBellRinging, IconX } from "@tabler/icons-react"
import { useNotification } from "@/components/notification-provider"

const DISMISS_KEY = "notification-banner-dismissed"
const DISMISS_DURATION = 60 * 60 * 1000

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
  if (!raw) return false
  return Date.now() - Number(raw) <= DISMISS_DURATION
}

function getDismissServerSnapshot() {
  return true
}

export function dismissBanner() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()))
  dismissCallbacks.forEach((cb) => cb())
}

export function NotificationBanner() {
  const { isSupported, subscription, setOpenModal } = useNotification()
  const dismissed = useSyncExternalStore(subscribeDismiss, getDismissSnapshot, getDismissServerSnapshot)
  const show = isSupported && !subscription && !dismissed

  if (!show) return null

  return (
    <div className="flex items-center gap-3 border-b bg-primary/10 px-4 py-2.5 text-sm">
      <IconBellRinging className="size-5 shrink-0 text-primary" />
      <p className="flex-1 text-foreground">فعّل الإشعارات ليصلك كل جديد</p>
      <button
        onClick={() => setOpenModal(true)}
        className="shrink-0 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        تفعيل
      </button>
      <button
        onClick={dismissBanner}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="إغلاق"
      >
        <IconX className="size-4" />
      </button>
    </div>
  )
}
