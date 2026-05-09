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

// Initialize pool with DATABASE_URL if available
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error("[v0] DATABASE_URL is not set")
}

export const pool =
  globalForPg.pgPool ??
  new pg.Pool({
    connectionString: assertEnv("DATABASE_URL", databaseUrl),
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  })

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool

// Safely get R2 config with fallbacks
const r2Config = {
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  accountId: process.env.R2_ACCOUNT_ID || "",
  bucketName: process.env.R2_BUCKET_NAME || "",
  publicUrl: process.env.R2_PUBLIC_URL || "",
}

export const config = {
  db: drizzle(pool, { schema }),
  projectImagesKey: "project-images",
  r2: r2Config,
}
