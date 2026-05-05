"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

type ProjectHeroImageProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

const DEFAULT_RATIO = 3 / 4

export function ProjectHeroImage({ src, alt, className, priority }: ProjectHeroImageProps) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO)

  return (
    <div className={cn("relative w-full", className)} style={{ aspectRatio: ratio }}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 1024px"
        onLoadingComplete={(img) => {
          if (img.naturalWidth && img.naturalHeight) {
            setRatio(img.naturalWidth / img.naturalHeight)
          }
        }}
      />
    </div>
  )
}
