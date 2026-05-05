import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type SocialIconLinkProps = {
  href: string
  label: string
  brand: "github" | "x" | "linkedin" | "mail"
  icon: ReactNode
  filledIcon: ReactNode
  className?: string
}

const BRAND_CLASSES: Record<SocialIconLinkProps["brand"], string> = {
  github: "hover:text-foreground",
  x: "hover:text-foreground",
  linkedin: "hover:text-[#0a66c2]",
  mail: "hover:text-[#ea4335]",
}

export function SocialIconLink({ href, label, brand, icon, filledIcon, className }: SocialIconLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      className={cn(
        "group/icon relative inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors",
        BRAND_CLASSES[brand],
        className
      )}
    >
      <span className="absolute inset-0 grid place-items-center transition-all duration-200 group-hover/icon:opacity-0">
        {icon}
      </span>
      <span className="absolute inset-0 grid place-items-center opacity-0 transition-all duration-200 group-hover/icon:scale-110 group-hover/icon:opacity-100">
        {filledIcon}
      </span>
    </a>
  )
}
