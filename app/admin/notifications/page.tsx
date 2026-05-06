"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">إدارة الإشعارات</h1>

      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">المشتركون</h2>
          <span className="text-sm text-muted-foreground">{subscribers.length} مشترك</span>
        </div>
        {subscribers.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا يوجد مشتركون بعد.</p>
        ) : (
          <div className="space-y-2">
            {subscribers.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="max-w-[280px] truncate font-mono text-xs text-muted-foreground">
                  {sub.endpoint.replace("https://fcm.googleapis.com/fcm/send/", "").slice(0, 40)}...
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(sub.createdAt).toLocaleDateString("ar-SA")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-heading text-lg font-bold">إرسال إشعار</h2>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="العنوان" />
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
          <div className="space-y-1 text-sm">
            <p className="text-emerald-600">تم الإرسال: {result.sent}</p>
            {result.failed > 0 && <p className="text-destructive">فشل: {result.failed}</p>}
          </div>
        )}
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-heading text-lg font-bold">الإشعارات المرسلة</h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">لم يتم إرسال إشعارات بعد.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id} className="space-y-1 rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold">{notif.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notif.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <p className="text-muted-foreground">{notif.body}</p>
                <div className="flex gap-3 text-xs">
                  <span className="text-emerald-600">تم: {notif.sent}</span>
                  {notif.failed > 0 && <span className="text-destructive">فشل: {notif.failed}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
