import sharp from "sharp"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { config } from "../lib/config.js"

const THUMBNAIL_WIDTH = 640
const THUMBNAIL_QUALITY = 65

export function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  })
}

export async function createProjectThumbnail(input: Buffer): Promise<Buffer> {
  return sharp(input, { animated: false })
    .rotate()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMBNAIL_QUALITY, effort: 5 })
    .toBuffer()
}

export async function uploadProjectThumbnail(s3: S3Client, projectId: string, input: Buffer): Promise<string> {
  const thumbnail = await createProjectThumbnail(input)
  const key = `${config.projectThumbnailsKey}/${projectId}.webp`

  await s3.send(
    new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: thumbnail,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  )

  return `${config.r2.publicUrl}/${key}`
}
