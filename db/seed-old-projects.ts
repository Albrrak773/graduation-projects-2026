// run with infisical run --env=dev -- pnpm tsx db/seed-old-projects.ts
import "dotenv/config"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"
import { projectsTable, tagsTable, projectParticipantsTable } from "./schema.js"
import { config } from "../lib/config.js"

const PROJECTS_JSON_URL = "https://raw.githubusercontent.com/Albrrak773/Project-Showcase/refs/heads/main/projects.json"
const ASSETS_BASE_URL = "https://raw.githubusercontent.com/Albrrak773/Project-Showcase/main/assets"

type OldProject = {
  ID: number
  Email: string
  Name: string
  Campus: string
  Section: string
  Department: string
  "Project Title": string
  "Students Names with IDs": { name: string; id: string | null }[]
  "Supervisor Name": string
  "Full Project Description": string
  "Project Field": string[]
  "Project Poster": string
  "Additional Project Images": string | null
  "Contact Methods": { email: string; phone: string; LinkedIn: string }
}

function mapSection(section: string): "male" | "female" {
  if (section === "طلاب") return "male"
  if (section === "طالبات") return "female"
  return "male"
}

function mapCampus(campus: string): "Main" | "Unaizah" | "Ar-Rass" {
  if (campus === "المقر الرئيسي") return "Main"
  if (campus === "عنيزة") return "Unaizah"
  if (campus === "الرس") return "Ar-Rass"
  return "Main"
}

function mapDepartment(dept: string): "CS" | "IT" | "COE" {
  if (dept === "Computer Science") return "CS"
  if (dept === "Information Technology") return "IT"
  if (dept === "Computer Engineering") return "COE"
  return "CS"
}

function isValidUniId(id: string | null): boolean {
  if (id === null) return false
  return /^\d{9}$/.test(id)
}

function extractUniIdFromEmail(email: string): string | null {
  const match = email.match(/^(\d{9})@/)
  return match ? match[1] : null
}

async function downloadImage(projectId: number): Promise<Buffer | null> {
  try {
    const url = `${ASSETS_BASE_URL}/${projectId}.webp`
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`  ⚠ Could not download image for project ${projectId}: ${response.status}`)
      return null
    }
    return Buffer.from(await response.arrayBuffer())
  } catch (err) {
    console.warn(`  � Error downloading image for project ${projectId}:`, err)
    return null
  }
}

async function uploadImageToR2(s3: S3Client, imageBuffer: Buffer, key: string): Promise<string | null> {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: "image/webp",
      })
    )
    return `${config.r2.publicUrl}/${key}`
  } catch (err) {
    console.warn(`  � Error uploading image to R2 (key: ${key}):`, err)
    return null
  }
}

async function main() {
  console.log("🌱 Seeding old projects...")

  const db = config.db

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  })

  console.log("📥 Fetching projects JSON...")
  const response = await fetch(PROJECTS_JSON_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch projects JSON: ${response.status}`)
  }
  const projects: OldProject[] = await response.json()
  console.log(`📋 Found ${projects.length} projects in JSON`)

  let created = 0
  let skipped = 0

  for (const project of projects) {
    const title = project["Project Title"]?.trim()
    const supervisor = project["Supervisor Name"]?.trim()

    if (!title) {
      console.log(`\n⏭ Skipped (missing title, ID: ${project.ID})`)
      skipped++
      continue
    }

    if (!supervisor) {
      console.log(`\n⏭ Skipped (missing supervisor, title: "${title}")`)
      skipped++
      continue
    }

    console.log(`\nProcessing: "${title}"`)

    const existing = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.title, title))
      .limit(1)

    if (existing.length > 0) {
      console.log(`  ⏭ Skipped (already exists)`)
      skipped++
      continue
    }

    const projectId = randomUUID()

    let imageUrl: string | null = null
    const imageBuffer = await downloadImage(project.ID)
    if (imageBuffer) {
      const key = `${config.projectImagesKey}/${projectId}.webp`
      imageUrl = await uploadImageToR2(s3, imageBuffer, key)
      if (imageUrl) {
        console.log(`  📤 Image uploaded: ${key}`)
      }
    }

    const section = mapSection(project.Section)
    const campus = mapCampus(project.Campus)
    const college = mapDepartment(project.Department)

    await db.insert(projectsTable).values({
      id: projectId,
      title,
      discription: project["Full Project Description"] ?? null,
      supervisor,
      is_public: true,
      section,
      colledge: college,
      base: campus,
      image_url: imageUrl,
      project_external_link: null,
      year: 2025,
    })
    console.log(`  ✅ Project inserted (id: ${projectId})`)

    const fields = project["Project Field"] || []
    if (fields.length > 0) {
      await db.insert(tagsTable).values(
        fields
          .map((f) => f.trim())
          .filter((f) => f.length > 0)
          .map((f) => ({
            project_id: projectId,
            name: f,
          }))
      )
      console.log(`  🏷 ${fields.length} tag(s) inserted`)
    }

    const emailId = extractUniIdFromEmail(project.Email)
    const students = project["Students Names with IDs"] || []
    const participants = students
      .filter((s): s is typeof s & { id: string } => s.id !== null && isValidUniId(s.id))
      .filter((s) => s.name?.trim())
      .map((s) => {
        const isEmailOwner = s.id === emailId
        return {
          project_id: projectId,
          name: s.name.trim(),
          uni_id: s.id,
          email: isEmailOwner ? project.Email : null,
          x_url: null,
          linked_url: null,
          github_url: null,
        }
      })

    if (participants.length > 0) {
      await db.insert(projectParticipantsTable).values(participants)
      console.log(`  👥 ${participants.length} participant(s) inserted`)
    }

    created++
  }

  console.log(`\n🏁 Done! Created: ${created}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
