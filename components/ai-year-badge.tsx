import Image from "next/image"
import { cn } from "@/lib/utils"

type AiYearBadgeProps = {
  tone?: "light" | "dark"
  className?: string
}

/** شعار عام الذكاء الاصطناعي مع العبارة. `dark` للخلفيات الداكنة. */
export function AiYearBadge({ tone = "light", className }: AiYearBadgeProps) {
  const isDark = tone === "dark"

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Image
        src={isDark ? "/design/ai-year-white.png" : "/design/ai-year.png"}
        alt="عام الذكاء الاصطناعي"
        width={1182}
        height={458}
        className="h-12 w-auto shrink-0 md:h-14"
        style={{ width: "auto" }}
      />
      <div className={cn("h-10 w-px shrink-0 md:h-12", isDark ? "bg-white/30" : "bg-border")} />
      <div className="flex flex-col gap-1 text-start">
        <span className={cn("text-xs font-bold md:text-sm", isDark ? "text-white/75" : "text-muted-foreground")}>
          عام الذكاء الاصطناعي 2026م
        </span>
        <span
          className={cn("font-heading text-base font-black md:text-lg", isDark ? "text-white" : "text-[#0d2b6b]")}
        >
          ذكاءٌ يُبنى .. وطنٌ يرقى
        </span>
      </div>
    </div>
  )
}
