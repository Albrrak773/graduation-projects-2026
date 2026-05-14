"use client"

import Image from "next/image"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-brand-darkblue px-6 py-20 lg:min-h-screen">
      {/* Premium Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b6b] via-[#08527a] to-[#0097a7] opacity-95" />

      {/* Subtle Background Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay">
        <Image src="/design/pattern-1-hires.png" alt="Pattern" fill className="object-cover" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center">
        <div className="flex w-full justify-center">
          <Link href="/" className="block w-full max-w-[320px] sm:max-w-lg md:max-w-3xl">
            <Image
              src="/design/logo white@4x.png"
              alt="حفل ختام الأنشطة ومعرض مشاريع التخرج"
              width={1200}
              height={600}
              className="h-auto w-full drop-shadow-2xl"
              priority
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
