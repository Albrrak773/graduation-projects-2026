"use client"

import { useState } from "react"

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error("Test error — this triggers global-error.tsx")
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <button
        onClick={() => setShouldError(true)}
        className="rounded-md bg-destructive px-6 py-3 text-base font-bold text-white"
      >
        Trigger Error
      </button>
    </div>
  )
}
