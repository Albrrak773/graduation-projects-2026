import Link from "next/link"
import Image from "next/image"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center p-4">
      <div className="surface-glass w-full max-w-sm rounded-2xl p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link href="/" aria-label="الرئيسية">
            <Image
              src="/design/logo.png"
              alt="مشاريع التخرج"
              className="h-20 w-auto"
              width={160}
              height={80}
              priority
            />
          </Link>
          <h1 className="font-heading text-xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">سجّل دخولك للمتابعة</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
