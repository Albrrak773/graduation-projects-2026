import sharp from "sharp"

const ORIGINAL_MAX_WIDTH = 2000
const THUMBNAIL_MAX_WIDTH = 640

const ORIGINAL_AVIF_OPTIONS: sharp.AvifOptions = { quality: 65, effort: 4 }
const THUMBNAIL_AVIF_OPTIONS: sharp.AvifOptions = { quality: 60, effort: 4 }

export async function processOriginalAvif(input: Buffer): Promise<Buffer> {
  return sharp(input, { animated: false })
    .rotate()
    .resize({ width: ORIGINAL_MAX_WIDTH, withoutEnlargement: true })
    .avif(ORIGINAL_AVIF_OPTIONS)
    .toBuffer()
}

export async function processThumbnailAvif(input: Buffer): Promise<Buffer> {
  return sharp(input, { animated: false })
    .rotate()
    .resize({ width: THUMBNAIL_MAX_WIDTH, withoutEnlargement: true })
    .avif(THUMBNAIL_AVIF_OPTIONS)
    .toBuffer()
}

export async function createProjectThumbnail(input: Buffer): Promise<Buffer> {
  return processThumbnailAvif(input)
}
