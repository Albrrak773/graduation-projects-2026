import { recordClick } from "@/app/notifications/actions"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { notificationId, endpoint } = body

    if (!notificationId || !endpoint) {
      return NextResponse.json({ error: "Missing notificationId or endpoint" }, { status: 400 })
    }

    await recordClick(notificationId, endpoint)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
