import { Suspense } from "react"
import { getAllCampaigns } from "./actions"
import { AdminVotingClient } from "@/components/admin-voting-client"

export default async function AdminVotingPage() {
  const campaigns = await getAllCampaigns()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">إدارة التصويت</h1>
        <p className="mt-1 text-sm text-muted-foreground">إنشاء وإدارة حملات التصويت والاطلاع على الإحصائيات.</p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
        <AdminVotingClient initialCampaigns={campaigns} />
      </Suspense>
    </div>
  )
}
