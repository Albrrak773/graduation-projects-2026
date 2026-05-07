"use client"

import { useState } from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { IconChevronDown } from "@tabler/icons-react"
import { Separator } from "@/components/ui/separator"

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />
}

function CollapsibleContent({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />
}

type NotificationRow = {
  id: string
  title: string
  body: string
  createdAt: Date | null
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

export function AnnouncementCollapsible({ notifications }: { notifications: NotificationRow[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Separator className="my-4" />
      <CollapsibleTrigger className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80">
        <IconChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        {open ? "إخفاء الإعلانات السابقة" : `عرض الإعلانات السابقة (${notifications.length})`}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <ul className="flex flex-col gap-2.5">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{n.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
              {n.createdAt && (
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">{formatRelativeDate(n.createdAt)}</p>
              )}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
