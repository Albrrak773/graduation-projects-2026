"use client"

import { useRef, useEffect, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import { IconBellRinging, IconX } from "@tabler/icons-react"
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
  const { subscription, setOpenModal, isInitialized } = useNotification()
  const dismissed = useSyncExternalStore(subscribeDismiss, getDismissSnapshot, getDismissServerSnapshot) === "1"
  const ref = useRef<HTMLDivElement>(null)

  const visible = isInitialized && !pathname.startsWith("/admin") && !subscription && !dismissed

  useEffect(() => {
    if (!visible || !ref.current) {
      document.documentElement.style.setProperty("--notification-bar-height", "0px")
      return
    }
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--notification-bar-height", `${ref.current?.offsetHeight ?? 0}px`)
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])

  if (!visible) return null

  return (
    <div
      ref={ref}
      className="sticky top-0 z-20 border-b bg-[#0d2b6b] text-white shadow-lg"
      style={{ borderColor: "rgba(142, 220, 230, 0.25)", boxShadow: "0 4px 16px rgba(13, 43, 107, 0.3)" }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6 md:px-12">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm sm:gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#8edce6]">
            <IconBellRinging className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-xs leading-5 font-bold text-white sm:text-base">
              لا تفوّت تحديثات معرض مشاريع التخرج، فعّل الإشعارات لتصلك أخبار الحفل وأهم التنبيهات أولاً بأول.
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            size="sm"
            className="h-9 rounded-full bg-white px-3 text-xs font-bold text-[#0d2b6b] hover:bg-white/90 sm:px-4 sm:text-sm"
            onClick={() => setOpenModal(true)}
          >
            <span className="sm:hidden">فعّل</span>
            <span className="hidden sm:inline">فعّل الإشعارات</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="إغلاق تنبيه الإشعارات"
            className="size-9 rounded-full text-white hover:bg-white/10 hover:text-white"
            onClick={dismissBanner}
          >
            <IconX className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
