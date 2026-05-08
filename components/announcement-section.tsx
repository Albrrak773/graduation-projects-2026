import { desc } from "drizzle-orm"
import { notificationsTable } from "@/db/schema"
import { config } from "@/lib/config"
import { IconSpeakerphone } from "@tabler/icons-react"
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
    <section className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3 px-1 pb-5 md:pb-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconSpeakerphone className="size-5" />
          </span>
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">مساحة الإعلانات</h2>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-heading text-base font-bold text-foreground md:text-lg">{latest.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{latest.body}</p>
            </div>
          </div>

          {rest.length > 0 && <AnnouncementCollapsible notifications={rest} />}
        </div>
      </div>
    </section>
  )
}
