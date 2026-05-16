"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { IconChevronLeft, IconHome, IconSearch } from "@tabler/icons-react"

export function NavBar({
  projectTitle,
  showSearch = true,
  hideOnScroll = false,
}: {
  projectTitle?: string
  showSearch?: boolean
  hideOnScroll?: boolean
}) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!hideOnScroll) return

    function onScroll() {
      setHidden(window.scrollY > 180)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [hideOnScroll])

  if (projectTitle) {
    return (
      <div className="flex h-20 justify-center px-4 sm:px-6 md:h-24 md:px-12">
        <nav
          aria-label="ط§ظ„طھظ†ظ‚ظ„"
          dir="ltr"
          className={`fixed z-30 flex w-[min(calc(100%-2rem),31rem)] items-center justify-between gap-4 rounded-full border border-white/20 px-4 py-2.5 text-white shadow-2xl shadow-black/15 backdrop-blur-xl transition-all duration-300 ${
            hidden ? "pointer-events-none -translate-y-5 opacity-0" : "translate-y-0 opacity-100"
          }`}
          style={{
            backgroundColor: "rgba(13, 43, 107, 0.88)",
            top: "calc(var(--notification-bar-height, 0px) + 1rem)",
          }}
        >
          <Link
            href="/"
            aria-label="ط§ظ„ط±ط¦ظٹط³ظٹط©"
            className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
          >
            <IconHome className="size-5" />
          </Link>
          {showSearch && (
            <Link
              href="/projects"
              aria-label="ط§ظ„ط¨ط­ط«"
              className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <IconSearch className="size-5" />
            </Link>
          )}
        </nav>
      </div>
    )
  }

  return (
    <div className="flex h-20 justify-center px-4 sm:px-6 md:h-24 md:px-12">
      <nav
        aria-label="التنقل"
        className={`fixed z-30 flex w-[min(calc(100%-2rem),31rem)] items-center justify-between gap-4 rounded-full border border-white/20 px-4 py-2.5 text-white shadow-2xl shadow-black/15 backdrop-blur-xl transition-all duration-300 ${
          hidden ? "pointer-events-none -translate-y-5 opacity-0" : "translate-y-0 opacity-100"
        }`}
        style={{
          backgroundColor: "rgba(13, 43, 107, 0.88)",
          top: "calc(var(--notification-bar-height, 0px) + 1rem)",
        }}
      >
        <Link href="/" aria-label="الرئيسية" className="shrink-0">
          <Image
            src="/design/logo white@4x.png"
            alt="مشاريع التخرج"
            className="h-9 w-auto"
            width={210}
            height={80}
            priority
          />
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-1.5 text-xs font-bold text-white/85 md:text-sm">
          <Link
            href="/"
            aria-label="الرئيسية"
            className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
          >
            <IconHome className="size-5" />
          </Link>
          {showSearch && (
            <Link
              href="/projects"
              aria-label="البحث"
              className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <IconSearch className="size-5" />
            </Link>
          )}
          {projectTitle && (
            <>
              <IconChevronLeft className="size-4 shrink-0" />
              <span className="max-w-[8rem] truncate md:max-w-xs">{projectTitle}</span>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}
