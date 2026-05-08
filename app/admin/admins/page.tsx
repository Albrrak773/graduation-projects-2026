import { clerkClient } from "@clerk/nextjs/server"
import { AdminsTable } from "./admins-table"

export default async function AdminsPage() {
  const client = await clerkClient()
  const allUsers = await client.users.getUserList({ limit: 500 })

  const admins = allUsers.data
    .filter((user) => {
      const role = user.publicMetadata.role as string | undefined
      return role === "admin" || role === "project_owner"
    })
    .map((user) => ({
      id: user.id,
      email: user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? "",
      role: user.publicMetadata.role as string | undefined,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">المشرفين</h1>
        <p className="mt-1 text-sm text-muted-foreground">إدارة المشرفين وأصحاب المشاريع</p>
      </div>
      {admins.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">لا يوجد مشرفين حالياً</p>
        </div>
      ) : (
        <AdminsTable data={admins} />
      )}
    </div>
  )
}
