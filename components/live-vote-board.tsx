"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { LiveVotesResponse } from "@/app/api/votes/live/route"

const POLL_INTERVAL_MS = 3000

const numberFormat = new Intl.NumberFormat("en-US")

export function LiveVoteBoard() {
  const [data, setData] = useState<LiveVotesResponse | null>(null)
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      // A backgrounded tab keeps its timer but skips the request; it catches up on the next visible tick.
      if (document.visibilityState === "visible") {
        try {
          const response = await fetch("/api/votes/live", { cache: "no-store" })
          if (!response.ok) throw new Error(`Live votes request failed: ${response.status}`)
          const next = (await response.json()) as LiveVotesResponse
          if (cancelled) return
          setData(next)
          setIsStale(false)
        } catch {
          if (cancelled) return
          setIsStale(true)
        }
      }
      if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return
      clearTimeout(timer)
      void poll()
    }

    void poll()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  if (!data) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <div className="h-16 w-2/3 animate-pulse rounded-xl bg-muted" />
        <div className="flex flex-col gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const { campaign, totalVotes, projects } = data
  const maxVotes = projects[0]?.votes ?? 0

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <LiveStatus isActive={campaign?.isActive ?? false} isStale={isStale} />
          <h1 className="font-heading text-3xl font-bold sm:text-5xl">أعلى 10 مشاريع في التصويت</h1>
          {campaign && <p className="text-sm text-muted-foreground sm:text-base">{campaign.name}</p>}
        </div>
        <div className="flex flex-col items-start sm:items-end">
          <span className="text-xs text-muted-foreground sm:text-sm">إجمالي الأصوات</span>
          <span className="font-heading text-4xl font-bold tabular-nums sm:text-6xl">
            {numberFormat.format(totalVotes)}
          </span>
        </div>
      </header>

      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {campaign ? "لم تُسجَّل أي أصوات بعد." : "لا توجد حملة تصويت حالياً."}
        </p>
      ) : (
        <ol className="flex flex-col gap-4 sm:gap-5">
          {projects.map((project, index) => (
            <motion.li
              key={project.projectId}
              layout="position"
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 sm:gap-x-4"
            >
              <span className="row-span-2 w-7 text-center font-heading text-xl font-bold text-muted-foreground tabular-nums sm:w-9 sm:text-2xl">
                {index + 1}
              </span>
              <div className="flex items-baseline justify-between gap-3">
                <span dir="auto" className="line-clamp-1 text-sm font-medium sm:text-lg">
                  {project.title}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums sm:text-lg">
                  {numberFormat.format(project.votes)}
                </span>
              </div>
              <div className="h-3 sm:h-4">
                <motion.div
                  className="h-full min-w-1 rounded-e-sm bg-primary"
                  initial={false}
                  animate={{ width: `${maxVotes > 0 ? (project.votes / maxVotes) * 100 : 0}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 24 }}
                />
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  )
}

function LiveStatus({ isActive, isStale }: { isActive: boolean; isStale: boolean }) {
  if (isStale) {
    return (
      <span className="text-xs font-medium text-muted-foreground sm:text-sm">انقطع الاتصال، جارٍ إعادة المحاولة…</span>
    )
  }

  if (!isActive) {
    return (
      <span className="text-xs font-medium text-muted-foreground sm:text-sm">انتهى التصويت · النتائج النهائية</span>
    )
  }

  return (
    <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
      </span>
      مباشر
    </span>
  )
}
