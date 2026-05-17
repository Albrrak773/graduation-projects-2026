"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login } from "./actions"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push("/admin")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          البريد الإلكتروني
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          كلمة المرور
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            dir="ltr"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <Button type="submit" className="mt-2 w-full" disabled={loading}>
        {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
      </Button>
    </form>
  )
}
