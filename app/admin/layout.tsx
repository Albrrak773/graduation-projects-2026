import { Suspense } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import { AdminSidebar } from "./admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }} signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
      <Suspense fallback={<div className="min-h-screen bg-muted/40" />}>
        <AdminSidebar>{children}</AdminSidebar>
      </Suspense>
    </ClerkProvider>
  )
}
