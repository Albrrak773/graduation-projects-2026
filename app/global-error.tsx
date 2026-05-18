"use client"

import localFont from "next/font/local"
import Image from "next/image"
import Link from "next/link"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { DirectionProvider } from "@/components/ui/direction"
import { Button } from "@/components/ui/button"
import { AlertOctagon } from "lucide-react"

const fontSans = localFont({
  src: [
    { path: "../public/fonts/thmanyah/sans/thmanyahsans-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/thmanyah/sans/thmanyahsans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/thmanyah/sans/thmanyahsans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/thmanyah/sans/thmanyahsans-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/thmanyah/sans/thmanyahsans-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
})

const fontHeading = localFont({
  src: [
    { path: "../public/fonts/thmanyah/serif-display/thmanyahserifdisplay-Light.woff2", weight: "300", style: "normal" },
    {
      path: "../public/fonts/thmanyah/serif-display/thmanyahserifdisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/thmanyah/serif-display/thmanyahserifdisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    { path: "../public/fonts/thmanyah/serif-display/thmanyahserifdisplay-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/thmanyah/serif-display/thmanyahserifdisplay-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-heading",
  display: "swap",
  preload: true,
})

const fontSerif = localFont({
  src: [
    { path: "../public/fonts/thmanyah/serif-text/thmanyahseriftext-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/thmanyah/serif-text/thmanyahseriftext-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/thmanyah/serif-text/thmanyahseriftext-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/thmanyah/serif-text/thmanyahseriftext-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/thmanyah/serif-text/thmanyahseriftext-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-serif",
  display: "swap",
  preload: false,
})

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn("font-sans antialiased", fontSans.variable, fontHeading.variable, fontSerif.variable)}
    >
      <body>
        <DirectionProvider direction="rtl">
          <ThemeProvider>
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
                  <AlertOctagon className="h-20 w-20 text-muted-foreground md:h-28 md:w-28" />
                  <h2 className="font-heading text-3xl font-bold md:text-5xl">حصل خطأ!</h2>
                  <p className="max-w-lg text-lg text-muted-foreground md:text-xl">
                    حاول مرة ثانية وذا استمرت المشكلة{" "}
                    <a href="mailto:albrrak773@gmail.com" className="underline">
                      تواصل معنا
                    </a>{" "}
                    وبنحاول نحلها باسرع وقت ان شاء الله
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button variant="default" className="h-11 px-8 text-base md:h-12 md:text-lg" onClick={reset}>
                      حاول مرة ثانية
                    </Button>
                    <Button asChild variant="outline" className="h-11 px-8 text-base md:h-12 md:text-lg">
                      <Link href="/">العودة للرئيسية</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}
