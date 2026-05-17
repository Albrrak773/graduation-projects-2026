import { config } from "@/lib/config"
import { adminsTable } from "@/db/schema"
import { desc } from "drizzle-orm"
import { AdminsTable } from "./admins-table"

export default async function AdminsPage() {
  const admins = await config.db.select().from(adminsTable).orderBy(desc(adminsTable.createdAt))

  if (admins.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">المشرفين</h1>
          <p className="mt-1 text-sm text-muted-foreground">إدارة المشرفين</p>
        </div>
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">لا يوجد مشرفين حالياً</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">المشرفين</h1>
        <p className="mt-1 text-sm text-muted-foreground">إدارة المشرفين</p>
      </div>
      <AdminsTable data={admins} />
    </div>
  )
}
