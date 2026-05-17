// run with infisical run --env=dev -- pnpm tsx db/backfill-project-thumbnails.ts
import "dotenv/config"
import { and, eq, isNotNull, isNull } from "drizzle-orm"
import { projectsTable } from "./schema.js"
import { config } from "../lib/config.js"
import { uploadProjectThumbnail } from "./image-thumbnails.js"

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`Skipping ${url}: ${response.status}`)
      return null
    }

    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.warn(`Could not download ${url}:`, error)
    return null
  }
}

async function main() {
  const db = config.db

  const projects = await db
    .select({ id: projectsTable.id, image_url: projectsTable.image_url })
    .from(projectsTable)
    .where(and(isNotNull(projectsTable.image_url), isNull(projectsTable.image_thumb_url)))

  console.log(`Found ${projects.length} project image(s) without thumbnails`)

  let updated = 0
  let failed = 0

  for (const project of projects) {
    if (!project.image_url) continue

    const input = await downloadImage(project.image_url)
    if (!input) {
      failed++
      continue
    }

    try {
      const thumbnailUrl = await uploadProjectThumbnail(project.id, input)
      await db.update(projectsTable).set({ image_thumb_url: thumbnailUrl }).where(eq(projectsTable.id, project.id))
      updated++
      console.log(`Updated ${updated}/${projects.length}: ${project.id}`)
    } catch (error) {
      failed++
      console.warn(`Could not create thumbnail for ${project.id}:`, error)
    }
  }

  console.log(`Done. Updated: ${updated}, failed: ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error("Thumbnail backfill failed:", error)
  process.exit(1)
})
