import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "@/db/schema"
import dotenv from "dotenv"

dotenv.config({ override: true })

function assertEnv<T extends string>(key: string, value: T | undefined): T {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const pool = new pg.Pool({
  connectionString: assertEnv("DATABASE_URL", process.env.DATABASE_URL),
})

export const config = {
  db: drizzle(pool, { schema }),
  projectImagesKey: "project-images",
  r2: {
    accessKeyId: assertEnv("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: assertEnv("R2_SECRET_ACCESS_KEY", process.env.R2_SECRET_ACCESS_KEY),
    accountId: assertEnv("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID),
    bucketName: assertEnv("R2_BUCKET_NAME", process.env.R2_BUCKET_NAME),
    publicUrl: assertEnv("R2_PUBLIC_URL", process.env.R2_PUBLIC_URL),
  },
}
