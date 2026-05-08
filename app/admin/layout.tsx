import { Suspense } from "react"
import { AdminSidebar } from "./admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/40" />}>
      <AdminSidebar>{children}</AdminSidebar>
    </Suspense>
  )
}
