import { Suspense } from "react"
import { verifySession } from "@/lib/auth"
import { AdminSidebar } from "./admin-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession()

  if (!session) {
    return <>{children}</>
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/40" />}>
      <AdminSidebar session={session}>{children}</AdminSidebar>
    </Suspense>
  )
}
