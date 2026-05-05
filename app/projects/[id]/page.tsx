import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllProjectIds, getProjectById } from "@/db/queries"
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
  IconSchool,
} from "@tabler/icons-react"
import { COLLEDGE_LABELS, COLLEDGE_COLORS, SECTION_LABELS } from "@/db/enums"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/footer"
import { ProjectHeroImage } from "@/components/project-hero-image"
import { SocialIconLink } from "@/components/social-icon-link"

type ProjectPageProps = {
  params: Promise<{ id: string }>
}

const BASE_LABELS: Record<string, string> = {
  Main: "المقر الرئيسي",
  Unaizah: "عنيزة",
  "Ar-Rass": "الرس",
}

export async function generateStaticParams() {
  const ids = await getAllProjectIds()
  return ids.map((id) => ({ id }))
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const project = await getProjectById(id)

  if (!project || project.is_public === false) {
    notFound()
  }

  const hasImage = project.image_url && project.image_url.length > 0
  const description = project.discription?.trim()
  const collegeLabel = COLLEDGE_LABELS[project.colledge]
  const sectionLabel = SECTION_LABELS[project.section]
  const baseLabel = BASE_LABELS[project.base]

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-14 pb-12 md:px-12 md:pt-20">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/20 to-background/60" />
            <div className="bg-muted/30">
              {hasImage ? (
                <ProjectHeroImage src={project.image_url!} alt={project.title} priority className="w-full" />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-primary/5">
                  <span className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 font-heading text-3xl font-bold text-primary/60">
                    {project.title[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="relative flex flex-col gap-6 border-t border-border/60 px-6 py-6 md:px-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
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
                  {sectionLabel && (
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {sectionLabel}
                    </span>
                  )}
                  {baseLabel && (
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {baseLabel}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h1 dir="auto" className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                    {project.title}
                  </h1>
                  <p className="text-sm font-medium text-muted-foreground md:text-base">
                    بإشراف: <span className="font-semibold text-foreground">{project.supervisor}</span>
                  </p>
                </div>
              </div>

              {project.project_external_link && (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={project.project_external_link}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    رابط المشروع
                    <IconExternalLink className="size-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur">
                <h2 className="font-heading text-xl font-bold text-foreground">وصف المشروع</h2>
                {description ? (
                  <p dir="auto" className="mt-4 text-base leading-7 whitespace-pre-line text-muted-foreground">
                    {description}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">لا يوجد وصف متاح حالياً.</p>
                )}
              </div>

              {project.tags.length > 0 && (
                <div className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur">
                  <h2 className="font-heading text-xl font-bold text-foreground">مجالات المشروع</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-semibold text-muted-foreground"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur">
              <h2 className="font-heading text-xl font-bold text-foreground">فريق المشروع</h2>
              {project.participants.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {project.participants.map((participant) => (
                    <div
                      key={`${participant.project_id}-${participant.uni_id}`}
                      className="rounded-2xl border border-border/60 bg-background p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-heading text-base font-bold text-foreground">{participant.name}</p>
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <IconSchool className="size-3.5" />
                            {participant.uni_id}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
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
                          {participant.email && (
                            <SocialIconLink
                              href={`mailto:${participant.email}`}
                              label={`${participant.name} Email`}
                              brand="mail"
                              icon={<IconMail className="size-4" />}
                              filledIcon={<IconMailFilled className="size-4" />}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">لا توجد بيانات للفريق حالياً.</p>
              )}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  )
}
