"use server"

import { randomUUID } from "crypto"
import { eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { clerkClient } from "@clerk/nextjs/server"
import { config } from "@/lib/config"
import { projectsTable, tagsTable, projectParticipantsTable } from "@/db/schema"
import { verifySession } from "@/lib/auth"
import { getPresignedUploadUrl, deleteR2Object, getR2PublicUrl, getR2Client } from "@/lib/r2"
import { processOriginalAvif, processThumbnailAvif } from "@/lib/image-processing"
import { CURRENT_YEAR } from "@/lib/years"
import { COLLEDGE_VALUES, SECTION_VALUES, DEGREE_VALUES } from "@/db/enums"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

export type ClerkUserInfo = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  username: string | null
  imageUrl: string | null
  phone: string | null
  twoFactorEnabled: boolean
  banned: boolean
  locked: boolean
  passwordEnabled: boolean
  createdAt: number | null
  lastSignInAt: number | null
  lastActiveAt: number | null
  locale: string | null
  externalAccounts: {
    provider: string
    email: string | null
    firstName: string | null
    lastName: string | null
    username: string | null
    imageUrl: string | null
  }[]
}

export async function fetchClerkUsers(userIds: string[]): Promise<Record<string, ClerkUserInfo>> {
  if (!(await verifySession())) throw new Error("غير مصرح")
  if (userIds.length === 0) return {}

  const uniqueIds = [...new Set(userIds)]
  const client = await clerkClient()
  const users = await client.users.getUserList({ userId: uniqueIds, limit: uniqueIds.length })

  const map: Record<string, ClerkUserInfo> = {}
  for (const user of users.data) {
    const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
    const primaryPhone = user.phoneNumbers.find((p) => p.id === user.primaryPhoneNumberId)

    map[user.id] = {
      id: user.id,
      email: primaryEmail?.emailAddress ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      username: user.username,
      imageUrl: user.hasImage ? user.imageUrl : null,
      phone: primaryPhone?.phoneNumber ?? null,
      twoFactorEnabled: user.twoFactorEnabled,
      banned: user.banned,
      locked: user.locked,
      passwordEnabled: user.passwordEnabled,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      lastActiveAt: user.lastActiveAt,
      locale: user.locale,
      externalAccounts: user.externalAccounts.map((ea) => ({
        provider: ea.provider,
        email: ea.emailAddress || null,
        firstName: ea.firstName || null,
        lastName: ea.lastName || null,
        username: ea.username ?? null,
        imageUrl: ea.imageUrl || null,
      })),
    }
  }
  return map
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

type CreateProjectInput = {
  title: string
  discription?: string
  supervisor: string
  section: (typeof SECTION_VALUES)[number]
  colledge: (typeof COLLEDGE_VALUES)[number]
  degree?: (typeof DEGREE_VALUES)[number]
  base?: "Main" | "Unaizah" | "Ar-Rass"
  project_external_link?: string
  year?: number
  is_public?: boolean
  tags?: string[]
  participants?: {
    name: string
    uni_id: string
    x_url?: string
    linked_url?: string
    github_url?: string
    personal_email?: string
  }[]
}

export async function createProject(input: CreateProjectInput) {
  const session = await verifySession()
  if (!session) return { error: "غير مصرح" }

  if (!input.title?.trim()) return { error: "عنوان المشروع مطلوب" }
  if (!input.supervisor?.trim()) return { error: "المشرف مطلوب" }
  if (!input.section) return { error: "القسم مطلوب" }
  if (!input.colledge) return { error: "الكلية مطلوبة" }

  const base = input.base || "Main"
  const degree = input.degree || "bachelor"
  const year = input.year || CURRENT_YEAR
  const isPublic = input.is_public ?? false

  try {
    const [project] = await config.db
      .insert(projectsTable)
      .values({
        title: input.title.trim(),
        discription: input.discription?.trim() || null,
        supervisor: input.supervisor.trim(),
        section: input.section,
        colledge: input.colledge,
        degree,
        base,
        project_external_link: input.project_external_link?.trim() || null,
        year,
        is_public: isPublic,
      })
      .returning({ id: projectsTable.id })

    if (input.tags && input.tags.length > 0) {
      await config.db.insert(tagsTable).values(
        input.tags
          .filter((t) => t.trim())
          .map((name) => ({
            project_id: project.id,
            name: name.trim(),
          }))
      )
    }

    if (input.participants && input.participants.length > 0) {
      await config.db.insert(projectParticipantsTable).values(
        input.participants
          .filter((p) => p.name?.trim() && p.uni_id?.trim())
          .map((p) => ({
            project_id: project.id,
            name: p.name.trim(),
            uni_id: p.uni_id.trim(),
            x_url: p.x_url?.trim() || null,
            linked_url: p.linked_url?.trim() || null,
            github_url: p.github_url?.trim() || null,
            personal_email: p.personal_email?.trim() || null,
          }))
      )
    }

    revalidatePath("/admin/projects")
    return { success: true, id: project.id }
  } catch (error) {
    console.error("Failed to create project:", error)
    return { error: "فشل في إنشاء المشروع" }
  }
}
