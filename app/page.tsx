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
import { AnnouncementSection } from "@/components/announcement-section"

const PROJECTS_PER_SECTION = 10

async function CollegeProjectList({ college }: { college: (typeof COLLEDGE_VALUES)[number] }) {
  "use cache"
  cacheLife("days")
  cacheTag("projects")
  const projects = await getProjects(eq(projectsTable.colledge, college))

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد مشاريع بعد</p>
  }

  return (
    <>
      {projects.slice(0, PROJECTS_PER_SECTION).map((project) => (
        <div key={project.id} className="w-65 shrink-0 md:w-70">
          <ProjectCard project={project} />
        </div>
      ))}
    </>
  )
}

function CollegeSection({ college }: { college: (typeof COLLEDGE_VALUES)[number] }) {
  return (
    <section className="relative">
      <div className="flex items-center justify-between px-6 py-6 md:px-12">
        <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{COLLEDGE_LABELS[college]}</h2>
        <Link
          href={`/projects?college=${college}`}
          className="rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
        >
          الكل
        </Link>
      </div>
      <div className="w-full overflow-x-auto overflow-y-visible scroll-smooth [-webkit-overflow-scrolling:touch]">
        <div className="flex gap-5 px-6 pt-3 pb-4 md:px-12">
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
      {Array.from({ length: PROJECTS_PER_SECTION }).map((_, i) => (
        <div key={i} className="w-65 shrink-0 md:w-70">
          <div className="aspect-3/4 animate-pulse rounded-2xl bg-muted" />
        </div>
      ))}
    </>
  )
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <Hero />
        <Suspense fallback={null}>
          <AnnouncementSection />
        </Suspense>
        <AllProjectsSection />

        <div className="flex flex-col gap-8">
          {COLLEDGE_VALUES.map((college) => (
            <CollegeSection key={college} college={college} />
          ))}
        </div>

        <Footer />
      </div>
    </div>
  )
}
