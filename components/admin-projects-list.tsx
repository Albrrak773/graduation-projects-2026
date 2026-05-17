"use client"

import { useState, useMemo, useTransition, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import Fuse from "fuse.js"
import {
  IconSearch,
  IconRefresh,
  IconSignature,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconListDetails,
  IconClock,
  IconLoader,
  IconLoader2,
  IconExternalLink,
  IconUsers,
  IconPlus,
  IconTrash,
  IconUpload,
  IconPhotoEdit,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react"
import { useQueryState, parseAsArrayOf, parseAsStringEnum } from "nuqs"
import {
  COLLEDGE_VALUES,
  COLLEDGE_LABELS,
  SECTION_VALUES,
  SECTION_LABELS,
  DEGREE_VALUES,
  DEGREE_LABELS,
} from "@/db/enums"
import { CURRENT_YEAR, YEAR_MAP } from "@/lib/years"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  seedEmptySignatures,
  rotateAllSignatures,
  fetchClerkUsers,
  createProject,
  requestProjectImageUpload,
  processProjectImage,
  type ClerkUserInfo,
} from "@/app/admin/projects/actions"
import { fetchProjectVotes } from "@/app/admin/projects/[id]/actions"
import type { Project } from "@/db/types"

const SEMESTER_VALUES = Object.values(YEAR_MAP) as readonly string[]
const HIJRI_TO_GREGORIAN: Record<string, number> = Object.fromEntries(
  Object.entries(YEAR_MAP).map(([gregorian, hijri]) => [hijri, Number(gregorian)])
)

const BASE_VALUES = ["Main", "Unaizah", "Ar-Rass"] as const
const BASE_LABELS: Record<string, string> = {
  Main: "الفرع الرئيسي",
  Unaizah: "عنيزة",
  "Ar-Rass": "الرس",
}

const IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024
const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
type UploadState = "idle" | "uploading" | "processing" | "success" | "error"

const collegeParser = parseAsArrayOf(parseAsStringEnum([...COLLEDGE_VALUES])).withOptions({ throttleMs: 0 })
const sectionParser = parseAsArrayOf(parseAsStringEnum([...SECTION_VALUES])).withOptions({ throttleMs: 0 })

type AdminProject = Project & { signature: string | null }
type VotesSummaryRow = {
  projectId: string
  title: string
  year: number | null
  colledge: Project["colledge"]
  section: Project["section"]
  votes: number
  participants: number
}
type FirehoseRow = {
  voteId: string
  userId: string
  projectId: string
  createdAt: Date | null
  projectTitle: string
  projectYear: number | null
  projectColledge: Project["colledge"]
  projectSection: Project["section"]
  projectParticipants: number
}
type ProjectVoteRow = {
  voteId: string
  userId: string
  createdAt: Date | null
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "غير معروف"
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return "الآن"
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`
  if (diffHour < 24) return `منذ ${diffHour} ساعة`
  if (diffDay < 30) return `منذ ${diffDay} يوم`
  return date.toLocaleDateString("ar-SA")
}

function formatDateTime(date: Date | null): string {
  if (!date) return "غير معروف"
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdminProjectsList({
  data,
  votesSummary,
  firehose,
}: {
  data: AdminProject[]
  tags: string[]
  votesSummary: VotesSummaryRow[]
  firehose: FirehoseRow[]
}) {
  const [search, setSearch] = useQueryState("search", { defaultValue: "", throttleMs: 300 })
  const [selectedColleges, setSelectedColleges] = useQueryState("college", collegeParser)
  const [selectedSections, setSelectedSections] = useQueryState("section", sectionParser)
  const [selectedSemester, setSelectedSemester] = useQueryState(
    "semester",
    parseAsStringEnum([...SEMESTER_VALUES]).withOptions({ throttleMs: 0 })
  )

  const [seeding, setSeeding] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [copiedSig, setCopiedSig] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [seedDialogOpen, setSeedDialogOpen] = useState(false)
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false)

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string | null>(null)
  const [projectVotes, setProjectVotes] = useState<ProjectVoteRow[]>([])
  const [loadingVotes, setLoadingVotes] = useState(false)
  const [usersMap, setUsersMap] = useState<Record<string, ClerkUserInfo>>({})
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [activeTab, setActiveTab] = useState("projects")
  const [, startTransition] = useTransition()

  const openProjectVotes = useCallback(
    (projectId: string, projectTitle: string) => {
      setSelectedProjectId(projectId)
      setSelectedProjectTitle(projectTitle)
      setLoadingVotes(true)
      setProjectVotes([])
      startTransition(async () => {
        const votes = await fetchProjectVotes(projectId)
        setProjectVotes(votes)
        setLoadingVotes(false)
      })
    },
    [startTransition]
  )

  useEffect(() => {
    if (activeTab !== "firehose" || firehose.length === 0 || Object.keys(usersMap).length > 0) return
    const uniqueUserIds = [...new Set(firehose.map((r) => r.userId))]
    startTransition(async () => {
      setLoadingUsers(true)
      try {
        const map = await fetchClerkUsers(uniqueUserIds)
        setUsersMap(map)
      } catch {
        setUsersMap({})
      }
      setLoadingUsers(false)
    })
  }, [activeTab, firehose, usersMap, startTransition])

  const fuseIndex = useMemo(
    () =>
      new Fuse(
        data.map((project) => ({
          id: project.id,
          title: project.title,
          year: String(project.year ?? ""),
          tagNames: project.tags.map((t) => t.name).join(" "),
          college: COLLEDGE_LABELS[project.colledge],
          section: SECTION_LABELS[project.section],
          signature: project.signature ?? "",
          project,
        })),
        {
          keys: [
            { name: "title", weight: 0.5 },
            { name: "tagNames", weight: 0.2 },
            { name: "year", weight: 0.12 },
            { name: "signature", weight: 0.1 },
            { name: "college", weight: 0.04 },
            { name: "section", weight: 0.04 },
          ],
          threshold: 0.3,
          includeScore: true,
        }
      ),
    [data]
  )

  const results = useMemo(() => {
    let items: AdminProject[] = data

    if (search.trim()) {
      const fuseResults = fuseIndex.search(search.trim())
      items = fuseResults.map((r) => r.item.project)
    }

    if (selectedColleges && selectedColleges.length > 0) {
      items = items.filter((item) => item.colledge && selectedColleges.includes(item.colledge))
    }

    if (selectedSections && selectedSections.length > 0) {
      items = items.filter((item) => item.section && selectedSections.includes(item.section))
    }

    if (selectedSemester) {
      const gregorian = HIJRI_TO_GREGORIAN[selectedSemester]
      if (gregorian) {
        items = items.filter((item) => item.year && item.year === gregorian)
      }
    }

    return items.toSorted((a, b) => {
      if (a.year === CURRENT_YEAR && b.year !== CURRENT_YEAR) return -1
      if (a.year !== CURRENT_YEAR && b.year === CURRENT_YEAR) return 1
      return (b.year ?? 0) - (a.year ?? 0)
    })
  }, [data, search, fuseIndex, selectedColleges, selectedSections, selectedSemester])

  const emptySigCount = useMemo(() => data.filter((p) => !p.signature).length, [data])

  async function handleSeedEmpty() {
    setSeeding(true)
    setActionResult(null)
    const result = await seedEmptySignatures()
    if (result.error) {
      setActionResult({ type: "error", message: result.error })
    } else if (result.success) {
      setActionResult({ type: "success", message: `تم تعبئة ${result.count} توقيع` })
    }
    setSeeding(false)
  }

  async function handleRotateAll() {
    setRotating(true)
    setActionResult(null)
    const result = await rotateAllSignatures()
    if (result.error) {
      setActionResult({ type: "error", message: result.error })
    } else if (result.success) {
      setActionResult({ type: "success", message: `تم تدوير ${result.count} توقيع` })
    }
    setRotating(false)
  }

  async function copySignature(sig: string) {
    await navigator.clipboard.writeText(sig)
    setCopiedSig(sig)
    setTimeout(() => setCopiedSig(null), 2000)
  }

  const totalVotes = useMemo(() => votesSummary.reduce((sum, r) => sum + Number(r.votes), 0), [votesSummary])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">إدارة المشاريع</h1>
          <p className="text-sm text-muted-foreground">
            {data.length} مشروع · {emptySigCount} بدون توقيع
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setSeedDialogOpen(true)}
            disabled={seeding}
          >
            <IconSignature data-icon="inline-start" />
            تعبئة التواقيع الفارغة
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setRotateDialogOpen(true)}
            disabled={rotating}
          >
            <IconRefresh data-icon="inline-start" />
            تدوير جميع التواقيع
          </Button>
        </div>
      </div>

      <Dialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle>تعبئة التواقيع الفارغة</DialogTitle>
            <DialogDescription>
              سيتم إنشاء توقيع جديد لكل مشروع بدون توقيع. عدد المشاريع المتأثرة: <strong>{emptySigCount}</strong> مشروع.
            </DialogDescription>
          </DialogHeader>
          {emptySigCount === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <IconCheck data-icon="inline-start" className="text-green-500" />
              جميع المشاريع لديها تواقيع بالفعل.
            </div>
          )}
          <DialogFooter showCloseButton>
            <Button variant="outline" onClick={() => setSeedDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={async () => {
                setSeedDialogOpen(false)
                await handleSeedEmpty()
              }}
              disabled={seeding || emptySigCount === 0}
            >
              تعبئة {emptySigCount} توقيع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle>تدوير جميع التواقيع</DialogTitle>
            <DialogDescription>
              سيتم استبدال توقيع كل مشروع بتوقيع جديد. عدد المشاريع المتأثر: <strong>{data.length}</strong> مشروع.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <IconAlertTriangle data-icon="inline-start" />
            هذا الإجراء لا يمكن التراجع عنه. الروابط القديمة ستنقضي.
          </div>
          <DialogFooter showCloseButton>
            <Button variant="outline" onClick={() => setRotateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setRotateDialogOpen(false)
                await handleRotateAll()
              }}
              disabled={rotating}
            >
              تدوير {data.length} توقيع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedProjectId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProjectId(null)
            setSelectedProjectTitle(null)
            setProjectVotes([])
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>أصوات المشروع</DialogTitle>
            <DialogDescription>{selectedProjectTitle}</DialogDescription>
          </DialogHeader>
          {loadingVotes ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <IconLoader className="animate-spin" />
              جارٍ التحميل...
            </div>
          ) : projectVotes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">لا توجد أصوات لهذا المشروع</div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-muted-foreground">{projectVotes.length} صوت</div>
              <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">#</TableHead>
                      <TableHead className="text-start">معرّف المستخدم</TableHead>
                      <TableHead className="text-start">وقت التصويت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectVotes.map((vote, i) => (
                      <TableRow key={vote.voteId}>
                        <TableCell className="font-mono text-xs tabular-nums">{i + 1}</TableCell>
                        <TableCell className="max-w-[200px] truncate font-mono text-xs" dir="ltr">
                          {vote.userId}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span>{formatDateTime(vote.createdAt)}</span>
                            <span className="text-muted-foreground">{formatRelativeTime(vote.createdAt)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {actionResult && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            actionResult.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {actionResult.message}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
        <TabsList variant="line">
          <TabsTrigger value="projects">المشاريع</TabsTrigger>
          <TabsTrigger value="votes" className="gap-1.5">
            <IconListDetails />
            التصويت
          </TabsTrigger>
          <TabsTrigger value="firehose" className="gap-1.5">
            <IconClock />
            سجل الأصوات
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-1.5">
            <IconPlus />
            إنشاء مشروع
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث بالعنوان أو التوقيع..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl bg-background ps-10"
              />
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <FilterGroup title="الكلية">
                <ToggleGroup
                  type="multiple"
                  variant="pill"
                  value={(selectedColleges ?? []) as string[]}
                  onValueChange={(vals) =>
                    setSelectedColleges(vals.length > 0 ? (vals as typeof selectedColleges) : null)
                  }
                >
                  {COLLEDGE_VALUES.map((c) => (
                    <ToggleGroupItem key={c} value={c}>
                      {COLLEDGE_LABELS[c]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FilterGroup>

              <FilterGroup title="القسم">
                <ToggleGroup
                  type="multiple"
                  variant="pill"
                  value={(selectedSections ?? []) as string[]}
                  onValueChange={(vals) =>
                    setSelectedSections(vals.length > 0 ? (vals as typeof selectedSections) : null)
                  }
                >
                  {SECTION_VALUES.map((s) => (
                    <ToggleGroupItem key={s} value={s}>
                      {SECTION_LABELS[s]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FilterGroup>

              <FilterGroup title="العام">
                <Select
                  value={selectedSemester ?? undefined}
                  onValueChange={(val) => setSelectedSemester(val as typeof selectedSemester)}
                >
                  <SelectTrigger className="h-[34px] rounded-full border-border bg-transparent px-4 text-sm font-medium text-muted-foreground">
                    <SelectValue placeholder="اختر العام" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTER_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterGroup>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {results.length} نتيجة
            {search ? ` عن "${search}"` : ""}
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 py-16 text-center text-muted-foreground">
              لا توجد نتائج
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((project) => (
                <AdminProjectCard key={project.id} project={project} copiedSig={copiedSig} onCopy={copySignature} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="votes">
          <div className="mb-2 text-sm text-muted-foreground">
            إجمالي الأصوات: <strong>{totalVotes.toLocaleString("ar-SA")}</strong> صوت لـ{" "}
            <strong>{votesSummary.filter((r) => Number(r.votes) > 0).length}</strong> مشروع
          </div>
          {votesSummary.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 py-16 text-center text-muted-foreground">
              لا توجد بيانات تصويت حالياً
            </div>
          ) : (
            <div className="rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المشروع</TableHead>
                    <TableHead>الكلية</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead className="text-center">المشاركون</TableHead>
                    <TableHead className="text-center">الأصوات</TableHead>
                    <TableHead className="text-center">تفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votesSummary.map((row) => (
                    <TableRow key={row.projectId}>
                      <TableCell className="max-w-[280px] truncate" dir="auto">
                        <Link
                          href={`/projects/${row.projectId}`}
                          className="flex items-center gap-1.5 underline decoration-muted-foreground hover:text-primary"
                          target="_blank"
                        >
                          {row.title}
                          <IconExternalLink className="shrink-0" />
                        </Link>
                      </TableCell>
                      <TableCell>{COLLEDGE_LABELS[row.colledge]}</TableCell>
                      <TableCell>{SECTION_LABELS[row.section]}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <IconUsers className="text-muted-foreground" />
                          {Number(row.participants).toLocaleString("ar-SA")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold tabular-nums">
                        {Number(row.votes).toLocaleString("ar-SA")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openProjectVotes(row.projectId, row.title)}
                        >
                          <IconListDetails />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="firehose">
          {firehose.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 py-16 text-center text-muted-foreground">
              لا توجد أصوات مسجلة حالياً
            </div>
          ) : loadingUsers ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <IconLoader className="animate-spin" />
              جارٍ تحميل بيانات المستخدمين...
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">
                {firehose.length.toLocaleString("ar-SA")} صوت مسجّل ·{" "}
                {Object.keys(usersMap).length.toLocaleString("ar-SA")} مستخدم
              </div>
              <div className="rounded-2xl border bg-card">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المشروع</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>اسم المستخدم</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>الحسابات</TableHead>
                        <TableHead>2FA</TableHead>
                        <TableHead>حالة</TableHead>
                        <TableHead>اللغة</TableHead>
                        <TableHead>تسجيل</TableHead>
                        <TableHead>آخر دخول</TableHead>
                        <TableHead>وقت التصويت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {firehose.map((row) => {
                        const user = usersMap[row.userId]
                        return (
                          <TableRow key={row.voteId}>
                            <TableCell className="max-w-[160px] truncate" dir="auto">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  className="truncate text-start underline decoration-muted-foreground hover:text-primary"
                                  onClick={() => openProjectVotes(row.projectId, row.projectTitle)}
                                >
                                  {row.projectTitle}
                                </button>
                                <Link
                                  href={`/projects/${row.projectId}`}
                                  className="shrink-0 text-muted-foreground hover:text-primary"
                                  target="_blank"
                                >
                                  <IconExternalLink className="size-3" />
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user ? (
                                <div className="flex items-center gap-2">
                                  {user.imageUrl && (
                                    <Image
                                      src={user.imageUrl}
                                      alt=""
                                      width={24}
                                      height={24}
                                      className="size-6 shrink-0 rounded-full"
                                    />
                                  )}
                                  <span className="truncate text-sm">{user.fullName || user.firstName || "—"}</span>
                                </div>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                                  {row.userId.slice(0, 12)}…
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate text-xs" dir="ltr">
                              {user?.email ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs" dir="ltr">
                              {user?.username ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs" dir="ltr">
                              {user?.phone ?? "—"}
                            </TableCell>
                            <TableCell>
                              {user && user.externalAccounts.length > 0
                                ? user.externalAccounts.map((ea) => (
                                    <Badge
                                      key={ea.provider}
                                      variant="outline"
                                      className="me-1 px-1.5 py-0 text-[0.6rem]"
                                    >
                                      {ea.provider}
                                    </Badge>
                                  ))
                                : "—"}
                            </TableCell>
                            <TableCell className="text-center text-xs">{user?.twoFactorEnabled ? "✓" : "✗"}</TableCell>
                            <TableCell>
                              {user && (user.banned || user.locked) ? (
                                <span className="text-xs font-medium text-destructive">
                                  {user.banned ? "محظور" : "مقفل"}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">نشط</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{user?.locale ?? "—"}</TableCell>
                            <TableCell className="text-xs">
                              {user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString("ar-SA", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {user?.lastSignInAt
                                ? new Date(user.lastSignInAt).toLocaleDateString("ar-SA", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span>{formatDateTime(row.createdAt)}</span>
                                <span className="text-muted-foreground">{formatRelativeTime(row.createdAt)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <CreateProjectForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CreateProjectForm() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [title, setTitle] = useState("")
  const [discription, setDiscription] = useState("")
  const [supervisor, setSupervisor] = useState("")
  const [section, setSection] = useState<(typeof SECTION_VALUES)[number]>("male")
  const [colledge, setColledge] = useState<(typeof COLLEDGE_VALUES)[number]>("CS")
  const [degree, setDegree] = useState<(typeof DEGREE_VALUES)[number]>("bachelor")
  const [base, setBase] = useState<"Main" | "Unaizah" | "Ar-Rass">("Main")
  const [projectExternalLink, setProjectExternalLink] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [tags, setTags] = useState("")
  const [participants, setParticipants] = useState<
    { name: string; uni_id: string; x_url: string; linked_url: string; github_url: string; personal_email: string }[]
  >([{ name: "", uni_id: "", x_url: "", linked_url: "", github_url: "", personal_email: "" }])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addParticipant() {
    setParticipants((prev) => [
      ...prev,
      { name: "", uni_id: "", x_url: "", linked_url: "", github_url: "", personal_email: "" },
    ])
  }

  function removeParticipant(index: number) {
    setParticipants((prev) => prev.filter((_, i) => i !== index))
  }

  function updateParticipant(index: number, field: string, value: string) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
      setUploadState("error")
      setUploadError("نوع الملف غير مدعوم. الأنواع المدعومة: JPEG, PNG, WebP")
      return
    }

    if (file.size > IMAGE_MAX_FILE_SIZE) {
      setUploadState("error")
      setUploadError(`حجم الملف يتجاوز الحد المسموح (${IMAGE_MAX_FILE_SIZE / 1024 / 1024}MB)`)
      return
    }

    setUploadError(null)
    setUploadState("idle")
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setUploadState("idle")
    setUploadError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    startTransition(async () => {
      const res = await createProject({
        title,
        discription: discription || undefined,
        supervisor,
        section,
        colledge,
        degree,
        base,
        project_external_link: projectExternalLink || undefined,
        is_public: isPublic,
        tags: tagList.length > 0 ? tagList : undefined,
        participants: participants.some((p) => p.name.trim() || p.uni_id.trim()) ? participants : undefined,
      })

      if (res.error) {
        setResult({ type: "error", message: res.error })
        return
      }

      if (selectedFile && res.id) {
        setUploadState("uploading")
        try {
          const uploadResult = await requestProjectImageUpload(res.id, selectedFile.type)

          if ("error" in uploadResult || !uploadResult.uploadUrl) {
            setUploadState("error")
            setUploadError(uploadResult.error ?? "فشل في رفع الصورة، لكن المشروع تم إنشاؤه")
            setResult({ type: "success", message: "تم إنشاء المشروع لكن فشل رفع الصورة" })
            return
          }

          const putResponse = await fetch(uploadResult.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": selectedFile.type },
            body: selectedFile,
          })

          if (!putResponse.ok) {
            setUploadState("error")
            setUploadError("فشل في رفع الصورة إلى التخزين، لكن المشروع تم إنشاؤه")
            setResult({ type: "success", message: "تم إنشاء المشروع لكن فشل رفع الصورة" })
            return
          }

          setUploadState("processing")

          const processResult = await processProjectImage(res.id, uploadResult.tempKey)

          if ("error" in processResult || !processResult.success) {
            setUploadState("error")
            setUploadError(processResult.error ?? "فشل في معالجة الصورة، لكن المشروع تم إنشاؤه")
            setResult({ type: "success", message: "تم إنشاء المشروع لكن فشل معالجة الصورة" })
            return
          }

          setUploadState("success")
          setResult({ type: "success", message: "تم إنشاء المشروع ورفع الصورة بنجاح" })
        } catch {
          setUploadState("error")
          setUploadError("حدث خطأ أثناء رفع الصورة، لكن المشروع تم إنشاؤه")
          setResult({ type: "success", message: "تم إنشاء المشروع لكن فشل رفع الصورة" })
        }
      } else {
        setResult({ type: "success", message: "تم إنشاء المشروع بنجاح" })
      }

      setTitle("")
      setDiscription("")
      setSupervisor("")
      setSection("male")
      setColledge("CS")
      setDegree("bachelor")
      setBase("Main")
      setProjectExternalLink("")
      setIsPublic(true)
      setTags("")
      setParticipants([{ name: "", uni_id: "", x_url: "", linked_url: "", github_url: "", personal_email: "" }])
      removeSelectedFile()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {result && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            result.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="mb-4 font-heading text-lg font-bold">صورة المشروع</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="group relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted/50">
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="معاينة الصورة"
                  fill
                  sizes="144px"
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-40"
                />
                <div className="relative z-10 flex flex-col items-center gap-2 rounded-xl bg-background/80 p-3 shadow-sm backdrop-blur-md transition-transform group-hover:scale-105">
                  {uploadState === "uploading" || uploadState === "processing" ? (
                    <IconLoader2 className="size-6 animate-spin text-foreground" />
                  ) : uploadState === "success" ? (
                    <IconCircleCheck className="size-6 text-green-500" />
                  ) : (
                    <IconPhotoEdit className="size-6 text-foreground" />
                  )}
                </div>
              </>
            ) : (
              <IconUpload className="size-8 text-muted-foreground transition-transform group-hover:-translate-y-1" />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
              onChange={handleFileSelect}
              disabled={isPending || uploadState === "uploading" || uploadState === "processing"}
            />
          </div>
          <div className="space-y-1.5 pb-2">
            <p className="text-sm font-medium text-foreground">ارفع صورة المشروع</p>
            <p className="text-xs text-muted-foreground">
              الحد الأقصى {IMAGE_MAX_FILE_SIZE / 1024 / 1024}MB
              <br />
              الصيغ المدعومة: JPEG, PNG, WebP
            </p>
            {selectedFile && (
              <button
                type="button"
                onClick={removeSelectedFile}
                className="text-xs font-medium text-destructive hover:underline"
              >
                إزالة الصورة
              </button>
            )}
            {uploadState === "uploading" && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-blue-500">
                <IconLoader2 className="size-4 animate-spin" />
                جارٍ رفع الصورة...
              </p>
            )}
            {uploadState === "processing" && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-blue-500">
                <IconLoader2 className="size-4 animate-spin" />
                جارٍ معالجة الصورة...
              </p>
            )}
            {uploadState === "success" && (
              <p className="flex items-center gap-1.5 text-sm font-bold text-green-600">
                <IconCircleCheck className="size-4" />
                تم رفع الصورة بنجاح
              </p>
            )}
            {uploadState === "error" && uploadError && (
              <p className="flex items-center gap-1.5 text-sm font-bold text-red-500">
                <IconAlertCircle className="size-4 shrink-0" />
                {uploadError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="mb-4 font-heading text-lg font-bold">معلومات أساسية</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">عنوان المشروع *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="عنوان المشروع"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supervisor">المشرف *</Label>
            <Input
              id="supervisor"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              required
              placeholder="اسم المشرف"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="discription">الوصف</Label>
            <Textarea
              id="discription"
              value={discription}
              onChange={(e) => setDiscription(e.target.value)}
              placeholder="وصف المشروع"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project_external_link">رابط المشروع الخارجي</Label>
            <Input
              id="project_external_link"
              value={projectExternalLink}
              onChange={(e) => setProjectExternalLink(e.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tags">الوسوم</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="وسم١، وسم٢، ..." />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="mb-4 font-heading text-lg font-bold">التصنيف</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>الكلية *</Label>
            <Select value={colledge} onValueChange={(v) => setColledge(v as typeof colledge)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLEDGE_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {COLLEDGE_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>القسم *</Label>
            <Select value={section} onValueChange={(v) => setSection(v as typeof section)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {SECTION_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الدرجة</Label>
            <Select value={degree} onValueChange={(v) => setDegree(v as typeof degree)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {DEGREE_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الفرع</Label>
            <Select value={base} onValueChange={(v) => setBase(v as "Main" | "Unaizah" | "Ar-Rass")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {BASE_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
          <Label htmlFor="is-public">مشروع عام</Label>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">المشاركون</h3>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addParticipant}>
            <IconPlus className="size-3.5" />
            إضافة مشارك
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {participants.map((p, i) => (
            <div key={i} className="rounded-xl border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">مشارك {i + 1}</span>
                {participants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(i)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">الاسم</Label>
                  <Input
                    value={p.name}
                    onChange={(e) => updateParticipant(i, "name", e.target.value)}
                    placeholder="الاسم"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">الرقم الجامعي</Label>
                  <Input
                    value={p.uni_id}
                    onChange={(e) => updateParticipant(i, "uni_id", e.target.value)}
                    placeholder="الرقم الجامعي"
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">رابط X</Label>
                  <Input
                    value={p.x_url}
                    onChange={(e) => updateParticipant(i, "x_url", e.target.value)}
                    placeholder="https://x.com/..."
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">رابط LinkedIn</Label>
                  <Input
                    value={p.linked_url}
                    onChange={(e) => updateParticipant(i, "linked_url", e.target.value)}
                    placeholder="https://linkedin.com/..."
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">رابط GitHub</Label>
                  <Input
                    value={p.github_url}
                    onChange={(e) => updateParticipant(i, "github_url", e.target.value)}
                    placeholder="https://github.com/..."
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">البريد الإلكتروني</Label>
                  <Input
                    value={p.personal_email}
                    onChange={(e) => updateParticipant(i, "personal_email", e.target.value)}
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="h-10">
        {isPending ? (
          <>
            <IconLoader className="animate-spin" />
            جارٍ الإنشاء...
          </>
        ) : (
          "إنشاء المشروع"
        )}
      </Button>
    </form>
  )
}

function AdminProjectCard({
  project,
  copiedSig,
  onCopy,
}: {
  project: AdminProject
  copiedSig: string | null
  onCopy: (sig: string) => void
}) {
  const hasImage = project.image_thumb_url && project.image_thumb_url.length > 0
  const collegeLabel = COLLEDGE_LABELS[project.colledge]
  const sectionLabel = SECTION_LABELS[project.section]
  const editHref = project.signature ? `/projects/edit/${project.signature}` : null

  const card = (
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:border-border hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {hasImage ? (
          <Image
            src={project.image_thumb_url!}
            alt={project.title}
            fill
            quality={60}
            className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary/5">
            <span className="flex size-14 items-center justify-center rounded-xl bg-primary/10 font-heading text-xl font-bold text-primary/60">
              {project.title[0]}
            </span>
          </div>
        )}
        {project.year && (
          <span className="absolute start-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[0.6875rem] font-bold text-white backdrop-blur">
            {project.year}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <h3 className="line-clamp-1 font-heading text-sm leading-5 font-bold">{project.title}</h3>

        <div className="flex flex-wrap items-center gap-1">
          {collegeLabel && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[0.625rem]">
              {collegeLabel}
            </Badge>
          )}
          {sectionLabel && (
            <Badge variant="outline" className="px-1.5 py-0 text-[0.625rem]">
              {sectionLabel}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1">
          <IconSignature className="shrink-0 text-muted-foreground" />
          {project.signature ? (
            <>
              <code className="flex-1 truncate font-mono text-[0.6875rem]" dir="ltr">
                {project.signature}
              </code>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  onCopy(project.signature!)
                }}
                className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                {copiedSig === project.signature ? <IconCheck className="text-green-500" /> : <IconCopy />}
              </button>
            </>
          ) : (
            <span className="text-[0.6875rem] text-red-500">بدون توقيع</span>
          )}
        </div>
      </div>
    </div>
  )

  if (editHref) {
    return (
      <Link href={editHref} className="block">
        {card}
      </Link>
    )
  }

  return card
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      {children}
    </div>
  )
}
