import Image from "next/image"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-muted/40">
      <div className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Image src="/design/logo.png" alt="مشاريع التخرج" className="h-8 w-auto" width={80} height={32} />
            <span className="text-xs text-muted-foreground">لوحة التحكم</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            العودة للموقع
            <IconArrowLeft className="size-3.5" />
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  )
}
