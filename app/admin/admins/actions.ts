"use server"

import { checkRole } from "@/lib/roles"
import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Roles } from "@/types/globals"

export async function setRole(formData: FormData) {
  if (!(await checkRole("admin"))) {
    redirect("/not-authorized")
  }

  const userId = formData.get("id") as string
  const role = formData.get("role") as Roles

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  await client.users.updateUserMetadata(userId, {
    publicMetadata: { ...user.publicMetadata, role },
  })

  revalidatePath("/admin/admins")
}

export async function removeRole(formData: FormData) {
  if (!(await checkRole("admin"))) {
    redirect("/not-authorized")
  }

  const userId = formData.get("id") as string

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  await client.users.updateUserMetadata(userId, {
    publicMetadata: { ...user.publicMetadata, role: null },
  })

  revalidatePath("/admin/admins")
}
