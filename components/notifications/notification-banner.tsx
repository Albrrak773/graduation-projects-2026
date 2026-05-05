"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import OneSignal from "react-onesignal"
import { IconBell, IconDeviceMobile } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { OPEN_NOTIFICATIONS_DRAWER_EVENT } from "@/components/notifications/notification-events"

const DISMISS_STORAGE_KEY = "notifications-banner-dismissed-until"
const DISMISS_TTL_MS = 30 * 60 * 1000
const CLIENT_NOW = typeof window === "undefined" ? 0 : Date.now()

type SubscriptionChangeEvent = {
  current: {
    optedIn?: boolean
  }
}

type OneSignalState = {
  ready: boolean
  supported: boolean
  subscribed: boolean
  permission: NotificationPermission
  error: boolean
}

const initialState: OneSignalState = {
  ready: false,
  supported: false,
  subscribed: false,
  permission: "default",
  error: false,
}

export function NotificationBanner() {
  const [oneSignalState, setOneSignalState] = useState<OneSignalState>(initialState)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const initAttempted = useRef(false)
  const dismissTimeout = useRef<number | null>(null)

  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY)
    const dismissedUntil = raw ? Number(raw) : 0
    return dismissedUntil > 0 && !Number.isNaN(dismissedUntil) && dismissedUntil > CLIENT_NOW
  })

  const [isIos] = useState(() => {
    if (typeof window === "undefined") return false
    const ua = window.navigator.userAgent
    return (
      /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
    )
  })

  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false
    const iosStandaloneNavigator = window.navigator as Navigator & { standalone?: boolean }
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in iosStandaloneNavigator && iosStandaloneNavigator.standalone === true)
    )
  })

  const handlePermissionChange = useCallback(() => {
    setOneSignalState((prev) => ({
      ...prev,
      permission: OneSignal.Notifications.permissionNative,
    }))
  }, [])

  const handleSubscriptionChange = useCallback((event: SubscriptionChangeEvent) => {
    setOneSignalState((prev) => ({
      ...prev,
      subscribed: Boolean(event.current.optedIn),
    }))
  }, [])

  useEffect(() => {
    if (initAttempted.current) return
    initAttempted.current = true
    let isActive = true

    async function initOneSignal() {
      try {
        try {
          await OneSignal.init({
            appId: "b811652a-61e7-4fc8-b989-ec55ceebf5fc",
            allowLocalhostAsSecureOrigin: true,
            autoResubscribe: true,
            notifyButton: {
              enable: false,
              prenotify: false,
              showCredit: false,
              text: {
                "dialog.blocked.message": "",
                "dialog.blocked.title": "",
                "dialog.main.button.subscribe": "",
                "dialog.main.button.unsubscribe": "",
                "dialog.main.title": "",
                "message.action.resubscribed": "",
                "message.action.subscribed": "",
                "message.action.subscribing": "",
                "message.action.unsubscribed": "",
                "message.prenotify": "",
                "tip.state.blocked": "",
                "tip.state.subscribed": "",
                "tip.state.unsubscribed": "",
              },
            },
            promptOptions: {
              slidedown: {
                prompts: [
                  {
                    type: "push",
                    autoPrompt: false,
                    delay: { timeDelay: 0 },
                  },
                ],
              },
            },
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            welcomeNotification: { disable: true, message: "" },
          })
        } catch (initError) {
          if (typeof initError === "string" && initError.includes("already initialized")) {
            // Ignore double-init in React dev or fast refresh
          }
        }

        if (!isActive) return

        const supported = OneSignal.Notifications.isPushSupported()
        const permission = OneSignal.Notifications.permissionNative || Notification.permission || "default"
        const subscribed = Boolean(OneSignal.User.PushSubscription.optedIn)

        setOneSignalState({
          ready: true,
          supported,
          subscribed,
          permission,
          error: false,
        })

        OneSignal.Notifications.addEventListener("permissionChange", handlePermissionChange)
        OneSignal.User.PushSubscription.addEventListener("change", handleSubscriptionChange)
      } catch {
        if (!isActive) return
        setOneSignalState((prev) => ({ ...prev, ready: true, error: true }))
      }
    }

    initOneSignal()

    return () => {
      isActive = false
      try {
        OneSignal.Notifications.removeEventListener("permissionChange", handlePermissionChange)
        OneSignal.User.PushSubscription.removeEventListener("change", handleSubscriptionChange)
      } catch {
        return
      }
    }
  }, [handlePermissionChange, handleSubscriptionChange])

  useEffect(() => {
    function handleOpenDrawer() {
      setIsDrawerOpen(true)
    }

    window.addEventListener(OPEN_NOTIFICATIONS_DRAWER_EVENT, handleOpenDrawer)

    return () => {
      window.removeEventListener(OPEN_NOTIFICATIONS_DRAWER_EVENT, handleOpenDrawer)
    }
  }, [])

  const isIosSetupRequired = isIos && !isStandalone
  const shouldShowBanner = oneSignalState.ready && (isDrawerOpen || (!isDismissed && !oneSignalState.subscribed))

  const statusMessage = useMemo(() => {
    if (oneSignalState.subscribed) {
      return "الإشعارات مفعلة لهذا الجهاز."
    }
    if (isIosSetupRequired) {
      return "التفعيل على iOS يتطلب إضافة الموقع إلى الشاشة الرئيسية أولاً."
    }
    if (!oneSignalState.supported) {
      return "المتصفح الحالي لا يدعم إشعارات الويب أو لم يتم تفعيل HTTPS."
    }
    if (oneSignalState.permission === "denied") {
      return "الإشعارات محظورة من إعدادات المتصفح."
    }
    if (oneSignalState.error) {
      return "تعذر تفعيل الإشعارات حالياً. حاول تحديث الصفحة أو تعطيل مانع الإعلانات."
    }
    return "الإشعارات غير مفعلة حالياً."
  }, [
    isIosSetupRequired,
    oneSignalState.error,
    oneSignalState.permission,
    oneSignalState.subscribed,
    oneSignalState.supported,
  ])

  const handleDismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      const dismissedUntil = Date.now() + DISMISS_TTL_MS
      window.localStorage.setItem(DISMISS_STORAGE_KEY, String(dismissedUntil))
      if (dismissTimeout.current) {
        window.clearTimeout(dismissTimeout.current)
      }
      dismissTimeout.current = window.setTimeout(() => {
        window.localStorage.removeItem(DISMISS_STORAGE_KEY)
        setIsDismissed(false)
      }, DISMISS_TTL_MS)
    }
    setIsDismissed(true)
    setIsDrawerOpen(false)
  }, [])

  useEffect(() => {
    return () => {
      if (dismissTimeout.current) {
        window.clearTimeout(dismissTimeout.current)
      }
    }
  }, [])

  const handleSubscribe = useCallback(async () => {
    if (isProcessing) return
    if (isIosSetupRequired) return
    if (!oneSignalState.supported) return

    setIsProcessing(true)
    try {
      if (oneSignalState.permission !== "granted") {
        const granted = await OneSignal.Notifications.requestPermission()
        const nextPermission = granted
          ? "granted"
          : OneSignal.Notifications.permissionNative || Notification.permission || "default"
        setOneSignalState((prev) => ({
          ...prev,
          permission: nextPermission,
        }))
        if (!granted) {
          return
        }
      }

      await OneSignal.User.PushSubscription.optIn()
      setOneSignalState((prev) => ({ ...prev, subscribed: true }))
    } catch {
      return
    } finally {
      setIsProcessing(false)
    }
  }, [isIosSetupRequired, isProcessing, oneSignalState.permission, oneSignalState.supported])

  const handleUnsubscribe = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await OneSignal.User.PushSubscription.optOut()
      setOneSignalState((prev) => ({ ...prev, subscribed: false }))
    } catch {
      return
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing])

  if (!shouldShowBanner) return null

  const actionLabel = oneSignalState.subscribed ? "إيقاف الإشعارات" : "تفعيل الإشعارات"
  const actionHandler = oneSignalState.subscribed ? handleUnsubscribe : handleSubscribe
  const actionVariant = oneSignalState.subscribed ? "outline" : "default"
  const isActionDisabled =
    isProcessing ||
    oneSignalState.error ||
    (oneSignalState.permission === "denied" && !oneSignalState.subscribed) ||
    isIosSetupRequired ||
    !oneSignalState.supported

  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 md:px-12">
        <div className="flex flex-1 items-center gap-3 text-sm text-foreground">
          <span className="flex size-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <IconBell data-icon="inline-start" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-heading text-base font-bold">فعّل إشعارات مشاريع التخرج</span>
            <span className="text-xs text-muted-foreground">
              استلم إشعارات فورية عن أحدث المشاريع والمستجدات المهمة.
            </span>
          </div>
        </div>

        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <div className="flex items-center gap-2">
            <DrawerTrigger asChild>
              <Button size="sm">فعّل الآن</Button>
            </DrawerTrigger>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              إخفاء
            </Button>
          </div>

          <DrawerContent>
            <div className="mx-auto flex w-full max-w-md flex-col gap-4">
              <DrawerHeader>
                <DrawerTitle>إدارة إشعارات الموقع</DrawerTitle>
                <DrawerDescription>تحكم في اشتراكك واحصل على التنبيهات عند نشر مشاريع جديدة.</DrawerDescription>
              </DrawerHeader>

              <div className="flex flex-col gap-3 px-4">
                <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background px-4 py-3">
                  <span className="text-xs font-semibold text-foreground">الحالة الحالية</span>
                  <span className="text-xs text-muted-foreground">{statusMessage}</span>
                </div>

                {isIosSetupRequired ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-background">
                        <IconDeviceMobile data-icon="inline-start" />
                      </span>
                      <span className="font-semibold">خطوات التفعيل على iOS</span>
                    </div>
                    <ol className="flex list-decimal flex-col gap-2 ps-5">
                      <li>افتح الموقع باستخدام Safari.</li>
                      <li>اضغط زر المشاركة.</li>
                      <li>اختر &quot;إضافة إلى الشاشة الرئيسية&quot;.</li>
                      <li>افتح الموقع من الشاشة الرئيسية لتفعيل الإشعارات.</li>
                    </ol>
                  </div>
                ) : null}

                {oneSignalState.permission === "denied" && !oneSignalState.subscribed ? (
                  <p className="text-xs text-muted-foreground">
                    يمكنك إعادة السماح بالإشعارات من إعدادات المتصفح إذا رغبت في تفعيلها لاحقاً.
                  </p>
                ) : null}
              </div>

              <DrawerFooter className="gap-3">
                <Button size="lg" variant={actionVariant} onClick={actionHandler} disabled={isActionDisabled}>
                  {isIosSetupRequired ? "التفعيل متاح بعد الإضافة للشاشة الرئيسية" : actionLabel}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" size="lg">
                    إغلاق
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
