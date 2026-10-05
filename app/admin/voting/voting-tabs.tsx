import Link from "next/link"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "campaigns", title: "الحملات", href: "/admin/voting" },
  { key: "stats", title: "الإحصائيات والمراقبة", href: "/admin/voting/stats" },
] as const

export function VotingTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav className="flex w-fit items-center gap-1 rounded-lg bg-muted p-[3px]">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground",
            tab.key === active && "bg-background text-foreground shadow-xs"
          )}
        >
          {tab.title}
        </Link>
      ))}
    </nav>
  )
}
