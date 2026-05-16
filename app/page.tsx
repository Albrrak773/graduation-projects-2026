import Image from "next/image"
import Link from "next/link"
import { cacheLife, cacheTag } from "next/cache"
import { eq } from "drizzle-orm"
import { COLLEDGE_LABELS, COLLEDGE_VALUES } from "@/db/enums"
import { projectsTable } from "@/db/schema"
import { getProjects } from "@/db/queries"
import { ProjectCard } from "@/components/project-card"
import { Footer } from "@/components/footer"
import { PageIntro } from "@/components/page-intro"
import { Hero } from "@/components/hero"
import { AllProjectsSection } from "@/components/all-projects-section"
import { GDGCallout } from "@/components/gdg-callout"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import type { Project } from "@/db/types"

const PROJECTS_PER_SECTION = 10
const CURRENT_YEAR = 2026

async function getPublicHomeProjects() {
  "use cache"
  cacheLife("days")
  cacheTag("projects")

  try {
    return await getProjects(eq(projectsTable.is_public, true))
  } catch {
    return []
  }
}

function CollegeProjectList({ projects }: { projects: Project[] }) {
  return (
    <>
      {projects.slice(0, PROJECTS_PER_SECTION).map((project) => (
        <div key={project.id} className="w-[17rem] shrink-0 snap-start sm:w-72 md:w-80">
          <ProjectCard project={project} />
        </div>
      ))}
    </>
  )
}

function CollegeSection({ college, projects }: { college: (typeof COLLEDGE_VALUES)[number]; projects: Project[] }) {
  if (projects.length === 0) return null

  return (
    <section
      className="group relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 md:px-12"
      id="project-categories"
    >
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
        <div className="flex items-center gap-4">
          <div className="h-10 w-1.5 rounded-full bg-gradient-to-b from-brand-teal to-brand-blue" />
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{COLLEDGE_LABELS[college]}</h2>
        </div>
        <Link
          href={`/projects?college=${college}`}
          className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-4 py-2 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/10"
        >
          الكل
          <IconArrowLeft className="size-4" />
        </Link>
      </div>

      <div className="hide-scrollbar -mb-8 w-full snap-x snap-mandatory overflow-x-auto overflow-y-visible scroll-smooth pb-8 [-webkit-overflow-scrolling:touch]">
        <div className="flex w-max gap-5 px-1 pt-3 md:gap-6">
          <CollegeProjectList projects={projects} />
        </div>
      </div>
    </section>
  )
}

function pickProjects(projects: Project[], count: number) {
  return projects.slice(0, count)
}

function PreviousProjectsSection({ projects }: { projects: Project[] }) {
  const previousProjects = pickProjects(
    projects.filter((project) => project.year === CURRENT_YEAR - 1),
    3
  )

  if (previousProjects.length === 0) return null

  return (
    <section className="px-4 pt-12 pb-4 sm:px-6 md:px-12 md:pt-20 md:pb-6">
      <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-3xl bg-[#0d2b6b] p-5 text-white shadow-2xl shadow-[#0d2b6b]/15 md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div className="flex flex-col justify-center gap-8 p-2 md:p-4">
          <div>
            <p className="mb-3 text-sm font-bold text-[#8edce6]">مشاريع السنة السابقة</p>
            <h2 className="font-heading text-3xl leading-tight font-black md:text-5xl">أرشيف مشاريع السنوات السابقة</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {previousProjects.map((project, index) => (
            <Link
              href={`/projects/${project.id}`}
              key={project.id}
              className="relative aspect-[9/14] overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-xl transition hover:-translate-y-1"
              style={{ marginTop: index === 1 ? "1.5rem" : index === 2 ? "3rem" : "0" }}
            >
              {project.image_url ? (
                <Image
                  src={project.image_url}
                  alt={project.title}
                  fill
                  className="object-cover object-top"
                  sizes="220px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 p-3">
                  <span
                    dir="auto"
                    className="line-clamp-4 text-center font-heading text-sm font-black text-white/75 md:text-base"
                  >
                    {project.title}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function YearBrowseSection() {
  return (
    <section className="px-4 pt-2 pb-8 sm:px-6 md:px-12 md:pt-3">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
        <Link
          href="/projects?search=2026"
          className="group rounded-3xl border border-white/55 bg-white/58 p-6 shadow-[0_20px_70px_rgba(13,43,107,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/72 hover:shadow-xl md:p-8"
        >
          <p className="mb-4 font-heading text-6xl leading-none font-black text-brand-teal md:text-8xl">2026</p>
          <h2 className="font-heading text-2xl font-black">مشاريع السنة الحالية</h2>
        </Link>
        <Link
          href="/projects?search=2025"
          className="group rounded-3xl border border-white/55 bg-white/58 p-6 shadow-[0_20px_70px_rgba(13,43,107,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/72 hover:shadow-xl md:p-8"
        >
          <p className="mb-4 font-heading text-6xl leading-none font-black text-brand-blue md:text-8xl">2025</p>
          <h2 className="font-heading text-2xl font-black">مشاريع السنة السابقة</h2>
        </Link>
      </div>
    </section>
  )
}

function ExploreAllProjectsButton() {
  return (
    <div className="px-4 pb-12 text-center sm:px-6 md:px-12 md:pb-20">
      <Button asChild size="lg" className="h-14 rounded-full px-8 text-base font-black shadow-lg shadow-primary/15">
        <Link href="/projects">
          استكشف كل المشاريع
          <IconArrowLeft className="size-5" />
        </Link>
      </Button>
    </div>
  )
}

export default async function HomePage() {
  const projects = await getPublicHomeProjects()

  return (
    <div className="relative min-h-screen selection:bg-brand-teal/30">
      <div className="relative z-10">
        <PageIntro />
        <Hero />

        <AllProjectsSection projects={projects} />

        <GDGCallout />

        {projects.length > 0 && (
          <>
            <div className="flex flex-col gap-10 py-12 md:py-20">
              {COLLEDGE_VALUES.map((college) => (
                <CollegeSection
                  key={college}
                  college={college}
                  projects={projects.filter((project) => project.colledge === college)}
                />
              ))}
            </div>
            <ExploreAllProjectsButton />
          </>
        )}

        <PreviousProjectsSection projects={projects} />

        <YearBrowseSection />

        <Footer />
      </div>
    </div>
  )
}
