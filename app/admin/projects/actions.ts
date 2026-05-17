"use server"

import { randomUUID } from "crypto"
import { eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { config } from "@/lib/config"
import { projectsTable } from "@/db/schema"
import { verifySession } from "@/lib/auth"
import { getPresignedUploadUrl, deleteR2Object, getR2PublicUrl, getR2Client } from "@/lib/r2"
import { processOriginalAvif, processThumbnailAvif } from "@/lib/image-processing"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function seedEmptySignatures() {
  if (!(await verifySession())) return { error: "غير مصرح" }

  try {
    const projects = await config.db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(isNull(projectsTable.signature))

    if (projects.length === 0) return { success: true, count: 0 }

    for (const project of projects) {
      const sig = randomUUID().replace(/-/g, "").slice(0, 12)
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
      const sig = randomUUID().replace(/-/g, "").slice(0, 12)
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

export async function requestProjectImageUpload(projectId: string, contentType: string) {
  const session = await verifySession()
  if (!session) return { error: "غير مصرح" }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return { error: "نوع الملف غير مدعوم. الأنواع المدعومة: JPEG, PNG, WebP" }
  }

  const project = await config.db.query.projectsTable.findFirst({
    where: eq(projectsTable.id, projectId),
  })
  if (!project) return { error: "المشروع غير موجود" }

  const ext = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : "webp"
  const tempKey = `uploads/${projectId}/${randomUUID()}.${ext}`

  const uploadUrl = await getPresignedUploadUrl(tempKey, contentType)

  return { uploadUrl, tempKey }
}

export async function processProjectImage(projectId: string, tempKey: string) {
  const session = await verifySession()
  if (!session) return { error: "غير مصرح" }

  const project = await config.db.query.projectsTable.findFirst({
    where: eq(projectsTable.id, projectId),
  })
  if (!project) return { error: "المشروع غير موجود" }

  try {
    const s3 = getR2Client()
    const { GetObjectCommand } = await import("@aws-sdk/client-s3")

    const getResponse = await s3.send(
      new GetObjectCommand({
        Bucket: config.r2.bucketName,
        Key: tempKey,
      })
    )

    if (!getResponse.Body) {
      return { error: "فشل في قراءة الملف المرفوع" }
    }

    const originalBuffer = Buffer.from(await getResponse.Body.transformToByteArray())

    if (originalBuffer.length > MAX_FILE_SIZE) {
      await deleteR2Object(tempKey)
      return { error: `حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE / 1024 / 1024}MB)` }
    }

    const [originalAvif, thumbnailAvif] = await Promise.all([
      processOriginalAvif(originalBuffer),
      processThumbnailAvif(originalBuffer),
    ])

    const originalKey = `${config.projectImagesKey}/${projectId}.avif`
    const thumbnailKey = `${config.projectThumbnailsKey}/${projectId}.avif`

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

    await deleteR2Object(tempKey).catch((err) => console.error("Failed to delete temp upload:", err))

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

    revalidatePath("/admin/projects")
    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/edit/${project.signature}`)
    revalidatePath("/projects")

    return { success: true, imageUrl: imageUrl, thumbUrl: thumbUrl }
  } catch (error) {
    console.error("Failed to process project image:", error)
    await deleteR2Object(tempKey).catch(() => {})
    return { error: "فشل في معالجة الصورة" }
  }
}
