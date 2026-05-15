import type { Metadata } from "next"
import localFont from "next/font/local"
import { Suspense } from "react"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { DirectionProvider } from "@/components/ui/direction"
import { NotificationProvider } from "@/components/notification-provider"
import { NotificationBannerSlot } from "@/components/notification-banner-slot"
import { NotificationModal } from "@/components/notification-modal"
import { PageIntro } from "@/components/page-intro"

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

export const metadata: Metadata = {}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cn("font-sans antialiased", fontSans.variable, fontHeading.variable, fontSerif.variable)}
    >
      <body>
        <PageIntro />
        <Suspense>
          <ClerkProvider appearance={{ theme: shadcn }} signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
            <DirectionProvider direction="rtl">
              <ThemeProvider>
                <NuqsAdapter>
                  <NotificationProvider>
                    <NotificationBannerSlot />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
                      style={{
                        backgroundImage: "url('/design/pattern-2.png')",
                        backgroundSize: "300px",
                        backgroundRepeat: "repeat",
                      }}
                    />
                    <div className="relative z-10">{children}</div>
                    <Suspense>
                      <NotificationModal />
                    </Suspense>
                  </NotificationProvider>
                </NuqsAdapter>
              </ThemeProvider>
            </DirectionProvider>
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  )
}
