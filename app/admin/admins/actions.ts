"use server"

import { config } from "@/lib/config"
import { adminsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hashPassword } from "@/lib/auth"
import { verifySession } from "@/lib/auth"

export async function deleteAdmin(formData: FormData) {
  if (!(await verifySession())) return

  const id = formData.get("id") as string

  await config.db.delete(adminsTable).where(eq(adminsTable.id, id))

  revalidatePath("/admin/admins")
}

export async function addAdmin(formData: FormData) {
  if (!(await verifySession())) return

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) return

  const passwordHash = await hashPassword(password)

  await config.db.insert(adminsTable).values({ email: email.toLowerCase(), passwordHash }).onConflictDoNothing()

  revalidatePath("/admin/admins")
}
