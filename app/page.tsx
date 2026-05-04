import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { config, COLLEDGE_LABELS, TEAM_MEMBERS } from "@/lib/config"
import { projectsTable } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { ProjectCard } from "@/components/project-card"

const COLLEGES = ["CS", "IT", "COE"] as const
const PROJECTS_PER_SECTION = 10

async function CollegeSection({ college }: { college: (typeof COLLEGES)[number] }) {
  const projects = await config.db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.colledge, college))
    .orderBy(desc(projectsTable.id))
    .limit(PROJECTS_PER_SECTION)

  if (projects.length === 0) return null

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
          {projects.map((p) => (
            <div key={p.id} className="w-[260px] shrink-0 md:w-[280px]">
              <Suspense fallback={<div className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />}>
                <ProjectCard projectId={p.id} />
              </Suspense>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="relative mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-12 md:py-16">
        <div className="flex flex-col items-center gap-6">
          <Image src="/design/logo.png" alt="مشاريع التخرج" className="h-20 w-auto md:h-24" width={200} height={80} />

          <p className="text-sm text-muted-foreground md:text-base">صُنع بحب بواسطة</p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold text-foreground md:text-base">{member.name}</span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.423 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.308.678.92.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.195 22 16.417 22 12.017 22 6.484 17.522 2 12 2z" />
                    </svg>
                  </a>
                  <a
                    href={member.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
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
    <div className="flex gap-5 px-6 pb-4 md:px-12">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-[260px] shrink-0 md:w-[280px]">
          <div className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
        </div>
      ))}
    </div>
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
            <section key={college}>
              <Suspense fallback={<SectionFallback />}>
                <CollegeSection college={college} />
              </Suspense>
            </section>
          ))}
        </div>

        <Footer />
      </div>
    </div>
  )
}
