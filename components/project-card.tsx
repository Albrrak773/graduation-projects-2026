import { config } from "@/lib/config"
import { projectsTable, tagsTable } from "@/db/schema"
import { eq, sql, count } from "drizzle-orm"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { COLLEDGE_LABELS, COLLEDGE_COLORS } from "@/lib/config"

const MAX_VISIBLE_TAGS = 2

export async function ProjectCard({ projectId }: { projectId: string }) {
  const [projectRows, projectTags, tagCountRows] = await Promise.all([
    config.db
      .select({
        id: projectsTable.id,
        title: projectsTable.title,
        imageUrl: projectsTable.image_url,
        colledge: projectsTable.colledge,
      })
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .limit(1),
    config.db
      .select({ name: tagsTable.name })
      .from(tagsTable)
      .where(eq(tagsTable.project_id, projectId))
      .orderBy(sql`LENGTH(${tagsTable.name})`)
      .limit(MAX_VISIBLE_TAGS),
    config.db.select({ count: count() }).from(tagsTable).where(eq(tagsTable.project_id, projectId)),
  ])

  const project = projectRows[0]
  if (!project) return null

  const totalTags = tagCountRows[0]?.count ?? 0
  const remainingCount = Math.max(0, totalTags - MAX_VISIBLE_TAGS)
  const collegeLabel = project.colledge ? (COLLEDGE_LABELS[project.colledge] ?? project.colledge) : null
  const collegeColor = project.colledge ? (COLLEDGE_COLORS[project.colledge] ?? "") : ""
  const hasImage = project.imageUrl && project.imageUrl.length > 0

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "group/card block w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/30",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {hasImage ? (
          <Image
            src={project.imageUrl!}
            alt={project.title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-primary/5">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 font-heading text-2xl font-bold text-primary/60">
              {project.title[0]}
            </span>
          </div>
        )}
      </div>

      <div dir="ltr" className="space-y-3 px-5 pt-4 pb-5">
        <h3 className="line-clamp-2 min-h-[2.5rem] font-heading text-base leading-5 font-bold text-foreground">
          {project.title}
        </h3>

        {totalTags > 0 && (
          <div className="flex items-center gap-1.5 overflow-hidden">
            {projectTags.map((tag) => (
              <span
                key={tag.name}
                className="shrink-0 truncate rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-[0.6875rem] font-medium text-muted-foreground">+{remainingCount}</span>
            )}
          </div>
        )}

        {collegeLabel && (
          <div>
            <span
              className={cn(
                "inline-block rounded-full border border-current/10 px-2.5 py-0.5 text-[0.6875rem] font-semibold",
                collegeColor
              )}
            >
              {collegeLabel}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
