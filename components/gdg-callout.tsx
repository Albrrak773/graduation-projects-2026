import Image from "next/image"
import Link from "next/link"
import { IconExternalLink } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function GDGCallout() {
  return (
    <section className="px-4 py-12 sm:px-6 md:px-12 md:py-20">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#4285F4_0%,#34A853_48%,#FBBC04_78%,#EA4335_100%)] p-[1px] shadow-2xl shadow-[#4285F4]/20">
        <div className="relative overflow-hidden rounded-[calc(var(--radius-3xl)-1px)] bg-[linear-gradient(135deg,rgba(26,115,232,0.96)_0%,rgba(66,133,244,0.92)_34%,rgba(52,168,83,0.9)_62%,rgba(251,188,4,0.92)_100%)] px-6 py-9 text-white md:px-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.18)_32%,transparent_54%),linear-gradient(35deg,rgba(234,67,53,0.46)_0%,transparent_28%),linear-gradient(215deg,transparent_52%,rgba(15,80,48,0.34)_100%)]"
          />
          <Image
            src="/design/pattern-1-hires.png"
            alt=""
            fill
            aria-hidden
            className="pointer-events-none object-cover opacity-[0.08] mix-blend-screen"
            sizes="100vw"
          />
          <div className="relative z-10 flex flex-col items-center justify-between gap-6 text-center md:flex-row md:gap-8 md:text-start">
            <div className="flex items-center gap-6">
              <div className="hidden h-20 w-20 shrink-0 sm:block md:h-24 md:w-24">
                <Image
                  src="/design/gdg.png"
                  alt="GDG Logo"
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="max-w-3xl space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/16 px-3 py-1 text-xs font-black text-white">
                  Google Developer Group - Qassim
                </span>
                <h2 className="font-heading text-2xl leading-tight font-black md:text-4xl">
                  تبي تشوف مين اعلى نقاط؟ 👀
                </h2>
                <p className="text-sm leading-relaxed text-white/80 sm:text-base">
                  استكشف من أعلى الطلاب مشاركة ونقاطاً بمجموعة قوقل للطلبة المطورين
                </p>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shrink-0 rounded-full bg-white px-7 font-bold text-[#1A73E8] hover:bg-white/90"
            >
              <Link href="https://gdg-q.com" target="_blank" rel="noopener noreferrer">
                اكتشف لوحة الصدارة
                <IconExternalLink className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
