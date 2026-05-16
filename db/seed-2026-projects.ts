// run with infisical run --env=dev -- pnpm tsx db/seed-2026-projects.ts
import "dotenv/config"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { eq } from "drizzle-orm"
import { execFileSync } from "child_process"
import { mkdirSync, readFileSync, rmSync } from "fs"
import { randomUUID } from "crypto"
import { join, extname } from "path"
import { tmpdir } from "os"
import { projectsTable, tagsTable, projectParticipantsTable } from "./schema.js"
import { config } from "../lib/config.js"
import { createProjectThumbnail } from "./image-thumbnails.js"

type CleanProject = {
  id: number
  title: string
  description: string
  supervisor: string
  section: "male" | "female"
  campus: "Main" | "Unaizah" | "Ar-Rass"
  department: "CS" | "IT" | "COE"
  degree: "bachelor" | "master"
  tags: string[]
  poster_image: string | null
  students: { name_en: string; name_ar: string; uni_id: string }[]
}

function isValidUniId(id: string): boolean {
  if (!id) return false
  return /^\d{9}$/.test(id)
}

async function uploadImageToR2(
  s3: S3Client,
  imageBuffer: Buffer,
  key: string,
  contentType: string
): Promise<string | null> {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
      })
    )
    return `${config.r2.publicUrl}/${key}`
  } catch (err) {
    console.warn(`  ⚠ Error uploading image to R2 (key: ${key}):`, err)
    return null
  }
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  }
  return map[ext.toLowerCase()] || "application/octet-stream"
}

function convertPdfToPng(pdfPath: string): Buffer | null {
  const tmpBase = tmpdir() ?? "/tmp"
  const tmpDir = mkdirSync(join(tmpBase, `seed-convert-${Date.now()}`), { recursive: true })
  if (!tmpDir) return null
  const baseName = `poster`
  const outputPath = join(tmpDir, baseName)
  try {
    execFileSync("pdftoppm", ["-png", "-r", "200", "-singlefile", pdfPath, outputPath], {
      timeout: 30_000,
    })
    const pngPath = `${outputPath}.png`
    const buf = readFileSync(pngPath)
    return buf
  } catch (err) {
    console.warn(`  ⚠ PDF conversion failed for ${pdfPath}:`, err)
    return null
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

type PendingUpload = {
  projectId: string
  buffer: Buffer
  key: string
  contentType: string
  thumbnailBuffer: Buffer
  thumbnailKey: string
  sourceFile: string
}

async function main() {
  console.log("🌱 Seeding 2026 projects from clean.json...\n")

  const db = config.db

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  })

  const dataPath = join(process.cwd(), "public", "data", "clean.json")
  const imagesDir = join(process.cwd(), "public", "data", "images")

  console.log(`📥 Reading clean.json from ${dataPath}`)
  const projects: CleanProject[] = JSON.parse(readFileSync(dataPath, "utf-8"))
  console.log(`📋 Found ${projects.length} projects in clean.json`)

  console.log("🗑  Deleting existing 2026 projects...")
  const deleteResult = await db
    .delete(projectsTable)
    .where(eq(projectsTable.year, 2026))
    .returning({ id: projectsTable.id })
  console.log(`   Deleted ${deleteResult.length} existing 2026 project(s)`)

  let created = 0
  let skipped = 0
  const total = projects.length
  const pendingUploads: PendingUpload[] = []

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    const progress = `[${i + 1}/${total}]`
    const title = project.title?.trim()
    const supervisor = project.supervisor?.trim()

    if (!title) {
      console.log(`${progress} ⏭ Skipped (missing title, ID: ${project.id})`)
      skipped++
      continue
    }

    if (!supervisor) {
      console.log(`${progress} ⏭ Skipped (missing supervisor, title: "${title}")`)
      skipped++
      continue
    }

    console.log(`${progress} 📝 Inserting: "${title}"`)

    const projectId = randomUUID()

    let uploadExt = ""
    let uploadBuffer: Buffer | null = null
    const sourceFile = project.poster_image ?? ""

    if (project.poster_image) {
      const ext = extname(project.poster_image).toLowerCase()
      const imagePath = join(imagesDir, project.poster_image)

      if (ext === ".pptx") {
        console.log(`  ⏭ Skipping PPTX file: ${project.poster_image}`)
      } else {
        try {
          // Prefer pre-converted .png file if it exists
          if (ext !== ".png") {
            const pngPath = join(
              imagesDir,
              extname(project.poster_image).length > 0
                ? project.poster_image.replace(/\.[^.]+$/, ".png")
                : project.poster_image
            )
            try {
              uploadBuffer = readFileSync(pngPath)
              uploadExt = ".png"
              console.log(`  🖼 Using pre-converted PNG`)
            } catch {
              // No pre-converted PNG, fall back to reading the original
            }
          }

          if (!uploadBuffer) {
            if (ext === ".pdf") {
              const pngBuf = convertPdfToPng(imagePath)
              if (pngBuf) {
                uploadBuffer = pngBuf
                uploadExt = ".png"
                console.log(`  🔄 PDF converted to PNG`)
              } else {
                console.log(`  ⚠ PDF conversion failed: ${project.poster_image}`)
              }
            } else {
              uploadBuffer = readFileSync(imagePath)
              uploadExt = ext
            }
          }
        } catch (err) {
          console.warn(`  ⚠ Could not read image: ${imagePath}`, err)
        }
      }
    }

    await db.insert(projectsTable).values({
      id: projectId,
      title,
      discription: project.description ?? null,
      supervisor,
      is_public: true,
      section: project.section,
      colledge: project.department,
      degree: project.degree,
      base: project.campus,
      image_url: null,
      project_external_link: null,
      year: 2026,
    })

    if (uploadBuffer) {
      const key = `${config.projectImagesKey}/${projectId}${uploadExt}`
      const thumbnailKey = `${config.projectThumbnailsKey}/${projectId}.webp`
      const thumbnailBuffer = await createProjectThumbnail(uploadBuffer)
      pendingUploads.push({
        projectId,
        buffer: uploadBuffer,
        key,
        contentType: getContentType(uploadExt),
        thumbnailBuffer,
        thumbnailKey,
        sourceFile,
      })
    }

    const tags = (project.tags || []).map((t) => t.trim()).filter((t) => t.length > 0)
    if (tags.length > 0) {
      await db.insert(tagsTable).values(tags.map((f) => ({ project_id: projectId, name: f })))
    }

    const participants = project.students
      .filter((s) => (s.name_en?.trim() || s.name_ar?.trim()) && isValidUniId(s.uni_id))
      .map((s) => ({
        project_id: projectId,
        name: (s.name_en || s.name_ar).trim(),
        uni_id: s.uni_id,
        personal_email: null,
        x_url: null,
        linked_url: null,
        github_url: null,
      }))

    if (participants.length > 0) {
      await db.insert(projectParticipantsTable).values(participants)
    }

    created++
  }

  console.log(`\n📤 Uploading ${pendingUploads.length} images to R2...`)
  const CONCURRENCY = 10
  for (let i = 0; i < pendingUploads.length; i += CONCURRENCY) {
    const batch = pendingUploads.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map((upload) =>
        Promise.all([
          uploadImageToR2(s3, upload.buffer, upload.key, upload.contentType),
          uploadImageToR2(s3, upload.thumbnailBuffer, upload.thumbnailKey, "image/webp"),
        ]).then(([url, thumbnailUrl]) => ({
          projectId: upload.projectId,
          url,
          thumbnailUrl,
          sourceFile: upload.sourceFile,
        }))
      )
    )
    for (const { projectId, url, thumbnailUrl, sourceFile } of results) {
      if (url) {
        await db
          .update(projectsTable)
          .set({ image_url: url, image_thumb_url: thumbnailUrl })
          .where(eq(projectsTable.id, projectId))
      } else {
        console.log(`  ⚠ Upload failed for ${sourceFile}`)
      }
    }
    console.log(`  ⬆ Uploaded ${Math.min(i + CONCURRENCY, pendingUploads.length)}/${pendingUploads.length}`)
  }

  const failed = total - created - skipped
  console.log(
    `\n🏁 Done! ✅ Created: ${created}, ⏭ Skipped: ${skipped}, ❌ Failed: ${failed}, 📤 Images: ${pendingUploads.length}`
  )
  process.exit(0)
}

main().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
