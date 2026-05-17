"use client"

import { useCallback, useState, useTransition } from "react"
import {
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconHeart,
  IconPlus,
  IconTrophy,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  createCampaign,
  deleteCampaign,
  getAllCampaigns,
  getCampaignStatsAction,
  toggleShowVoteButton,
  updateCampaign,
} from "@/app/admin/voting/actions"
import type { VotingCampaign } from "@/db/types"

type CampaignWithStatus = VotingCampaign & {
  status: "active" | "upcoming" | "ended"
}

type CampaignStats = {
  totalVotes: number
  topProjects: { projectId: string; title: string; votes: number }[]
  recentVotes: { voteId: string; userId: string; projectId: string; projectTitle: string; createdAt: Date }[]
}

function getCampaignStatus(campaign: VotingCampaign): "active" | "upcoming" | "ended" {
  const now = new Date()
  const start = new Date(campaign.startsAt)
  const end = new Date(campaign.endsAt)
  if (now >= start && now <= end) return "active"
  if (now < start) return "upcoming"
  return "ended"
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-SA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function toSaudiLocal(date: Date | string): string {
  const d = new Date(date)
  const saudiOffsetMs = 3 * 60 * 60 * 1000
  const saudi = new Date(d.getTime() + saudiOffsetMs)
  return saudi.toISOString().slice(0, 16)
}

function formatRelativeTime(date: Date | string) {
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

const STATUS_BADGE = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  upcoming: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ended: "bg-muted text-muted-foreground",
}

const STATUS_LABEL = {
  active: "نشط",
  upcoming: "قادم",
  ended: "منتهي",
}

export function AdminVotingClient({ initialCampaigns }: { initialCampaigns: VotingCampaign[] }) {
  const [campaigns, setCampaigns] = useState<CampaignWithStatus[]>(
    initialCampaigns.map((c) => ({ ...c, status: getCampaignStatus(c) }))
  )
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editCampaign, setEditCampaign] = useState<CampaignWithStatus | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const reloadCampaigns = useCallback(async () => {
    const result = await getAllCampaigns()
    setCampaigns(result.map((c) => ({ ...c, status: getCampaignStatus(c) })))
  }, [])

  function loadStats(campaignId: string) {
    if (selectedCampaignId === campaignId) {
      setSelectedCampaignId(null)
      setStats(null)
      return
    }
    setSelectedCampaignId(campaignId)
    setStatsLoading(true)
    setStats(null)
    getCampaignStatsAction(campaignId).then((data) => {
      setStats(data as CampaignStats)
      setStatsLoading(false)
    })
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "active")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconTrophy className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">
              {campaigns.length} حملة تصويت
              {activeCampaigns.length > 0 && (
                <span className="ms-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  {activeCampaigns.length} نشطة
                </span>
              )}
            </p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <IconPlus className="size-4" />
              حملة جديدة
            </Button>
          </DialogTrigger>
          <CampaignFormDialog
            mode="create"
            onSubmit={async (data) => {
              await startTransition(async () => {
                await createCampaign(data)
                await reloadCampaigns()
                setCreateOpen(false)
              })
            }}
            isPending={isPending}
          />
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <IconTrophy className="mx-auto size-12 text-muted-foreground/30" />
          <p className="mt-4 font-heading text-lg font-bold text-muted-foreground">لا توجد حملات تصويت بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">أنشئ أول حملة تصويت للبدء.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-base font-bold">{campaign.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[campaign.status]}`}>
                        {STATUS_LABEL[campaign.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconClock className="size-3" />
                      <span>
                        {formatDate(campaign.startsAt)} — {formatDate(campaign.endsAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">زر التصويت</span>
                    <Switch
                      checked={campaign.showVoteButton}
                      onCheckedChange={(checked) =>
                        startTransition(async () => {
                          await toggleShowVoteButton(campaign.id, checked)
                          await reloadCampaigns()
                        })
                      }
                    />
                  </div>
                  <Dialog
                    open={editCampaign?.id === campaign.id}
                    onOpenChange={(open) => {
                      if (!open) setEditCampaign(null)
                    }}
                  >
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditCampaign(campaign)}>
                      <IconPencil className="size-4" />
                    </Button>
                    {editCampaign?.id === campaign.id && (
                      <CampaignFormDialog
                        mode="edit"
                        initialData={{
                          name: campaign.name,
                          startsAt: toSaudiLocal(campaign.startsAt),
                          endsAt: toSaudiLocal(campaign.endsAt),
                          showVoteButton: campaign.showVoteButton,
                          maxVotesPerUser: campaign.maxVotesPerUser,
                        }}
                        onSubmit={async (data) => {
                          await startTransition(async () => {
                            await updateCampaign(campaign.id, data)
                            await reloadCampaigns()
                            setEditCampaign(null)
                          })
                        }}
                        isPending={isPending}
                      />
                    )}
                  </Dialog>
                  <Dialog
                    open={deleteConfirm === campaign.id}
                    onOpenChange={(open) => {
                      if (!open) setDeleteConfirm(null)
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirm(campaign.id)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>حذف الحملة</DialogTitle>
                        <DialogDescription>
                          هل أنت متأكد من حذف حملة &laquo;{campaign.name}&raquo;؟ سيتم حذف جميع الأصوات المرتبطة بها
                          أيضاً.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                          إلغاء
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              await deleteCampaign(campaign.id)
                              await reloadCampaigns()
                              setDeleteConfirm(null)
                              if (selectedCampaignId === campaign.id) {
                                setSelectedCampaignId(null)
                                setStats(null)
                              }
                            })
                          }}
                        >
                          حذف
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => loadStats(campaign.id)}>
                    الإحصائيات
                    {selectedCampaignId === campaign.id ? (
                      <IconChevronUp className="size-4" />
                    ) : (
                      <IconChevronDown className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
                <span>الحد الأقصى للأصوات لكل مستخدم: {campaign.maxVotesPerUser}</span>
              </div>

              {selectedCampaignId === campaign.id && (
                <div className="border-t p-4">
                  {statsLoading ? (
                    <div className="space-y-3">
                      <div className="h-8 animate-pulse rounded bg-muted" />
                      <div className="h-24 animate-pulse rounded bg-muted" />
                    </div>
                  ) : stats ? (
                    <CampaignStatsView stats={stats} />
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignStatsView({ stats }: { stats: CampaignStats }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">إجمالي الأصوات</p>
          <p className="font-heading text-2xl font-bold">{stats.totalVotes.toLocaleString("ar-SA")}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <IconTrophy className="size-4 text-amber-500" />
          <h4 className="font-heading text-sm font-bold">أفضل 5 مشاريع</h4>
        </div>
        {stats.topProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد أصوات بعد.</p>
        ) : (
          <div className="space-y-2">
            {stats.topProjects.map((project, i) => (
              <div key={project.projectId} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-amber-500/10 text-amber-600"
                        : i === 1
                          ? "bg-gray-400/10 text-gray-500"
                          : i === 2
                            ? "bg-orange-400/10 text-orange-600"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{project.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconHeart className="size-3.5 text-primary" />
                  <span className="font-mono text-sm font-bold tabular-nums">{project.votes}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-2 font-heading text-sm font-bold">آخر الأصوات</h4>
        {stats.recentVotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد أصوات بعد.</p>
        ) : (
          <div className="max-h-60 space-y-1.5 overflow-y-auto">
            {stats.recentVotes.map((vote) => (
              <div key={vote.voteId} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <IconHeart className="size-3 text-primary" />
                  <span className="font-medium">{vote.projectTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{vote.userId.slice(0, 8)}…</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(vote.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CampaignFormDialog({
  mode,
  initialData,
  onSubmit,
  isPending,
}: {
  mode: "create" | "edit"
  initialData?: {
    name: string
    startsAt: string
    endsAt: string
    showVoteButton: boolean
    maxVotesPerUser: number
  }
  onSubmit: (data: {
    name: string
    startsAt: string
    endsAt: string
    showVoteButton: boolean
    maxVotesPerUser: number
  }) => void
  isPending: boolean
}) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [startsAt, setStartsAt] = useState(initialData?.startsAt ?? "")
  const [endsAt, setEndsAt] = useState(initialData?.endsAt ?? "")
  const [showVoteButton, setShowVoteButton] = useState(initialData?.showVoteButton ?? true)
  const [maxVotesPerUser, setMaxVotesPerUser] = useState(initialData?.maxVotesPerUser ?? 1)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startsAt || !endsAt) return
    onSubmit({ name: name.trim(), startsAt, endsAt, showVoteButton, maxVotesPerUser })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "إنشاء حملة تصويت" : "تعديل حملة التصويت"}</DialogTitle>
        <DialogDescription>
          {mode === "create" ? "أدخل بيانات حملة التصويت الجديدة." : "عدّل بيانات حملة التصويت."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">اسم الحملة</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: أفضل مشروع ١٤٤٧"
            className="font-heading"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">تاريخ البداية</label>
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">تاريخ النهاية</label>
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">الحد الأقصى للأصوات لكل مستخدم</label>
          <Input
            type="number"
            min={1}
            value={maxVotesPerUser}
            onChange={(e) => setMaxVotesPerUser(Number(e.target.value) || 1)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">عرض زر التصويت</p>
            <p className="text-xs text-muted-foreground">إذا كان معطلاً، لن يظهر زر التصويت للمستخدمين.</p>
          </div>
          <Switch checked={showVoteButton} onCheckedChange={setShowVoteButton} />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={!name.trim() || !startsAt || !endsAt || isPending} className="w-full">
            {isPending ? "جارٍ الحفظ..." : mode === "create" ? "إنشاء الحملة" : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
