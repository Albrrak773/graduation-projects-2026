import { eq } from "drizzle-orm"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"
import { config } from "@/lib/config"
import { projectsTable } from "@/db/schema"
import { getR2Client, getR2PublicUrl, deleteR2Object } from "@/lib/r2"
import { processOriginalAvif, processThumbnailAvif } from "@/lib/image-processing"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "معرف المشروع مطلوب" }, { status: 400 })
    }

    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم. الأنواع المدعومة: JPEG, PNG" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      )
    }

    const project = await config.db.query.projectsTable.findFirst({
      where: eq(projectsTable.id, projectId),
    })
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 })
    }

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

    return NextResponse.json({ success: true, imageUrl, thumbUrl })
  } catch (error) {
    console.error("Failed to upload project image:", error)
    return NextResponse.json({ error: "فشل في رفع الصورة" }, { status: 500 })
  }
}
