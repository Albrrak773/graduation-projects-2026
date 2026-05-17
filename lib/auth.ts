import bcryptjs from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { config } from "@/lib/config"
import { adminsTable } from "@/db/schema"
import { eq } from "drizzle-orm"

const SESSION_COOKIE = "admin_session"
const SESSION_DURATION = "7d"
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("Missing AUTH_SECRET environment variable")
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash)
}

export type SessionPayload = {
  id: string
  email: string
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  })

  return token
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getAdminByEmail(email: string) {
  const [admin] = await config.db.select().from(adminsTable).where(eq(adminsTable.email, email.toLowerCase())).limit(1)
  return admin ?? null
}

export async function authenticateAdmin(email: string, password: string): Promise<SessionPayload | null> {
  const admin = await getAdminByEmail(email.toLowerCase())
  if (!admin) return null

  const valid = await verifyPassword(password, admin.passwordHash)
  if (!valid) return null

  return { id: admin.id, email: admin.email }
}
