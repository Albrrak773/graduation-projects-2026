"use client"

import { useClerk } from "@clerk/nextjs"
import { IconLogout, IconLoader2 } from "@tabler/icons-react"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"

export function SignOutPage() {
  const { signOut } = useClerk()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <IconLogout className="size-10 text-destructive/40" />
      <p className="text-sm text-muted-foreground">هل أنت متأكد من رغبتك في تسجيل الخروج؟</p>
      <Button
        variant="destructive"
        className="gap-2"
        disabled={isPending}
        onClick={() => startTransition(() => signOut({ redirectUrl: "/" }))}
      >
        {isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconLogout className="size-4" />}
        تسجيل الخروج
      </Button>
    </div>
  )
}
