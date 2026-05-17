import Link from "next/link"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import {
  IconBrandGithub,
  IconBrandGithubFilled,
  IconBrandLinkedin,
  IconBrandLinkedinFilled,
  IconBrandX,
  IconBrandXFilled,
  IconExternalLink,
  IconMail,
  IconMailFilled,
} from "@tabler/icons-react"
import { COLLEDGE_COLORS, COLLEDGE_LABELS, SECTION_LABELS } from "@/db/enums"
import { toHijri } from "@/lib/years"
import { getAllProjectIds, getProjectById, getRelatedProjects } from "@/db/queries"
import type { Project } from "@/db/types"
import { Footer } from "@/components/footer"
import { NavBar } from "@/components/nav-bar"
import { ProjectCard } from "@/components/project-card"
import { ProjectHeroImage } from "@/components/project-hero-image"
import { SocialIconLink } from "@/components/social-icon-link"
import { cn } from "@/lib/utils"

type ProjectPageProps = {
  params: Promise<{ id: string }>
}

const BASE_LABELS: Record<string, string> = {
  Main: "المقر الرئيسي",
  Unaizah: "عنيزة",
  "Ar-Rass": "الرس",
}

export async function generateStaticParams() {
  let ids: string[] = []

  try {
    ids = await getAllProjectIds()
  } catch (error) {
    console.error("Failed to fetch project IDs:", error)
    ids = ["__placeholder__"]
  }

  return ids.map((id) => ({ id }))
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  let project: Project | undefined

  try {
    project = await getProjectById(id)
  } catch (error) {
    console.error("Failed to fetch project:", error)
    project = undefined
  }

  if (!project || project.is_public === false) {
    notFound()
  }

  let relatedProjects: Project[] = []

  try {
    relatedProjects = await getRelatedProjects(project)
  } catch (error) {
    console.error("Failed to fetch related projects:", error)
    relatedProjects = []
  }

  const hasImage = Boolean(project.image_url)
  const displayImageUrl = project.image_thumb_url || project.image_url
  const description = project.discription?.trim()
  const collegeLabel = COLLEDGE_LABELS[project.colledge]
  const sectionLabel = SECTION_LABELS[project.section]
  const baseLabel = BASE_LABELS[project.base]

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <NavBar projectTitle={project.title} />
        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-6 pb-12 sm:px-6 md:px-12 md:pt-10">
          <section className="surface-glass rounded-3xl p-5 md:p-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {collegeLabel && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border border-current/10 px-3 py-1 text-xs font-semibold",
                    COLLEDGE_COLORS[project.colledge]
                  )}
                >
                  {collegeLabel}
                </span>
              )}
              {sectionLabel && <Pill>{sectionLabel}</Pill>}
              {baseLabel && <Pill>{baseLabel}</Pill>}
              {project.year && <Pill>{toHijri(project.year)}</Pill>}
            </div>

            <h1
              dir="auto"
              className="font-heading text-3xl leading-tight font-black text-balance text-foreground md:text-5xl"
            >
              {project.title}
            </h1>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/82 shadow-[0_30px_90px_rgba(13,43,107,0.12)] backdrop-blur">
            {hasImage ? (
              <div className="space-y-3 bg-white/70 p-3">
                <ProjectHeroImage src={displayImageUrl!} alt={project.title} priority className="w-full" />
                {project.image_thumb_url && (
                  <div className="flex justify-center">
                    <Link
                      href={project.image_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"
                    >
                      عرض الصورة بالحجم الكامل
                      <IconExternalLink className="size-4" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-3/4 w-full items-center justify-center bg-primary/5">
                <span className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 font-heading text-3xl font-bold text-primary/60">
                  {project.title[0]}
                </span>
              </div>
            )}
          </section>

          {project.tags.length > 0 && (
            <InfoCard title="مجالات المشروع">
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}

          <InfoCard title="وصف المشروع">
            {description ? (
              <p dir="auto" className="text-base leading-8 whitespace-pre-line text-muted-foreground">
                {description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">لا يوجد وصف متاح حالياً.</p>
            )}
          </InfoCard>

          {project.project_external_link && (
            <InfoCard title="المرفقات والروابط">
              <Link
                href={project.project_external_link}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10"
                target="_blank"
                rel="noopener noreferrer"
              >
                رابط المشروع
                <IconExternalLink className="size-4" />
              </Link>
            </InfoCard>
          )}

          <InfoCard title="فريق المشروع">
            {project.participants.length > 0 ? (
              <div className="space-y-3">
                {project.participants.map((participant) => {
                  const email = participant.personal_email || `${participant.uni_id}@qu.edu.sa`

                  return (
                    <div
                      key={`${participant.project_id}-${participant.uni_id}`}
                      className="rounded-2xl border border-border/60 bg-white/75 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-heading text-base font-black text-foreground">
                            {participant.name}
                          </p>
                          <p dir="ltr" className="truncate text-xs text-muted-foreground">
                            {email}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                          {participant.github_url && (
                            <SocialIconLink
                              href={participant.github_url}
                              label={`${participant.name} GitHub`}
                              brand="github"
                              icon={<IconBrandGithub className="size-4" />}
                              filledIcon={<IconBrandGithubFilled className="size-4" />}
                            />
                          )}
                          {participant.x_url && (
                            <SocialIconLink
                              href={participant.x_url}
                              label={`${participant.name} X`}
                              brand="x"
                              icon={<IconBrandX className="size-4" />}
                              filledIcon={<IconBrandXFilled className="size-4" />}
                            />
                          )}
                          {participant.linked_url && (
                            <SocialIconLink
                              href={participant.linked_url}
                              label={`${participant.name} LinkedIn`}
                              brand="linkedin"
                              icon={<IconBrandLinkedin className="size-4" />}
                              filledIcon={<IconBrandLinkedinFilled className="size-4" />}
                            />
                          )}
                          <SocialIconLink
                            href={`mailto:${email}`}
                            label={`${participant.name} Email`}
                            brand="mail"
                            icon={<IconMail className="size-4" />}
                            filledIcon={<IconMailFilled className="size-4" />}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد بيانات للفريق حالياً.</p>
            )}
          </InfoCard>

          {relatedProjects.length > 0 && (
            <section className="pt-6">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-brand-teal">مشاريع مقترحة</p>
                  <h2 className="font-heading text-2xl font-black md:text-3xl">قد تهمك أيضاً</h2>
                </div>
                <Link
                  href={`/projects?college=${project.colledge}`}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  عرض المزيد
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedProjects.map((related) => (
                  <ProjectCard key={related.id} project={related} />
                ))}
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>
    </div>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-white/75 px-3 py-1 text-xs font-semibold text-muted-foreground">
      {children}
    </span>
  )
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-glass rounded-3xl p-5 md:p-6">
      <h2 className="mb-4 font-heading text-xl font-black text-foreground">{title}</h2>
      {children}
    </section>
  )
}
