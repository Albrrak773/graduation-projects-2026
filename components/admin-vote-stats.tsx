import Link from "next/link"
import { IconAlertTriangle, IconArrowRight, IconEye, IconShieldCheck } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { VotingCampaign } from "@/db/types"
import { cn } from "@/lib/utils"
import {
  FLAG_LABEL,
  FLAG_LEVEL,
  IP_CLUSTER_MIN,
  QUIET_HOURS,
  SHARED_IP_MIN,
  type VoteAlert,
  type VoteAnalysis,
  type VoteFlag,
} from "@/lib/vote-analysis"

const VOTES_SHOWN = 100
const BREAKDOWN_ROWS = 12
const DAY_MINUTES = 1440

const ALERT_TITLE: Record<VoteFlag, string> = {
  disposable_email: "أصوات من نطاق بريد مؤقت",
  concentrated_domain: "نطاق بريد غير مألوف يصوّت لمشروع واحد",
  email_alias: "حساب إضافي بالبريد نفسه",
  ip_cluster: "أصوات كثيرة من عنوان IP واحد",
  shared_ip: "عدة أصوات من عنوان IP واحد",
}

function formatCount(value: number) {
  return value.toLocaleString("en-US")
}

function formatTime(date: Date, withDay: boolean) {
  return date.toLocaleString("ar-SA-u-ca-gregory-nu-latn", {
    timeZone: "Asia/Riyadh",
    ...(withDay ? { day: "numeric", month: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  })
}

function FlagBadge({ flag }: { flag: VoteFlag }) {
  return <Badge variant={FLAG_LEVEL[flag] === "suspect" ? "destructive" : "outline"}>{FLAG_LABEL[flag]}</Badge>
}

type Props = {
  campaigns: VotingCampaign[]
  campaign: VotingCampaign
  projectId?: string
  flaggedOnly: boolean
  analysis: VoteAnalysis
}

export function AdminVoteStats({ campaigns, campaign, projectId, flaggedOnly, analysis }: Props) {
  const { totals } = analysis
  const project = analysis.standings.find((standing) => standing.projectId === projectId)
  const withDay = analysis.bucketMinutes * analysis.timeline.length > DAY_MINUTES

  function href(next: { campaign?: string; project?: string | null; only?: boolean }) {
    const query = new URLSearchParams({ campaign: next.campaign ?? campaign.id })
    const nextProject = next.project === undefined ? projectId : next.project
    if (nextProject) query.set("project", nextProject)
    if (next.only ?? flaggedOnly) query.set("only", "flagged")
    return `/admin/voting/stats?${query}`
  }

  const shownVotes = (flaggedOnly ? analysis.votes.filter((vote) => vote.flags.length > 0) : analysis.votes).slice(
    0,
    VOTES_SHOWN
  )

  return (
    <div className="flex flex-col gap-6">
      {campaigns.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">الحملة:</span>
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={href({ campaign: c.id, project: null, only: false })}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted",
                c.id === campaign.id && "border-primary bg-primary/10 font-medium text-primary"
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {project && (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <Link
            href={href({ project: null })}
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconArrowRight className="size-4" />
            كل المشاريع
          </Link>
          <h2 className="font-heading text-lg font-bold" dir="auto">
            {project.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            الترتيب الحالي <span className="font-mono font-bold text-foreground">{project.rank}</span> من{" "}
            {analysis.standings.length}
            {project.cleanRank !== project.rank && (
              <>
                {" "}
                · بعد استبعاد الأصوات المشبوهة{" "}
                <span className="font-mono font-bold text-foreground">{project.cleanRank}</span>
              </>
            )}
          </p>
        </div>
      )}

      {totals.missingSignals > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          {formatCount(totals.missingSignals)} من الأصوات بلا بريد أو عنوان IP مسجّل، فلا تشملها مؤشرات التلاعب. شغّل{" "}
          <code dir="ltr">db/backfill-vote-signals.ts</code> لاستكمالها من Clerk.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile label="إجمالي الأصوات" value={totals.votes} />
        <StatTile label="أصوات سليمة" value={totals.clean} />
        <StatTile label="أصوات مشبوهة" value={totals.suspect} tone={totals.suspect > 0 ? "suspect" : undefined} />
        <StatTile label="تحتاج مراجعة" value={totals.review} tone={totals.review > 0 ? "review" : undefined} />
        <StatTile label="عناوين IP مختلفة" value={totals.distinctIps} />
        <StatTile label="آخر ساعة" value={totals.lastHour} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertTriangle className="size-4 text-destructive" />
            مؤشرات التلاعب
          </CardTitle>
          <CardDescription>
            «مشبوه»: بريد مؤقت، بريد مكرر، أو {IP_CLUSTER_MIN} صوتاً فأكثر لمشروع واحد من عنوان IP واحد. «مراجعة»:{" "}
            {SHARED_IP_MIN} أصوات فأكثر من عنوان IP واحد، وقد تكون عائلة أو شبكة جامعة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.alerts.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconShieldCheck className="size-4 text-emerald-600" />
              لا توجد مؤشرات تلاعب.
            </p>
          ) : (
            <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {analysis.alerts.map((alert) => (
                <AlertRow
                  key={alert.key}
                  alert={alert}
                  withDay={withDay}
                  projectHref={project ? undefined : href({ project: alert.projectId })}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الأصوات عبر الوقت</CardTitle>
          <CardDescription>
            كل عمود يمثل {formatBucket(analysis.bucketMinutes)} بتوقيت الرياض · الأعلى{" "}
            {formatCount(totals.peakBucketVotes)} صوت · الأحمر أصوات مشبوهة · المظلل ساعات الفجر ({QUIET_HOURS.start}–
            {QUIET_HOURS.end} ص)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {analysis.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد أصوات بعد.</p>
          ) : (
            <div dir="ltr">
              <div className="flex h-48 gap-px">
                {analysis.timeline.map((bucket) => (
                  <div
                    key={bucket.start.getTime()}
                    title={`${formatTime(bucket.start, withDay)} · ${bucket.votes} صوت · ${bucket.suspect} مشبوه`}
                    className={cn("flex min-w-0 flex-1 items-end", bucket.quiet && "bg-muted")}
                  >
                    <div
                      className="flex w-full flex-col-reverse overflow-hidden rounded-t-sm bg-primary/70"
                      style={{ height: `${(bucket.votes / totals.peakBucketVotes) * 100}%` }}
                    >
                      <div
                        className="bg-destructive"
                        style={{ height: `${bucket.votes ? (bucket.suspect / bucket.votes) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
                <span>{formatTime(analysis.timeline[0].start, withDay)}</span>
                <span>{formatTime(analysis.timeline[analysis.timeline.length - 1].start, withDay)}</span>
              </div>
            </div>
          )}
          <QuietHoursNote quietHours={analysis.quietHours} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الأصوات حسب ساعة اليوم</CardTitle>
          <CardDescription>
            مجموع الأصوات في كل ساعة بتوقيت الرياض. النشاط الطبيعي ينخفض بوضوح في ساعات الفجر المظللة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div dir="ltr" className="flex gap-1">
            {analysis.hourOfDay.map((votes, hour) => (
              <div key={hour} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  title={`${hour}:00 · ${votes} صوت`}
                  className={cn(
                    "flex h-32 w-full items-end",
                    hour >= QUIET_HOURS.start && hour < QUIET_HOURS.end && "bg-muted"
                  )}
                >
                  <div
                    className="w-full rounded-t-sm bg-primary/70"
                    style={{ height: `${(votes / Math.max(1, ...analysis.hourOfDay)) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[0.625rem] text-muted-foreground">{hour}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!project && (
        <Card>
          <CardHeader>
            <CardTitle>ترتيب المشاريع</CardTitle>
            <CardDescription>اضغط على مشروع لعرض إحصائياته التفصيلية.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>الأصوات</TableHead>
                  <TableHead>سليمة</TableHead>
                  <TableHead>مشبوهة</TableHead>
                  <TableHead>مراجعة</TableHead>
                  <TableHead>عناوين IP</TableHead>
                  <TableHead>الترتيب بعد الاستبعاد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.standings.map((standing) => (
                  <TableRow key={standing.projectId}>
                    <TableCell className="font-mono">{standing.rank}</TableCell>
                    <TableCell className="max-w-64 truncate sm:max-w-md">
                      <Link href={href({ project: standing.projectId })} className="font-medium hover:underline">
                        <bdi>{standing.title}</bdi>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono font-bold">{formatCount(standing.votes)}</TableCell>
                    <TableCell className="font-mono">{formatCount(standing.clean)}</TableCell>
                    <TableCell className={cn("font-mono", standing.suspect > 0 && "font-bold text-destructive")}>
                      {formatCount(standing.suspect)}
                    </TableCell>
                    <TableCell className={cn("font-mono", standing.review > 0 && "text-amber-600")}>
                      {formatCount(standing.review)}
                    </TableCell>
                    <TableCell className="font-mono">{formatCount(standing.distinctIps)}</TableCell>
                    <TableCell className={cn("font-mono", standing.cleanRank !== standing.rank && "font-bold")}>
                      {standing.cleanRank}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>نطاقات البريد</CardTitle>
            <CardDescription>{formatCount(analysis.domains.length)} نطاقاً مختلفاً</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النطاق</TableHead>
                  <TableHead>الأصوات</TableHead>
                  <TableHead>المشاريع</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.domains
                  .filter((domain, index) => index < BREAKDOWN_ROWS || domain.flag)
                  .map((domain) => (
                    <TableRow key={domain.domain}>
                      <TableCell className="font-mono" dir="ltr">
                        {domain.domain}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCount(domain.votes)}
                        <span className="ms-1 text-muted-foreground">
                          ({Math.round((domain.votes / totals.votes) * 100)}%)
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">{domain.projects}</TableCell>
                      <TableCell>{domain.flag && <FlagBadge flag={domain.flag} />}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>عناوين IP المشتركة</CardTitle>
            <CardDescription>
              العناوين التي صدر منها 3 أصوات فأكثر ({formatCount(analysis.ipGroups.length)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.ipGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد عناوين مشتركة.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الأصوات</TableHead>
                    {!project && <TableHead>أكثر مشروع</TableHead>}
                    <TableHead>أنواع الأجهزة</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.ipGroups.slice(0, BREAKDOWN_ROWS).map((group) => (
                    <TableRow key={group.ip}>
                      <TableCell className="font-mono" dir="ltr">
                        {group.ip}
                      </TableCell>
                      <TableCell className="font-mono">{formatCount(group.votes)}</TableCell>
                      {!project && (
                        <TableCell className="max-w-40 truncate">
                          <bdi>{group.topProjectTitle}</bdi>
                          {group.projects > 1 && <span className="text-muted-foreground"> +{group.projects - 1}</span>}
                        </TableCell>
                      )}
                      <TableCell className="font-mono">{group.devices}</TableCell>
                      <TableCell>{group.flag && <FlagBadge flag={group.flag} />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الأجهزة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {analysis.devices.length === 0 && <p className="text-sm text-muted-foreground">لا توجد بيانات أجهزة.</p>}
          {analysis.devices.slice(0, BREAKDOWN_ROWS).map((device) => (
            <div key={device.device} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate">{device.device}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(device.votes / analysis.devices[0].votes) * 100}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-end font-mono tabular-nums">{formatCount(device.votes)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{flaggedOnly ? "الأصوات المعلَّمة" : "آخر الأصوات"}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>أحدث {VOTES_SHOWN} صوت كحد أقصى</span>
            <Link href={href({ only: !flaggedOnly })} className="flex items-center gap-1 text-primary hover:underline">
              <IconEye className="size-3.5" />
              {flaggedOnly ? "عرض كل الأصوات" : "عرض المعلَّمة فقط"}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shownVotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد أصوات.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوقت</TableHead>
                  {!project && <TableHead>المشروع</TableHead>}
                  <TableHead>البريد</TableHead>
                  <TableHead>عنوان IP</TableHead>
                  <TableHead>الجهاز</TableHead>
                  <TableHead>المؤشرات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shownVotes.map((vote) => (
                  <TableRow key={vote.voteId} className={cn(vote.level === "suspect" && "bg-destructive/5")}>
                    <TableCell className="font-mono text-muted-foreground">
                      {formatTime(vote.createdAt, true)}
                    </TableCell>
                    {!project && (
                      <TableCell className="max-w-48 truncate">
                        <bdi>{vote.projectTitle}</bdi>
                      </TableCell>
                    )}
                    <TableCell className="font-mono" dir="ltr">
                      {vote.voterEmail ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono" dir="ltr">
                      {vote.ipAddress ?? "—"}
                    </TableCell>
                    <TableCell>{vote.device ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {vote.flags.map((flag) => (
                          <FlagBadge key={flag} flag={flag} />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatBucket(minutes: number) {
  if (minutes < 60) return `${minutes} دقيقة`
  if (minutes < DAY_MINUTES) return minutes === 60 ? "ساعة" : `${minutes / 60} ساعات`
  return minutes === DAY_MINUTES ? "يوماً" : `${minutes / DAY_MINUTES} أيام`
}

function QuietHoursNote({ quietHours }: { quietHours: VoteAnalysis["quietHours"] }) {
  if (quietHours.hours === 0) {
    return (
      <p className="text-sm text-muted-foreground">لم تمر ساعات الفجر على التصويت بعد، فلا مقارنة ليلية حتى الآن.</p>
    )
  }

  return (
    <p
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        quietHours.alarming ? "border-destructive/30 bg-destructive/10 text-destructive" : "text-muted-foreground"
      )}
    >
      معدل الفجر <span className="font-mono font-bold">{quietHours.perHour.toFixed(1)}</span> صوت/ساعة مقابل{" "}
      <span className="font-mono font-bold">{quietHours.activePerHour.toFixed(1)}</span> في بقية اليوم.{" "}
      {quietHours.alarming ? "النشاط لم ينخفض ليلاً كما يُتوقع، وهذا مؤشر على تصويت آلي." : "الانخفاض الليلي طبيعي."}
    </p>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: "suspect" | "review" }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-mono text-2xl font-bold tabular-nums",
          tone === "suspect" && "text-destructive",
          tone === "review" && "text-amber-600"
        )}
      >
        {formatCount(value)}
      </p>
    </div>
  )
}

function AlertRow({ alert, withDay, projectHref }: { alert: VoteAlert; withDay: boolean; projectHref?: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border px-3 py-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FlagBadge flag={alert.flag} />
          <span className="font-medium">{ALERT_TITLE[alert.flag]}</span>
          <span className="font-mono text-xs text-muted-foreground" dir="ltr">
            {alert.subject}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {projectHref ? (
            <Link href={projectHref} className="hover:underline">
              <bdi>{alert.projectTitle}</bdi>
            </Link>
          ) : (
            <bdi>{alert.projectTitle}</bdi>
          )}
          {" · "}
          {formatTime(alert.firstAt, withDay)} – {formatTime(alert.lastAt, withDay)}
          {alert.devices === 1 && " · نوع جهاز واحد"}
        </p>
      </div>
      <span className="font-mono text-sm font-bold tabular-nums">{formatCount(alert.votes)} صوت</span>
    </li>
  )
}
