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
      <div className="flex flex-col gap-5" aria-busy="true">
        <div className="h-36 animate-pulse rounded-2xl border bg-card" />
        <div className="h-[36rem] animate-pulse rounded-2xl border bg-card" />
      </div>
    )
  }

  const { campaign, totalVotes, projects } = data
  const maxVotes = projects[0]?.votes ?? 0

  return (
    <div className="flex flex-1 flex-col gap-5 text-card-foreground">
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-3">
          <LiveStatus isActive={campaign?.isActive ?? false} isStale={isStale} />
          <h1 className="font-heading text-3xl font-bold sm:text-5xl">أعلى 10 مشاريع في التصويت</h1>
          {campaign && <p className="text-sm font-medium text-card-foreground/75 sm:text-lg">{campaign.name}</p>}
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-primary px-5 py-3 text-primary-foreground sm:px-7 sm:py-4">
          <span className="text-xs font-medium sm:text-sm">إجمالي الأصوات</span>
          <span className="font-heading text-4xl leading-none font-bold tabular-nums sm:text-6xl">
            {numberFormat.format(totalVotes)}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-8">
        {projects.length === 0 ? (
          <p className="py-10 text-center text-base font-medium">
            {campaign ? "لم تُسجَّل أي أصوات بعد." : "لا توجد حملة تصويت حالياً."}
          </p>
        ) : (
          <ol className="flex flex-col gap-4 sm:gap-5">
            {projects.map((project, index) => (
              <motion.li
                key={project.projectId}
                layout="position"
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 sm:gap-x-4"
              >
                <span className="row-span-2 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground tabular-nums sm:size-10 sm:text-lg">
                  {index + 1}
                </span>
                <div className="flex items-baseline justify-between gap-3">
                  <span dir="auto" className="line-clamp-1 text-sm font-semibold sm:text-lg">
                    {project.title}
                  </span>
                  <span className="shrink-0 text-base font-bold tabular-nums sm:text-xl">
                    {numberFormat.format(project.votes)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted sm:h-4">
                  <motion.div
                    className="h-full min-w-1 rounded-full bg-primary"
                    initial={false}
                    animate={{ width: `${maxVotes > 0 ? (project.votes / maxVotes) * 100 : 0}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 24 }}
                  />
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function LiveStatus({ isActive, isStale }: { isActive: boolean; isStale: boolean }) {
  const pill = "rounded-full px-3 py-1 text-xs font-bold sm:text-sm"

  if (isStale) {
    return <span className={`${pill} bg-muted text-foreground`}>انقطع الاتصال، جارٍ إعادة المحاولة…</span>
  }

  if (!isActive) {
    return <span className={`${pill} bg-muted text-foreground`}>انتهى التصويت · النتائج النهائية</span>
  }

  return (
    <span className={`${pill} flex items-center gap-2 bg-red-600 text-white`}>
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-white" />
      </span>
      مباشر
    </span>
  )
}
