"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type ProjectHeroImageProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function ProjectHeroImage({ src, alt, className, priority }: ProjectHeroImageProps) {
  return (
    <div className={cn("relative aspect-[4/5] w-full md:aspect-[3/4]", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={70}
        className="object-contain"
        sizes="(max-width: 768px) calc(100vw - 2rem), 1024px"
      />
    </div>
  )
}
