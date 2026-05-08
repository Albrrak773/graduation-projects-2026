"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { IconBell, IconBellRinging, IconSend, IconUsers } from "@tabler/icons-react"
import { sendNotification, getSubscribers, getNotifications } from "@/app/notifications/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Subscriber = {
  id: string
  endpoint: string
  createdAt: Date
}

type NotificationRow = {
  id: string
  title: string
  body: string
  sent: number
  failed: number
  createdAt: Date
}

function arabicCount(count: number, singular: string, dual: string, plural: string): string {
  if (count === 0) return "0"
  if (count === 1) return `${singular} واحد`
  if (count === 2) return dual
  if (count <= 10) return `${count} ${plural}`
  return `${count} ${singular}`
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatRelativeTime(date: Date) {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "الآن"
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  return formatDate(date)
}

function getPlatformHint(endpoint: string) {
  if (endpoint.includes("fcm.googleapis.com")) return "Android / Chrome"
  if (endpoint.includes("web.push.apple.com")) return "iOS / Safari"
  if (endpoint.includes("updates.push.services.mozilla.com")) return "Firefox"
  return "متصفح آخر"
}

export default function AdminNotificationsPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const loaded = useRef(false)

  const loadData = useCallback(async () => {
    const [subs, notifs] = await Promise.all([getSubscribers(), getNotifications()])
    setSubscribers(subs as Subscriber[])
    setNotifications(notifs as NotificationRow[])
  }, [])

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    loadData()
  }, [loadData])

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await sendNotification(title, body)
      if (res.success && "sent" in res) {
        setResult({ sent: res.sent ?? 0, failed: res.failed ?? 0 })
      }
      setTitle("")
      setBody("")
      await loadData()
    } catch {
      // error
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">إدارة الإشعارات</h1>
        <p className="mt-1 text-sm text-muted-foreground">إرسال إشعارات وإدارة المشتركين.</p>
      </div>

      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconSend className="size-4" />
          </span>
          <h2 className="font-heading text-lg font-bold">ارسل إشعار</h2>
        </div>

        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="العنوان"
            className="font-heading"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="نص الإشعار..."
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim() || subscribers.length === 0}
            className="w-full"
          >
            {sending ? "جارٍ الإرسال..." : "إرسال للجميع"}
          </Button>
        </div>

        {result && (
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-emerald-600">تم الإرسال لـ{result.sent}</span>
            {result.failed > 0 && <span className="text-destructive">فشل: {result.failed}</span>}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconUsers className="size-4" />
            </span>
            <h2 className="font-heading text-lg font-bold">المشتركين</h2>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {arabicCount(subscribers.length, "مشترك", "مشتركان", "مشتركين")}
          </span>
        </div>

        {subscribers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">ما فيه مشتركين للحين 😕 ماش التسويق نايم...</p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {subscribers.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{getPlatformHint(sub.endpoint)}</span>
                  <span className="max-w-60 truncate font-mono text-[11px] text-muted-foreground/70">
                    ...{sub.endpoint.slice(-16)}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(sub.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              {notifications.length > 0 ? <IconBellRinging className="size-4" /> : <IconBell className="size-4" />}
            </span>
            <h2 className="font-heading text-lg font-bold">الإشعارات المرسلة</h2>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {arabicCount(notifications.length, "إشعار", "إشعاران", "إشعارات")}
          </span>
        </div>

        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لم يتم إرسال إشعارات بعد.</p>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {notifications.map((notif) => (
              <div key={notif.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-bold">{notif.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notif.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(notif.createdAt)}</span>
                </div>
                <div className="mt-2 flex gap-3 text-xs">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600">
                    تم الإرسال لـ{notif.sent}
                  </span>
                  {notif.failed > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                      فشل: {notif.failed}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
