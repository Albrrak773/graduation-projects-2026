import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "@/db/schema"

function assertEnv<T extends string>(key: string, value: T | undefined): T {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const COLLEDGE_LABELS: Record<string, string> = {
  CS: "علوم الحاسب",
  IT: "تقنية المعلومات",
  COE: "هندسة الحاسب",
}

export const COLLEDGE_COLORS: Record<string, string> = {
  CS: "bg-[#0097a7]/10 text-[#0097a7] dark:bg-[#0097a7]/20 dark:text-[#4dd0e1]",
  IT: "bg-[#4285f4]/10 text-[#4285f4] dark:bg-[#4285f4]/20 dark:text-[#90caf9]",
  COE: "bg-[#0d2b6b]/10 text-[#0d2b6b] dark:bg-[#0d2b6b]/20 dark:text-[#7986cb]",
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
