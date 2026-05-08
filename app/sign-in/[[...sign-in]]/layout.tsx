import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import { Suspense } from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }} dynamic>
      <Suspense>{children}</Suspense>
    </ClerkProvider>
  )
}
