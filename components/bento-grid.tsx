"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { COLLEDGE_LABELS } from "@/db/enums"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

export function BentoGrid({
  totalCount,
  counts,
  featuredImages,
}: {
  totalCount: number
  counts: { college: string; count: number }[]
  featuredImages: { id: string; title: string; image_url: string | null }[]
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  }

  return (
    <section className="relative overflow-hidden bg-background px-6 py-20 md:px-12 md:py-32">
      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 gap-6 md:grid-cols-12"
        >
          {/* Main Stat Card */}
          <motion.div
            variants={itemVariants}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#163a76] p-8 text-white shadow-xl md:col-span-8 md:p-12"
          >
            {/* Supergraphic Ribbon */}
            <div className="pointer-events-none absolute -bottom-1/2 -left-1/4 h-[150%] w-[150%]">
              <Image
                src="/design/Asset 5@4x.png"
                alt="Pattern"
                fill
                className="object-cover object-left-bottom opacity-40 mix-blend-screen md:object-contain"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>

            <div className="relative z-10 flex h-full min-h-[14rem] w-full flex-col justify-between">
              <div className="flex w-full justify-start">
                <div className="max-w-md text-start">
                  <h2 className="mb-4 font-heading text-4xl font-bold text-white drop-shadow-sm md:text-[3.5rem]">
                    مشاريع التخرج 2026
                  </h2>
                  <p className="font-sans text-lg leading-relaxed text-white/90 drop-shadow-sm md:text-xl">
                    <span className="ml-1 text-2xl font-bold text-[#0097a7]" dir="ltr">
                      {totalCount}+
                    </span>{" "}
                    مشروع تخرج من مختلف التخصصات
                  </p>
                </div>
              </div>

              <div className="mt-12 flex w-full justify-end">
                <Link href="/projects">
                  <Button
                    size="lg"
                    className="h-14 gap-3 rounded-full bg-white px-8 text-base font-bold text-[#163a76] shadow-md transition-transform hover:scale-105 hover:bg-white/90"
                  >
                    تصفح جميع المشاريع
                    <IconArrowLeft className="size-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Featured Image Grid */}
          <motion.div
            variants={itemVariants}
            className="overflow-hidden rounded-3xl border border-border/50 bg-muted/20 p-4 shadow-sm md:col-span-4"
          >
            <div className="flex h-full snap-x snap-mandatory items-center gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featuredImages.map((img, i) => (
                <div
                  key={img.id || i}
                  className="relative aspect-[9/16] w-40 shrink-0 snap-center overflow-hidden rounded-2xl border border-border/40 shadow-md md:w-48"
                >
                  {img.image_url ? (
                    <Image
                      src={img.image_url}
                      alt={img.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10">
                      <span className="font-bold text-primary/30">بدون صورة</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* College Stats */}
          {counts.slice(0, 3).map((count, idx) => (
            <motion.div
              key={count.college}
              variants={itemVariants}
              className="flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-white p-8 text-center shadow-sm transition-all hover:shadow-md md:col-span-4"
            >
              <div className="mb-3 text-4xl font-bold text-brand-teal md:text-5xl">{count.count}</div>
              <div className="font-heading text-lg text-foreground/80 md:text-xl">
                {COLLEDGE_LABELS[count.college as keyof typeof COLLEDGE_LABELS]}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
