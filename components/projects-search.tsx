"use client"

import { useMemo, Fragment } from "react"
import Fuse from "fuse.js"
import { useQueryState, parseAsArrayOf, parseAsStringEnum, parseAsString } from "nuqs"
import { IconSearch } from "@tabler/icons-react"
import { COLLEDGE_VALUES, COLLEDGE_LABELS, SECTION_VALUES, SECTION_LABELS } from "@/db/enums"
import { ProjectCard } from "@/components/project-card"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Project } from "@/db/types"

const SEMESTER_VALUES = ["١٤٤٦", "١٤٤٧"] as const
const HIJRI_TO_GREGORIAN: Record<string, number> = {
  "١٤٤٦": 2025,
  "١٤٤٧": 2026,
}

const collegeParser = parseAsArrayOf(parseAsStringEnum([...COLLEDGE_VALUES])).withOptions({ throttleMs: 0 })
const sectionParser = parseAsArrayOf(parseAsStringEnum([...SECTION_VALUES])).withOptions({ throttleMs: 0 })
const tagsParser = parseAsArrayOf(parseAsString).withOptions({ throttleMs: 0 })

export function ProjectsSearch({ data, tags }: { data: Project[]; tags: string[] }) {
  const anchor = useComboboxAnchor()

  const [search, setSearch] = useQueryState("search", { defaultValue: "", throttleMs: 300 })
  const [selectedColleges, setSelectedColleges] = useQueryState("college", collegeParser)
  const [selectedSections, setSelectedSections] = useQueryState("section", sectionParser)
  const [selectedSemester, setSelectedSemester] = useQueryState(
    "semester",
    parseAsStringEnum([...SEMESTER_VALUES]).withOptions({ throttleMs: 0 })
  )
  const [selectedTags, setSelectedTags] = useQueryState("tags", tagsParser)

  const fuseIndex = useMemo(
    () =>
      new Fuse(
        data.map((project) => ({
          id: project.id,
          title: project.title,
          tagNames: project.tags.map((t) => t.name).join(" "),
          project,
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

    if (selectedSemester) {
      const gregorian = HIJRI_TO_GREGORIAN[selectedSemester]
      if (gregorian) {
        items = items.filter((item) => item.year && item.year === gregorian)
      }
    }

    if (selectedTags && selectedTags.length > 0) {
      items = items.filter((item) => item.tags.some((tag) => selectedTags.includes(tag.name)))
    }

    return items
  }, [data, search, fuseIndex, selectedColleges, selectedSections, selectedSemester, selectedTags])

  return (
    <section className="px-6 pb-16 md:px-12">
      <h1 className="sr-only">جميع المشاريع</h1>

      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-6 rounded-[calc(var(--radius-sm)+2px)] border border-border/70 bg-card/80 bg-white p-4 shadow-sm backdrop-blur">
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
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">القسم</span>
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
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">العام</span>
              <Select
                value={selectedSemester ?? undefined}
                onValueChange={(val) => setSelectedSemester(val as typeof selectedSemester)}
              >
                <SelectTrigger className="h-[34px] rounded-full border-border bg-transparent px-4 text-sm font-medium text-muted-foreground data-[state=open]:border-primary/30 data-[state=open]:bg-primary/10 data-[state=open]:font-semibold data-[state=open]:text-primary">
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
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">المجالات</span>
              <Combobox
                multiple
                autoHighlight
                items={tags}
                value={(selectedTags ?? []) as string[]}
                onValueChange={(vals) => setSelectedTags(vals.length > 0 ? (vals as typeof selectedTags) : null)}
              >
                <ComboboxChips ref={anchor} className="w-full max-w-xs">
                  <ComboboxValue>
                    {(values) => (
                      <Fragment>
                        {values.map((value: string) => (
                          <ComboboxChip
                            key={value}
                            className="border-primary/30 bg-primary/10 font-semibold text-primary"
                          >
                            {value}
                          </ComboboxChip>
                        ))}
                        <ComboboxChipsInput />
                      </Fragment>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={anchor}>
                  <ComboboxEmpty>لا توجد نتائج</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">لا توجد نتائج</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
