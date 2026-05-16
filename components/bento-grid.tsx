"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { IconChartBar } from "@tabler/icons-react"
import { COLLEDGE_LABELS } from "@/db/enums"

const ease = [0.22, 1, 0.36, 1] as const

export function BentoGrid({
  totalCount,
  previousCount,
  counts,
}: {
  totalCount: number
  previousCount: number
  counts: { college: string; count: number }[]
}) {
  const currentCount = Math.max(totalCount - previousCount, 0)

  return (
    <section className="relative overflow-hidden px-4 py-12 sm:px-6 md:px-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease }}
        className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="brand-sheen relative overflow-hidden rounded-3xl bg-[#12326f] p-6 text-white shadow-2xl shadow-[#0d2b6b]/20 md:p-10">
          <Image
            src="/design/Asset 5@4x.png"
            alt=""
            fill
            aria-hidden
            className="pointer-events-none object-cover object-left-bottom opacity-35 mix-blend-screen"
            sizes="(max-width: 768px) 100vw, 60vw"
          />
          <div className="relative z-10 flex min-h-64 flex-col justify-between gap-10">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white/82">
                <IconChartBar className="size-4" />
                أرقام المعرض
              </span>
              <h2 className="max-w-xl font-heading text-3xl leading-tight font-black text-balance md:text-5xl">
                أرقام تفخر بها كلية الحاسب
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatBox value={`${totalCount}+`} label="مشروع منشور" />
              <StatBox value={`${currentCount}+`} label="مشاريع هذا العام" />
              <StatBox value={`${counts.length}`} label="تخصصات رئيسية" />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-8 rounded-3xl border border-white/50 bg-white/46 p-6 text-center shadow-[0_24px_80px_rgba(13,43,107,0.08)] backdrop-blur-xl md:p-8">
          <div>
            <p className="text-sm font-bold text-brand-teal">التخصصات</p>
            <h3 className="mt-2 font-heading text-3xl leading-tight font-black text-foreground md:text-4xl">
              أرقام المشاريع لكل تخصص
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            {counts.slice(0, 3).map((count) => (
              <div key={count.college} className="text-center">
                <AnimatedNumber value={count.count} />
                <div className="mt-1 font-heading text-base font-bold text-muted-foreground">
                  {COLLEDGE_LABELS[count.college as keyof typeof COLLEDGE_LABELS]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function AnimatedNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (value <= 0) {
      return
    }

    let frame = 0
    const totalFrames = 42
    const timer = window.setInterval(() => {
      frame += 1
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3)
      setCount(Math.round(value * progress))

      if (frame >= totalFrames) {
        window.clearInterval(timer)
        setCount(value)
      }
    }, 24)

    return () => window.clearInterval(timer)
  }, [value])

  return <div className="font-heading text-5xl font-black text-brand-darkblue tabular-nums md:text-6xl">{count}</div>
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur">
      <div className="text-3xl font-black tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-bold text-white/72">{label}</div>
    </div>
  )
}
