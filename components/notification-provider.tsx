"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { subscribeUser, unsubscribeUser } from "@/app/notifications/actions"

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const decoded = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(decoded)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const emptySubscribe = () => () => {}

function useIsSupported() {
  return useSyncExternalStore(
    emptySubscribe,
    () => "serviceWorker" in navigator && "PushManager" in window,
    () => false
  )
}

function useIsIOS() {
  return useSyncExternalStore(
    emptySubscribe,
    () => /iPad|iPhone|iPod/.test(navigator.userAgent),
    () => false
  )
}

function useIsStandalone() {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false
  )
}

interface NotificationContextValue {
  isInitialized: boolean
  isSupported: boolean
  subscription: PushSubscription | null
  isIOS: boolean
  isStandalone: boolean
  loading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  openModal: boolean
  setOpenModal: (open: boolean) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider")
  return ctx
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const isSupported = useIsSupported()
  const isIOS = useIsIOS()
  const isStandalone = useIsStandalone()

  useEffect(() => {
    if (!isSupported) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInitialized(true)
      return
    }
    let cancelled = false
    async function init() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        const sub = await registration.pushManager.getSubscription()
        if (!cancelled) setSubscription(sub)
      } catch {
        // SW registration failed
      } finally {
        if (!cancelled) setIsInitialized(true)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [isSupported])

  const subscribe = useCallback(async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      await subscribeUser(JSON.parse(JSON.stringify(sub)))
      setSubscription(sub)
    } catch (err) {
      console.error("Subscribe failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    setLoading(true)
    try {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      await unsubscribeUser(endpoint)
      setSubscription(null)
    } catch (err) {
      console.error("Unsubscribe failed:", err)
    } finally {
      setLoading(false)
    }
  }, [subscription])

  return (
    <NotificationContext.Provider
      value={{
        isInitialized,
        isSupported,
        subscription,
        isIOS,
        isStandalone,
        loading,
        subscribe,
        unsubscribe,
        openModal,
        setOpenModal,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
