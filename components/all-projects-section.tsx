import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { eq } from "drizzle-orm"
import { projectsTable } from "@/db/schema"
import { getProjects } from "@/db/queries"
import { COLLEDGE_LABELS, COLLEDGE_VALUES } from "@/db/enums"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

async function AllProjectsData() {
  "use cache"
  cacheLife("days")
  cacheTag("projects")

  const allProjects = await getProjects(eq(projectsTable.is_public, true))

  const counts = COLLEDGE_VALUES.map((college) => {
    const collegeProjects = allProjects.filter((p) => p.colledge === college)
    return { college, count: collegeProjects.length }
  })

  const totalCount = allProjects.length

  const featuredImages = allProjects.filter((p) => p.image_url && p.image_url.length > 0).slice(0, 4)

  return <AllProjectsSectionContent totalCount={totalCount} counts={counts} featuredImages={featuredImages} />
}

function AllProjectsSectionContent({
  totalCount,
  counts,
  featuredImages,
}: {
  totalCount: number
  counts: { college: string; count: number }[]
  featuredImages: { id: string; title: string; image_url: string | null }[]
}) {
  return (
    <section className="relative overflow-hidden px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 md:flex-row md:gap-16">
        <div className="flex flex-1 flex-col items-start gap-6">
          <h1 className="font-heading text-4xl leading-tight font-bold text-foreground md:text-5xl lg:text-6xl">
            مشاريع التخرج 2026
          </h1>

          <p className="text-lg text-muted-foreground md:text-xl">{totalCount}+ مشروع تخرج من مختلف التخصصات</p>

          <div className="flex flex-wrap items-center gap-3">
            {counts.map(({ college, count }) => (
              <span
                key={college}
                className="rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-sm font-medium text-muted-foreground"
              >
                {COLLEDGE_LABELS[college]}: {count}
              </span>
            ))}
          </div>

          <Link href="/projects">
            <Button size="lg" className="mt-2 gap-2 text-sm font-bold">
              <IconArrowLeft className="size-4" />
              عرض الكل
            </Button>
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center" dir="ltr">
          {featuredImages.length >= 3 ? (
            <div className="relative h-72 w-56 md:h-96 md:w-72">
              <div className="absolute top-4 right-0 z-0 h-56 w-40 -rotate-6 overflow-hidden rounded-2xl shadow-lg md:top-6 md:right-2 md:h-72 md:w-52">
                <Image
                  src={featuredImages[0].image_url!}
                  alt={featuredImages[0].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 160px, 208px"
                />
              </div>
              <div className="absolute top-0 right-16 z-10 h-56 w-40 rotate-3 overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 hover:scale-105 hover:rotate-0 md:right-20 md:h-72 md:w-52">
                <Image
                  src={featuredImages[1].image_url!}
                  alt={featuredImages[1].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 160px, 208px"
                />
              </div>
              <div className="absolute right-32 bottom-4 z-20 h-56 w-40 -rotate-3 overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 hover:rotate-0 md:right-40 md:bottom-6 md:h-72 md:w-52">
                <Image
                  src={featuredImages[2].image_url!}
                  alt={featuredImages[2].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 160px, 208px"
                />
              </div>
            </div>
          ) : featuredImages.length > 0 ? (
            <div className="relative h-64 w-48 overflow-hidden rounded-2xl shadow-lg md:h-80 md:w-60">
              <Image
                src={featuredImages[0].image_url!}
                alt={featuredImages[0].title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 192px, 240px"
              />
            </div>
          ) : (
            <div className="flex h-64 w-48 items-center justify-center rounded-2xl bg-primary/5 md:h-80 md:w-60">
              <span className="font-heading text-6xl font-bold text-primary/20">۲۰۲٦</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function AllProjectsFallback() {
  return (
    <section className="relative overflow-hidden px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 md:flex-row md:gap-16">
        <div className="flex flex-1 flex-col items-start gap-6">
          <div className="h-14 w-72 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-56 animate-pulse rounded-md bg-muted" />
          <div className="flex gap-3">
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-72 w-56 animate-pulse rounded-2xl bg-muted md:h-96 md:w-72" />
        </div>
      </div>
    </section>
  )
}

export function AllProjectsSection() {
  return (
    <Suspense fallback={<AllProjectsFallback />}>
      <AllProjectsData />
    </Suspense>
  )
}
