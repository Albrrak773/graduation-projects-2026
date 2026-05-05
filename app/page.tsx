import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { config, COLLEDGE_LABELS } from "@/lib/config"
import { colledgeEnum, projectsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ProjectCard } from "@/components/project-card"
import { Footer } from "@/components/footer"

const COLLEGES = colledgeEnum.enumValues
const PROJECTS_PER_SECTION = 10

async function CollegeProjectList({ college }: { college: (typeof COLLEGES)[number] }) {
  const projects = await config.db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.colledge, college))
    .limit(PROJECTS_PER_SECTION)

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد مشاريع بعد</p>
  }

  return (
    <>
      {projects.map((p) => (
        <div key={p.id} className="w-65 shrink-0 md:w-70">
          <ProjectCard projectId={p.id} />
        </div>
      ))}
    </>
  )
}

function CollegeSection({ college }: { college: (typeof COLLEGES)[number] }) {
  return (
    <section className="relative">
      <div className="flex items-center justify-between px-6 py-6 md:px-12">
        <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{COLLEDGE_LABELS[college]}</h2>
        <Link
          href="#"
          className="rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
        >
          الكل
        </Link>
      </div>
      <div className="w-full overflow-x-auto overflow-y-hidden scroll-smooth [-webkit-overflow-scrolling:touch]">
        <div className="flex gap-5 px-6 pb-4 md:px-12">
          <Suspense fallback={<SectionFallback />}>
            <CollegeProjectList college={college} />
          </Suspense>
        </div>
      </div>
    </section>
  )
}

function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16 md:pt-32 md:pb-20">
      <Image
        src="/design/logo.png"
        alt="مشاريع التخرج"
        className="w-full max-w-md md:max-w-lg"
        width={480}
        height={200}
        priority
      />
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
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: "url('/design/pattern-2.png')",
          backgroundSize: "300px",
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative z-10">
        <HeroSection />

        <div className="flex flex-col gap-8">
          {COLLEGES.map((college) => (
            <CollegeSection key={college} college={college} />
          ))}
        </div>

        <Footer />
      </div>
    </div>
  )
}
