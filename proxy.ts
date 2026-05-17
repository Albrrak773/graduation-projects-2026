import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"

const ADMIN_ROUTES = ["/admin"]
const LOGIN_ROUTE = "/admin/login"

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

async function handleAdminSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))
  if (!isAdminRoute) return NextResponse.next()

  const isLoginRoute = pathname === LOGIN_ROUTE
  const token = request.cookies.get("admin_session")?.value
  const secret = getSecret()

  let session: { id: string; email: string } | null = null
  if (token && secret) {
    try {
      const { payload } = await jwtVerify<{ id: string; email: string }>(token, secret)
      session = payload
    } catch {}
  }

  if (isLoginRoute) {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
  }

  return NextResponse.next()
}

export default clerkMiddleware(async (_auth, request) => {
  return handleAdminSession(request)
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
}
