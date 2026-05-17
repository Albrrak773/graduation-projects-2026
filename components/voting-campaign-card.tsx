"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { IconHeart, IconHeartFilled, IconTrophy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

type VotingCampaignCardProps = {
  campaignName: string
}

export function VotingCampaignCard({ campaignName }: VotingCampaignCardProps) {
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
      <div className="pointer-events-none absolute start-0 top-0 h-full w-2 bg-gradient-to-b from-primary via-primary/70 to-primary/20" />
      <div className="pointer-events-none absolute end-4 top-4 opacity-10">
        <IconTrophy className="size-24 text-primary" />
      </div>
      <div className="relative z-10 flex flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <IconHeartFilled className="size-5" />
          </span>
          <div>
            <p className="font-heading text-lg font-bold text-foreground">
              صوّت لأفضل مشروع &laquo;{campaignName}&raquo;
            </p>
            <p className="text-sm text-muted-foreground">لمسابقة أفضل مشروع</p>
          </div>
        </div>
        {isSignedIn ? (
          <p className="text-sm text-muted-foreground">
            تصفح المشاريع أدناه واضغط على زر &quot;صوّت للمشروع&quot; في صفحة المشروع الذي تريد التصويت له.
          </p>
        ) : (
          <Button size="lg" className="gap-2 rounded-full text-base font-bold" onClick={() => openSignIn()}>
            <IconHeart className="size-5" />
            صوّت الآن
          </Button>
        )}
      </div>
    </section>
  )
}
