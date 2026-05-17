"use server"

import { config } from "@/lib/config"
import { projectsTable } from "@/db/schema"
import { eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/auth"
import { randomUUID } from "crypto"

function generateSignature(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12)
}

export async function seedEmptySignatures() {
  if (!(await verifySession())) return { error: "غير مصرح" }

  try {
    const projects = await config.db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(isNull(projectsTable.signature))

    if (projects.length === 0) return { success: true, count: 0 }

    for (const project of projects) {
      const sig = generateSignature()
      await config.db.update(projectsTable).set({ signature: sig }).where(eq(projectsTable.id, project.id))
    }

    revalidatePath("/admin/projects")
    return { success: true, count: projects.length }
  } catch (error) {
    console.error("Failed to seed empty signatures:", error)
    return { error: "فشل في تعبئة التواقيع الفارغة" }
  }
}

export async function rotateAllSignatures() {
  if (!(await verifySession())) return { error: "غير مصرح" }

  try {
    const projects = await config.db.select({ id: projectsTable.id }).from(projectsTable)

    if (projects.length === 0) return { success: true, count: 0 }

    for (const project of projects) {
      const sig = generateSignature()
      await config.db.update(projectsTable).set({ signature: sig }).where(eq(projectsTable.id, project.id))
    }

    revalidatePath("/admin/projects")
    revalidatePath("/projects/edit/[signature]")
    return { success: true, count: projects.length }
  } catch (error) {
    console.error("Failed to rotate signatures:", error)
    return { error: "فشل في تدوير التواقيع" }
  }
}
