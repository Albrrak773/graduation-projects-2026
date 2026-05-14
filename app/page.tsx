import Link from "next/link"
import { Suspense } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { COLLEDGE_LABELS, COLLEDGE_VALUES } from "@/db/enums"
import { projectsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getProjects } from "@/db/queries"
import { ProjectCard } from "@/components/project-card"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/hero"
import { AllProjectsSection } from "@/components/all-projects-section"
import { GDGCallout } from "@/components/gdg-callout"

const PROJECTS_PER_SECTION = 10

async function CollegeProjectList({ college }: { college: (typeof COLLEDGE_VALUES)[number] }) {
  "use cache"
  cacheLife("days")
  cacheTag("projects")
  const projects = await getProjects(eq(projectsTable.colledge, college))

  if (projects.length === 0) {
    return (
      <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 py-12">
        <p className="font-sans text-sm text-muted-foreground">لا توجد مشاريع بعد</p>
      </div>
    )
  }

  return (
    <>
      {projects.slice(0, PROJECTS_PER_SECTION).map((project) => (
        <div key={project.id} className="w-72 shrink-0 snap-start md:w-80">
          <ProjectCard project={project} />
        </div>
      ))}
    </>
  )
}

function CollegeSection({ college }: { college: (typeof COLLEDGE_VALUES)[number] }) {
  return (
    <section className="group relative mx-auto w-full max-w-[1600px] px-6 py-8 md:px-12">
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1.5 rounded-full bg-brand-teal" />
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{COLLEDGE_LABELS[college]}</h2>
        </div>
        <Link
          href={`/projects?college=${college}`}
          className="rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
        >
          الكل
        </Link>
      </div>

      <div className="hide-scrollbar -mb-8 w-full snap-x snap-mandatory overflow-x-auto overflow-y-visible scroll-smooth pb-8 [-webkit-overflow-scrolling:touch]">
        <div className="flex w-max gap-6 px-1 pt-3">
          <Suspense fallback={<SectionFallback />}>
            <CollegeProjectList college={college} />
          </Suspense>
        </div>
      </div>
    </section>
  )
}

function SectionFallback() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-72 shrink-0 md:w-80">
          <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        </div>
      ))}
    </>
  )
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background selection:bg-brand-teal/30">
      <div className="relative z-10">
        <Hero />

        <AllProjectsSection />

        <GDGCallout />

        <div className="flex flex-col gap-12 py-16 md:py-24">
          {COLLEDGE_VALUES.map((college) => (
            <CollegeSection key={college} college={college} />
          ))}
        </div>

        <Footer />
      </div>
    </div>
  )
}
