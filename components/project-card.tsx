"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { toHijri } from "@/lib/years"
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
    <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
      <Link
        href={`/projects/${project.id}`}
        className={cn(
          "group/card block w-full overflow-hidden rounded-3xl border border-white/70 bg-white/82 shadow-[0_20px_60px_rgba(13,43,107,0.08)] backdrop-blur",
          "transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_28px_80px_rgba(13,43,107,0.14)]",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        )}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {hasImage ? (
            <Image
              src={project.image_url!}
              alt={project.title}
              fill
              quality={60}
              className="object-cover object-top transition duration-500 group-hover/card:scale-[1.035]"
              sizes="(max-width: 640px) 272px, (max-width: 768px) 288px, 320px"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-primary/5">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 font-heading text-2xl font-bold text-primary/60">
                {project.title[0]}
              </span>
            </div>
          )}
          {project.year && (
            <span className="absolute start-3 top-3 rounded-full bg-white/88 px-3 py-1 text-xs font-black text-brand-darkblue shadow-sm backdrop-blur">
              {toHijri(project.year)}
            </span>
          )}
        </div>

        <div dir="auto" className="space-y-3 px-5 pt-4 pb-5">
          <h3 className="line-clamp-2 min-h-11 font-heading text-lg leading-6 font-black text-foreground">
            {project.title}
          </h3>

          {totalTags > 0 && (
            <div className="flex items-center gap-1.5 overflow-hidden">
              {visibleTags.map((tag) => (
                <span
                  key={tag.id}
                  className="shrink-0 truncate rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
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
    </motion.div>
  )
}
