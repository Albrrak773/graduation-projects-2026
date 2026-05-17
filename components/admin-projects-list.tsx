"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import Fuse from "fuse.js"
import { IconSearch, IconRefresh, IconSignature, IconCopy, IconCheck, IconAlertTriangle } from "@tabler/icons-react"
import { useQueryState, parseAsArrayOf, parseAsStringEnum } from "nuqs"
import { COLLEDGE_VALUES, COLLEDGE_LABELS, SECTION_VALUES, SECTION_LABELS } from "@/db/enums"
import { CURRENT_YEAR, YEAR_MAP } from "@/lib/years"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { seedEmptySignatures, rotateAllSignatures } from "@/app/admin/projects/actions"
import type { Project } from "@/db/types"

const SEMESTER_VALUES = Object.values(YEAR_MAP) as readonly string[]
const HIJRI_TO_GREGORIAN: Record<string, number> = Object.fromEntries(
  Object.entries(YEAR_MAP).map(([gregorian, hijri]) => [hijri, Number(gregorian)])
)

const collegeParser = parseAsArrayOf(parseAsStringEnum([...COLLEDGE_VALUES])).withOptions({ throttleMs: 0 })
const sectionParser = parseAsArrayOf(parseAsStringEnum([...SECTION_VALUES])).withOptions({ throttleMs: 0 })

type AdminProject = Project & { signature: string | null }

export function AdminProjectsList({ data }: { data: AdminProject[]; tags: string[] }) {
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

  return (
    <div className="space-y-6">
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
            <IconSignature className="size-4" />
            تعبئة التواقيع الفارغة
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setRotateDialogOpen(true)}
            disabled={rotating}
          >
            <IconRefresh className="size-4" />
            تدوير جميع التواقيع
          </Button>
        </div>
      </div>

      <Dialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعبئة التواقيع الفارغة</DialogTitle>
            <DialogDescription>
              سيتم إنشاء توقيع جديد لكل مشروع بدون توقيع. عدد المشاريع المتأثرة: <strong>{emptySigCount}</strong> مشروع.
            </DialogDescription>
          </DialogHeader>
          {emptySigCount === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <IconCheck className="size-4 text-green-500" />
              جميع المشاريع لديها تواقيع بالفعل.
            </div>
          )}
          <DialogFooter>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تدوير جميع التواقيع</DialogTitle>
            <DialogDescription>
              سيتم استبدال توقيع كل مشروع بتوقيع جديد. عدد المشاريع المتأثرة: <strong>{data.length}</strong> مشروع.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <IconAlertTriangle className="size-4 shrink-0" />
            هذا الإجراء لا يمكن التراجع عنه. الروابط القديمة ستنقضي.
          </div>
          <DialogFooter>
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

      <div className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
              onValueChange={(vals) => setSelectedColleges(vals.length > 0 ? (vals as typeof selectedColleges) : null)}
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
              onValueChange={(vals) => setSelectedSections(vals.length > 0 ? (vals as typeof selectedSections) : null)}
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
    </div>
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

      <div className="space-y-2 p-3">
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
          <IconSignature className="size-3 shrink-0 text-muted-foreground" />
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
                {copiedSig === project.signature ? (
                  <IconCheck className="size-3 text-green-500" />
                ) : (
                  <IconCopy className="size-3" />
                )}
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
