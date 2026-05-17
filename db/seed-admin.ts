// run with infisical run --env=dev -- pnpm tsx db/seed-admin.ts <email> <password>
import "dotenv/config"
import bcryptjs from "bcryptjs"
import { config } from "../lib/config.js"
import { adminsTable } from "./schema.js"

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error("Usage: pnpm tsx db/seed-admin.ts <email> <password>")
  process.exit(1)
}

async function main() {
  const passwordHash = await bcryptjs.hash(password, 12)
  await config.db.insert(adminsTable).values({ email: email.toLowerCase(), passwordHash }).onConflictDoNothing()
  console.log(`✓ Admin created: ${email}`)
}

main().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
