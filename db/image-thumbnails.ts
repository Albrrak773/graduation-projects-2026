import { PutObjectCommand } from "@aws-sdk/client-s3"
import { config } from "../lib/config.js"
import { createProjectThumbnail } from "../lib/image-processing.js"
import { getR2Client } from "../lib/r2.js"

export { createProjectThumbnail } from "../lib/image-processing.js"
export { getR2Client } from "../lib/r2.js"

export async function uploadProjectThumbnail(projectId: string, input: Buffer): Promise<string> {
  const s3 = getR2Client()
  const thumbnail = await createProjectThumbnail(input)
  const key = `${config.projectThumbnailsKey}/${projectId}.avif`

  await s3.send(
    new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: thumbnail,
      ContentType: "image/avif",
      CacheControl: "public, max-age=31536000, immutable",
    })
  )

  return `${config.r2.publicUrl}/${key}`
}
