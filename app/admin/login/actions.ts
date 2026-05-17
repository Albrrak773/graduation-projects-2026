"use server"

import { authenticateAdmin, createSession } from "@/lib/auth"

export async function login(formData: FormData): Promise<{ error?: string } | void> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "يرجى ملء جميع الحقول" }
  }

  const session = await authenticateAdmin(email.toLowerCase(), password)
  if (!session) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }
  }

  await createSession(session)
}
