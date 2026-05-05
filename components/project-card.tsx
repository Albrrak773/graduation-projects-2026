import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { COLLEDGE_LABELS, COLLEDGE_COLORS } from "@/db/enums"
import type { Project } from "@/db/types"

const MAX_VISIBLE_TAGS = 2

export function ProjectCard({ project }: { project: Project }) {
  const totalTags = project.tags.length
  const visibleTags = project.tags.slice(0, MAX_VISIBLE_TAGS)
  const remainingCount = Math.max(0, totalTags - MAX_VISIBLE_TAGS)
  const collegeLabel = COLLEDGE_LABELS[project.colledge]
  const collegeColor = COLLEDGE_COLORS[project.colledge]
  const hasImage = project.image_url && project.image_url.length > 0

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
      <div className="relative aspect-3/4 overflow-hidden bg-muted">
        {hasImage ? (
          <Image
            src={project.image_url!}
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
        <h3 className="line-clamp-2 min-h-10 font-heading text-base leading-5 font-bold text-foreground">
          {project.title}
        </h3>

        {totalTags > 0 && (
          <div className="flex items-center gap-1.5 overflow-hidden">
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
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
