"use client"

import { useMemo, useState, useTransition } from "react"
import { useAuth, useClerk } from "@clerk/nextjs"
import { IconHeart, IconHeartFilled } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { castVote, removeVote } from "@/app/projects/[id]/vote/actions"

type VoteButtonProps = {
  projectId: string
  campaignId?: string | null
  maxVotesPerUser?: number
}

export function VoteButton({
  projectId,
  campaignId: initialCampaignId,
  maxVotesPerUser: initialMaxVotes,
}: VoteButtonProps) {
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const [isPending, startTransition] = useTransition()
  const [votedIds, setVotedIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [campaignId, setCampaignId] = useState<string | null | undefined>(initialCampaignId)
  const [maxVotes, setMaxVotes] = useState<number>(initialMaxVotes ?? 0)

  if (isSignedIn && !loaded) {
    setLoaded(true)
    fetch("/api/votes", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { votedProjectIds?: string[]; maxVotesPerUser?: number; campaignId?: string | null } | null) => {
        if (data) {
          setVotedIds(data.votedProjectIds ?? [])
          setMaxVotes(data.maxVotesPerUser ?? 0)
          setCampaignId(data.campaignId)
        }
      })
      .catch(() => {})
  }

  if (!isSignedIn && loaded) {
    setLoaded(false)
    setVotedIds([])
    setMaxVotes(0)
    setCampaignId(null)
  }

  const canVote = useMemo(() => Boolean(campaignId), [campaignId])
  const isVoted = votedIds.includes(projectId)
  const votesUsed = votedIds.length

  function toggleVote() {
    if (!canVote || isPending) return

    const nextVoted = !isVoted
    setVotedIds((prev) => {
      if (nextVoted) return prev.includes(projectId) ? prev : [...prev, projectId]
      return prev.filter((id) => id !== projectId)
    })
    setMessage(null)

    startTransition(async () => {
      const result = nextVoted ? await castVote(projectId) : await removeVote(projectId)
      if (!result.success) {
        setVotedIds((prev) => {
          if (nextVoted) return prev.filter((id) => id !== projectId)
          return prev.includes(projectId) ? [...prev, projectId] : prev
        })
        setMessage(result.error)
      }
    })
  }

  if (!isSignedIn) {
    return (
      <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => openSignIn()}>
        <IconHeart data-icon="inline-start" />
        صوّت للمشروع
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant={isVoted ? "default" : "outline"}
        size="sm"
        disabled={!canVote || isPending}
        className={cn("gap-2 rounded-full", !canVote && "opacity-70")}
        onClick={toggleVote}
      >
        {isVoted ? <IconHeartFilled data-icon="inline-start" /> : <IconHeart data-icon="inline-start" />}
        {isVoted ? "تم التصويت" : "صوّت للمشروع"}
      </Button>
      {!canVote && <span className="text-xs text-muted-foreground">لا توجد حملة تصويت نشطة حالياً</span>}
      {canVote && maxVotes > 1 && (
        <span className="text-xs text-muted-foreground">
          {votesUsed} من {maxVotes} أصوات
        </span>
      )}
      {message && <span className="text-xs text-destructive">{message}</span>}
    </div>
  )
}
