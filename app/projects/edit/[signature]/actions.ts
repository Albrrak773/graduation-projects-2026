"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { config } from "@/lib/config"
import { projectsTable, projectParticipantsTable } from "@/db/schema"
import { projectEditSchema, type ProjectEditFormData } from "@/lib/project-edit-schema"
import { getR2Client, getR2PublicUrl, deleteR2Object } from "@/lib/r2"
import { processOriginalAvif, processThumbnailAvif } from "@/lib/image-processing"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

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

export async function uploadProjectImage(projectId: string, formData: FormData) {
  const file = formData.get("file") as File | null
  if (!file) return { error: "لم يتم اختيار ملف" }

  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return { error: "نوع الملف غير مدعوم. الأنواع المدعومة: JPEG, PNG" }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: `حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE / 1024 / 1024}MB)` }
  }

  const project = await config.db.query.projectsTable.findFirst({
    where: eq(projectsTable.id, projectId),
  })
  if (!project) return { error: "المشروع غير موجود" }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)

    const [originalAvif, thumbnailAvif] = await Promise.all([
      processOriginalAvif(originalBuffer),
      processThumbnailAvif(originalBuffer),
    ])

    const originalKey = `${config.projectImagesKey}/${projectId}.avif`
    const thumbnailKey = `${config.projectThumbnailsKey}/${projectId}.avif`

    const s3 = getR2Client()

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: config.r2.bucketName,
          Key: originalKey,
          Body: originalAvif,
          ContentType: "image/avif",
          CacheControl: "public, max-age=31536000, immutable",
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: config.r2.bucketName,
          Key: thumbnailKey,
          Body: thumbnailAvif,
          ContentType: "image/avif",
          CacheControl: "public, max-age=31536000, immutable",
        })
      ),
    ])

    if (project.image_url) {
      const oldOriginalKey = project.image_url.replace(`${config.r2.publicUrl}/`, "")
      if (oldOriginalKey !== originalKey) {
        await deleteR2Object(oldOriginalKey).catch((err) => console.error("Failed to delete old original:", err))
      }
    }
    if (project.image_thumb_url) {
      const oldThumbKey = project.image_thumb_url.replace(`${config.r2.publicUrl}/`, "")
      if (oldThumbKey !== thumbnailKey) {
        await deleteR2Object(oldThumbKey).catch((err) => console.error("Failed to delete old thumbnail:", err))
      }
    }

    const imageUrl = getR2PublicUrl(originalKey)
    const thumbUrl = getR2PublicUrl(thumbnailKey)

    await config.db
      .update(projectsTable)
      .set({ image_url: imageUrl, image_thumb_url: thumbUrl })
      .where(eq(projectsTable.id, projectId))

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/edit/${project.signature}`)
    revalidatePath("/projects")

    return { success: true, imageUrl, thumbUrl }
  } catch (error) {
    console.error("Failed to upload project image:", error)
    return { error: "فشل في رفع الصورة" }
  }
}
