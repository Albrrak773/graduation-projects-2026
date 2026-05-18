"use client"

import { useEffect } from "react"
import { useAuth, UserProfile, SignOutButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { IconLogout } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function ProfileUserProfile() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn) return null

  return (
    <UserProfile routing="path" path="/profile">
      <UserProfile.Page label="تسجيل الخروج" url="signout" labelIcon={<IconLogout className="size-4" />}>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <IconLogout className="size-10 text-destructive/40" />
          <p className="text-sm text-muted-foreground">هل أنت متأكد من رغبتك في تسجيل الخروج؟</p>
          <SignOutButton>
            <Button variant="destructive" className="gap-2">
              <IconLogout className="size-4" />
              تسجيل الخروج
            </Button>
          </SignOutButton>
        </div>
      </UserProfile.Page>
    </UserProfile>
  )
}
