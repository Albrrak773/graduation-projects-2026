"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { IconSearch } from "@tabler/icons-react"
import { YEAR_MAP, CURRENT_YEAR } from "@/lib/years"

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  return (
    <section className="relative flex min-h-[70svh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-10 sm:px-6 md:min-h-[72vh] md:pt-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(66,133,244,0.32),transparent_26rem),linear-gradient(135deg,#0d2b6b_0%,#0b4778_48%,#0097a7_100%)]" />
      <Image
        src="/design/pattern-1-hires.png"
        alt=""
        fill
        priority
        aria-hidden
        className="pointer-events-none object-cover opacity-[0.055] mix-blend-screen"
      />
      <Image
        src="/design/Asset 5@4x.png"
        alt=""
        width={1100}
        height={800}
        aria-hidden
        className="float-soft pointer-events-none absolute -bottom-40 -left-32 w-[48rem] max-w-none opacity-30 mix-blend-screen"
      />

      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="fixed z-30 w-[min(calc(100%-2rem),31rem)] rounded-full border border-white/20 px-4 py-2.5 text-white shadow-2xl shadow-black/15 backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(13, 43, 107, 0.88)",
          top: "calc(var(--notification-bar-height, 0px) + 1rem)",
        }}
        aria-label="التنقل الرئيسي"
      >
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="الرئيسية" className="shrink-0">
            <Image
              src="/design/logo white@4x.png"
              alt="مشاريع التخرج"
              width={210}
              height={80}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/projects?semester=${YEAR_MAP[CURRENT_YEAR]}`}
              aria-label="البحث في المشاريع"
              className="grid size-10 place-items-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <IconSearch className="size-5" />
            </Link>
          </div>
        </div>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.1 }}
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center"
      >
        <Link href="/" className="block w-full max-w-[22rem] sm:max-w-[34rem] md:max-w-[48rem]">
          <Image
            src="/design/logo white@4x.png"
            alt="حفل ختام الأنشطة ومعرض مشاريع التخرج"
            width={1200}
            height={600}
            className="h-auto w-full drop-shadow-2xl"
            priority
          />
        </Link>
      </motion.div>
    </section>
  )
}
