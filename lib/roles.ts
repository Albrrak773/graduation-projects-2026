import { verifySession } from "@/lib/auth"

export async function requireAdmin() {
  return verifySession()
}
