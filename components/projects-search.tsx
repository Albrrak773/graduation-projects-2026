"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import Fuse from "fuse.js"
import { useQueryState, parseAsArrayOf, parseAsStringEnum } from "nuqs"
import { IconSearch, IconX } from "@tabler/icons-react"
import { COLLEDGE_VALUES, COLLEDGE_LABELS, SECTION_VALUES, SECTION_LABELS } from "@/db/enums"
import { ProjectCard } from "@/components/project-card"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import type { Project } from "@/db/types"

const collegeParser = parseAsArrayOf(parseAsStringEnum([...COLLEDGE_VALUES])).withOptions({ throttleMs: 0 })
const sectionParser = parseAsArrayOf(parseAsStringEnum([...SECTION_VALUES])).withOptions({ throttleMs: 0 })

export function ProjectsSearch({ data }: { data: Project[] }) {
  const [search, setSearch] = useQueryState("search", { defaultValue: "", throttleMs: 300 })
  const [selectedColleges, setSelectedColleges] = useQueryState("college", collegeParser)
  const [selectedSections, setSelectedSections] = useQueryState("section", sectionParser)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 180)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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
          project,
        })),
        {
          keys: [
            { name: "title", weight: 0.58 },
            { name: "tagNames", weight: 0.22 },
            { name: "year", weight: 0.12 },
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
    let items: Project[] = data

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

    return items
  }, [data, search, fuseIndex, selectedColleges, selectedSections])

  return (
    <section className="px-4 pb-16 sm:px-6 md:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-[#0d2b6b] px-5 py-8 text-white shadow-2xl shadow-[#0d2b6b]/15 md:px-8 md:py-10">
          <p className="mb-3 text-sm font-bold text-[#8edce6]">معرض المشاريع</p>
          <h1 className="font-heading text-3xl font-black md:text-5xl">ابحث في مشاريع التخرج</h1>
        </div>

        <div
          className={`surface-glass sticky z-10 rounded-3xl transition-all duration-300 ${
            compact ? "space-y-0 p-2" : "space-y-4 p-4"
          }`}
          style={{
            top: compact
              ? "calc(var(--notification-bar-height, 0px) + 0.75rem)"
              : "calc(var(--notification-bar-height, 0px) + 6.5rem)",
          }}
        >
          <div className="relative">
            <IconSearch className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ابحث عن مشروع، مجال، أو سنة مثل 2025..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={
                compact ? "h-10 rounded-2xl bg-white/90 ps-10 text-sm" : "h-12 rounded-2xl bg-white/80 ps-10 text-base"
              }
            />
          </div>

          <div className={compact ? "hidden" : "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"}>
            <div className="flex flex-wrap items-start gap-4">
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
            </div>

            {(search || selectedColleges?.length || selectedSections?.length) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-fit gap-2 rounded-full"
                onClick={() => {
                  setSearch("")
                  setSelectedColleges(null)
                  setSelectedSections(null)
                }}
              >
                <IconX className="size-4" />
                مسح الفلاتر
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-bold text-muted-foreground">
            {results.length} نتيجة
            {search ? ` عن "${search}"` : ""}
          </p>
        </div>

        {results.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border/70 bg-white/60 py-16 text-center text-muted-foreground">
            لا توجد نتائج
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      {children}
    </div>
  )
}
