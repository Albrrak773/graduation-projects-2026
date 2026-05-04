function assertEnv<T extends string>(key: string, value: T | undefined): T {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const config = {
  databaseUrl: assertEnv("DATABASE_URL", process.env.DATABASE_URL),
  projectImagesKey: "project-images",
  r2: {
    accessKeyId: assertEnv("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: assertEnv(
      "R2_SECRET_ACCESS_KEY",
      process.env.R2_SECRET_ACCESS_KEY
    ),
    accountId: assertEnv("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID),
    bucketName: assertEnv("R2_BUCKET_NAME", process.env.R2_BUCKET_NAME),
    publicUrl: assertEnv("R2_PUBLIC_URL", process.env.R2_PUBLIC_URL),
  },
}
