import { desc } from "drizzle-orm"
import { notificationsTable } from "@/db/schema"
import { config } from "@/lib/config"
import { IconBellRinging } from "@tabler/icons-react"
import { AnnouncementCollapsible } from "@/components/announcement-collapsible"

async function getLatestNotifications(limit = 10) {
  return config.db.query.notificationsTable.findMany({
    orderBy: desc(notificationsTable.createdAt),
    limit,
  })
}

export async function AnnouncementSection() {
  const notifications = await getLatestNotifications(10)

  if (notifications.length === 0) return null

  const [latest, ...rest] = notifications

  return (
    <section className="px-6 py-6 md:px-12">
      <div className="rounded-2xl border border-border/60 bg-muted/40 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <IconBellRinging className="size-5" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="font-heading text-lg font-bold text-foreground">{latest.title}</h3>
            <p className="text-sm text-muted-foreground">{latest.body}</p>
          </div>
        </div>

        {rest.length > 0 && <AnnouncementCollapsible notifications={rest} />}
      </div>
    </section>
  )
}
