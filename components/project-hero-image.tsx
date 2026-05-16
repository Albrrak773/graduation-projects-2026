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
    <div className={cn("relative aspect-[3/4] w-full", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        quality={60}
        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 768px, 900px"
      />
    </div>
  )
}
