"use client"

import { useState } from "react"
import { IconChevronDown } from "@tabler/icons-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type NotificationRow = {
  id: string
  title: string
  body: string
  createdAt: Date | null
}

export function AnnouncementCollapsible({ notifications }: { notifications: NotificationRow[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-4">
      <CollapsibleTrigger className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80">
        <IconChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "إخفاء الإشعارات السابقة" : `عرض الإشعارات السابقة (${notifications.length})`}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-xl border border-border/40 bg-background px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.body}</span>
                {n.createdAt && (
                  <span className="mt-1 text-[11px] text-muted-foreground/70">{formatRelativeDate(n.createdAt)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "الآن"
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays < 7) return `منذ ${diffDays} يوم`
  return date.toLocaleDateString("ar-SA")
}
