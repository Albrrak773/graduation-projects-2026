"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { config } from "@/lib/config"
import { projectsTable, projectParticipantsTable } from "@/db/schema"
import { projectEditSchema, type ProjectEditFormData } from "@/lib/project-edit-schema"

export async function updateProject(signature: string, formData: ProjectEditFormData) {
  const parsed = projectEditSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: "بيانات غير صالحة", issues: parsed.error.issues }
  }

  const data = parsed.data

  const project = await config.db.query.projectsTable.findFirst({
    where: eq(projectsTable.signature, signature),
  })

  if (!project) {
    return { error: "المشروع غير موجود" }
  }

  try {
    await config.db
      .update(projectsTable)
      .set({
        title: data.title,
        supervisor: data.supervisor,
        discription: data.discription || null,
        project_external_link: data.project_external_link || null,
      })
      .where(eq(projectsTable.id, project.id))

    await config.db.delete(projectParticipantsTable).where(eq(projectParticipantsTable.project_id, project.id))

    if (data.members.length > 0) {
      await config.db.insert(projectParticipantsTable).values(
        data.members.map((member) => ({
          project_id: project.id,
          name: member.name,
          uni_id: member.uni_id,
          x_url: member.x_url || null,
          linked_url: member.linked_url || null,
          github_url: member.github_url || null,
          personal_email: member.personal_email || null,
        }))
      )
    }

    revalidatePath(`/projects/${project.id}`)
    revalidatePath(`/projects/edit/${signature}`)
    revalidatePath("/projects")

    return { success: true }
  } catch (error) {
    console.error("Failed to update project:", error)
    return { error: "فشل في تحديث المشروع" }
  }
}
