import Link from "next/link"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <Hero />
        <div className="flex flex-col items-center gap-6 px-6 py-16 text-center md:gap-8 md:py-24">
          <h1 className="text-6xl md:text-8xl">🫤</h1>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">!الصفحة غير موجودة</h2>
          <Button asChild variant="default" className="h-11 px-8 text-base md:h-12 md:text-lg">
            <Link href="/">العودة للرئيسية</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
