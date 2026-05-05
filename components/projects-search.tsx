"use client"

import { useMemo } from "react"
import Fuse from "fuse.js"
import { useQueryState, parseAsArrayOf, parseAsStringEnum } from "nuqs"
import { IconSearch } from "@tabler/icons-react"
import { ProjectCard, type ProjectCardProject, type ProjectCardTag } from "@/components/project-card"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type ProjectData = {
  project: ProjectCardProject
  tags: ProjectCardTag[]
}

const COLLEGES = ["CS", "IT", "COE"]
const SECTIONS = ["male", "female"]

const collegeParser = parseAsArrayOf(parseAsStringEnum(COLLEGES)).withOptions({ throttleMs: 0 })
const sectionParser = parseAsArrayOf(parseAsStringEnum(SECTIONS)).withOptions({ throttleMs: 0 })

export function ProjectsSearch({
  data,
  collegeLabels,
  sectionLabels,
}: {
  data: ProjectData[]
  collegeLabels: Record<string, string>
  sectionLabels: Record<string, string>
}) {
  const [search, setSearch] = useQueryState("search", { defaultValue: "", throttleMs: 300 })
  const [selectedColleges, setSelectedColleges] = useQueryState("college", collegeParser)
  const [selectedSections, setSelectedSections] = useQueryState("section", sectionParser)

  const fuseIndex = useMemo(
    () =>
      new Fuse(
        data.map(({ project, tags }) => ({
          id: project.id,
          title: project.title,
          tagNames: tags.map((t) => t.name).join(" "),
          project,
          tags,
        })),
        {
          keys: [
            { name: "title", weight: 0.7 },
            { name: "tagNames", weight: 0.3 },
          ],
          threshold: 0.3,
          includeScore: true,
        }
      ),
    [data]
  )

  const results = useMemo(() => {
    let items: ProjectData[] = data

    if (search.trim()) {
      const fuseResults = fuseIndex.search(search.trim())
      items = fuseResults.map((r) => ({
        project: r.item.project,
        tags: r.item.tags,
      }))
    }

    if (selectedColleges && selectedColleges.length > 0) {
      items = items.filter((item) => item.project.colledge && selectedColleges.includes(item.project.colledge))
    }

    if (selectedSections && selectedSections.length > 0) {
      items = items.filter((item) => item.project.section && selectedSections.includes(item.project.section))
    }

    return items
  }, [data, search, fuseIndex, selectedColleges, selectedSections])

  return (
    <section className="px-6 pb-16 md:px-12">
      <h1 className="sr-only">جميع المشاريع</h1>

      <div className="mx-auto max-w-6xl space-y-6">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ابحث عن مشروع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 ps-10 text-base"
          />
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">الكلية</span>
            <ToggleGroup
              type="multiple"
              variant="pill"
              value={(selectedColleges ?? []) as string[]}
              onValueChange={(vals) => setSelectedColleges(vals.length > 0 ? (vals as typeof selectedColleges) : null)}
            >
              {COLLEGES.map((c) => (
                <ToggleGroupItem key={c} value={c}>
                  {collegeLabels[c] ?? c}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">القسم</span>
            <ToggleGroup
              type="multiple"
              variant="pill"
              value={(selectedSections ?? []) as string[]}
              onValueChange={(vals) => setSelectedSections(vals.length > 0 ? (vals as typeof selectedSections) : null)}
            >
              {SECTIONS.map((s) => (
                <ToggleGroupItem key={s} value={s}>
                  {sectionLabels[s] ?? s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {results.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">لا توجد نتائج</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ project, tags }) => (
              <ProjectCard key={project.id} project={project} tags={tags} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
