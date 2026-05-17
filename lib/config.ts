import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "@/db/schema"

function assertEnv<T extends string>(key: string, value: T | undefined): T {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const globalForPg = globalThis as unknown as { pgPool: pg.Pool | undefined }

export const pool =
  globalForPg.pgPool ??
  new pg.Pool({
    connectionString: assertEnv("DATABASE_URL", process.env.DATABASE_URL),
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  })

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool

export { CURRENT_YEAR, YEAR_MAP, toHijri } from "@/lib/years"

export const config = {
  db: drizzle(pool, { schema }),
  projectImagesKey: "project-images",
  projectThumbnailsKey: "project-thumbnails",
  votes: {
    maxPerUser: (() => {
      const value = Number(process.env.VOTES_MAX_PER_USER)
      return Number.isFinite(value) ? value : Infinity
    })(),
  },
  r2: {
    accessKeyId: assertEnv("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: assertEnv("R2_SECRET_ACCESS_KEY", process.env.R2_SECRET_ACCESS_KEY),
    accountId: assertEnv("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID),
    bucketName: assertEnv("R2_BUCKET_NAME", process.env.R2_BUCKET_NAME),
    publicUrl: assertEnv("R2_PUBLIC_URL", process.env.R2_PUBLIC_URL),
  },
}
