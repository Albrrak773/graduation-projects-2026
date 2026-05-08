import { Suspense } from "react"
import { IconBell, IconFolder, IconSend, IconUsers } from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { config } from "@/lib/config"
import { sql } from "drizzle-orm"

async function getStats() {
  const result = await config.db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM projects) AS projects,
      (SELECT COUNT(*) FROM admins) AS admins,
      (SELECT COUNT(*) FROM subscriptions) AS subscribers,
      (SELECT COUNT(*) FROM notifications) AS notifications
  `)
  const row = result.rows[0] as Record<string, string>
  return {
    projects: Number(row.projects),
    admins: Number(row.admins),
    subscribers: Number(row.subscribers),
    notifications: Number(row.notifications),
  }
}

const statCards = [
  { title: "إجمالي المشاريع", key: "projects" as const, icon: IconFolder },
  { title: "المشرفين", key: "admins" as const, icon: IconUsers },
  { title: "المشتركين", key: "subscribers" as const, icon: IconBell },
  { title: "الإشعارات المرسلة", key: "notifications" as const, icon: IconSend },
]

function StatsGrid() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.key}>
              <CardContent className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="size-5 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                  <div className="h-7 w-12 animate-pulse rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    >
      <StatsCards />
    </Suspense>
  )
}

async function StatsCards() {
  const stats = await getStats()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.key}>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="size-5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-muted-foreground">{stat.title}</span>
              <span className="font-mono text-2xl leading-none font-bold tabular-nums">
                {stats[stat.key].toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">الرئيسية</h1>
        <p className="mt-1 text-sm text-muted-foreground">نظرة عامة على النظام</p>
      </div>
      <StatsGrid />
    </div>
  )
}
