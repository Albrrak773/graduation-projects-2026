"use client"

import { useCallback, useEffect, useSyncExternalStore, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

const DISMISS_STORAGE_KEY = "notifications-banner-dismissed-until"
const DISMISS_TTL_MS = 30 * 60 * 1000
const SHOW_BANNER_EVENT = "notifications:show-banner"

function isIOS() {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone: boolean }).standalone === true
  )
}

let dismissListeners: Array<() => void> = []

function subscribeToDismiss(callback: () => void) {
  dismissListeners.push(callback)
  return () => {
    dismissListeners = dismissListeners.filter((l) => l !== callback)
  }
}

function notifyDismissChange() {
  for (const listener of dismissListeners) listener()
}

function getDismissSnapshot() {
  if (typeof window === "undefined") return "0"
  const raw = localStorage.getItem(DISMISS_STORAGE_KEY)
  if (!raw) return "0"
  return Number(raw) > Date.now() ? "1" : "0"
}

function getDismissServerSnapshot() {
  return "0"
}

export function OneSignalBanner() {
  const isDismissed = useSyncExternalStore(subscribeToDismiss, getDismissSnapshot, getDismissServerSnapshot) === "1"
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const initializedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-restore banner after dismiss TTL expires
  useEffect(() => {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY)
    if (!raw) return
    const remaining = Number(raw) - Date.now()
    if (remaining <= 0) {
      localStorage.removeItem(DISMISS_STORAGE_KEY)
      notifyDismissChange()
      return
    }
    const timer = setTimeout(() => {
      localStorage.removeItem(DISMISS_STORAGE_KEY)
      notifyDismissChange()
    }, remaining)
    return () => clearTimeout(timer)
  }, [])

  const initOneSignal = useCallback(async () => {
    if (initializedRef.current) return
    initializedRef.current = true
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.initialized
      setIsSubscribed(OneSignal.User.PushSubscription.optedIn)
      OneSignal.User.PushSubscription.addEventListener("change", () => {
        setIsSubscribed(OneSignal.User.PushSubscription.optedIn)
      })
    })
  }, [])

  useEffect(() => {
    initOneSignal()
  }, [initOneSignal])

  useEffect(() => {
    function handleShowBanner() {
      localStorage.removeItem(DISMISS_STORAGE_KEY)
      notifyDismissChange()
    }

    window.addEventListener(SHOW_BANNER_EVENT, handleShowBanner)
    return () => window.removeEventListener(SHOW_BANNER_EVENT, handleShowBanner)
  }, [])

  function handleSubscribe() {
    const link = containerRef.current?.querySelector("a, button")
    if (link instanceof HTMLElement) {
      link.click()
      return
    }
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      setIsLoading(true)
      try {
        await OneSignal.Slidedown.promptPush()
      } catch {
      } finally {
        setIsLoading(false)
      }
    })
  }

  function handleUnsubscribe() {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      setIsLoading(true)
      try {
        await OneSignal.User.PushSubscription.optOut()
      } catch {
      } finally {
        setIsLoading(false)
      }
    })
  }

  function handleDismiss() {
    const next = Date.now() + DISMISS_TTL_MS
    localStorage.setItem(DISMISS_STORAGE_KEY, String(next))
    notifyDismissChange()
  }

  // Hide banner only when dismissed AND not subscribed
  if (isDismissed && !isSubscribed) return null

  const iosSafari = isIOS() && !isStandalone()

  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 md:px-12">
        <div className="flex flex-1 flex-col gap-1 text-sm text-foreground">
          <span className="font-heading text-base font-bold">
            {isSubscribed ? "الإشعارات مفعّلة" : "فعّل إشعارات مشاريع التخرج"}
          </span>
          {iosSafari && !isSubscribed ? (
            <span className="text-xs text-muted-foreground">
              أضف الموقع للشاشة الرئيسية على آيفون لتفعيل الإشعارات.
            </span>
          ) : isSubscribed ? (
            <span className="text-xs text-muted-foreground">
              ستستلم إشعارات فورية عن أحدث المشاريع والمستجدات المهمة.
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              استلم إشعارات فورية عن أحدث المشاريع والمستجدات المهمة.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            ref={containerRef}
            className="onesignal-customlink-container"
            style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", clip: "rect(0,0,0,0)" }}
          />
          {iosSafari && !isSubscribed ? (
            <Button size="sm" variant="outline" disabled>
              غير متاح على سفاري
            </Button>
          ) : isSubscribed ? (
            <Button size="sm" variant="outline" onClick={handleUnsubscribe} disabled={isLoading}>
              {isLoading ? "جارٍ الإلغاء…" : "إلغاء الاشتراك"}
            </Button>
          ) : (
            <Button size="sm" variant="default" onClick={handleSubscribe} disabled={isLoading}>
              {isLoading ? "جارٍ التفعيل…" : "اشترك"}
            </Button>
          )}
          {!isSubscribed && (
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              إخفاء
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export { SHOW_BANNER_EVENT }
