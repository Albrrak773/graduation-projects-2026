import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <div className="flex justify-center px-6 pt-6 md:pt-10">
          <Link href="/" aria-label="الرئيسية">
            <Image
              src="/design/logo.png"
              alt="مشاريع التخرج"
              className="h-20 w-auto md:h-24"
              width={480}
              height={200}
              priority
            />
          </Link>
        </div>
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
