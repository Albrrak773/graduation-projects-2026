"use client"

import { useMemo, useState, useTransition } from "react"
import { useAuth, useClerk } from "@clerk/nextjs"
import { IconHeart, IconHeartFilled } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isVotingYear } from "@/lib/votes"
import { castVote, removeVote } from "@/app/projects/[id]/vote/actions"

type VoteButtonProps = {
  projectId: string
  projectYear?: number | null
  initialVoted?: boolean
}

export function VoteButton({ projectId, projectYear, initialVoted = false }: VoteButtonProps) {
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const [isPending, startTransition] = useTransition()
  const [votedIds, setVotedIds] = useState<string[]>(initialVoted ? [projectId] : [])
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const canVote = useMemo(() => isVotingYear(projectYear ?? null), [projectYear])
  const isVoted = votedIds.includes(projectId)

  if (isSignedIn && !loaded) {
    setLoaded(true)
    fetch("/api/votes", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { votedProjectIds?: string[] } | null) => {
        if (data) setVotedIds(data.votedProjectIds ?? [])
      })
      .catch(() => {})
  }

  if (!isSignedIn && loaded) {
    setLoaded(false)
    setVotedIds([])
  }

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
          return prev.includes(projectId) ? prev : [...prev, projectId]
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
      {!canVote && <span className="text-xs text-muted-foreground">التصويت متاح لمشاريع السنة الحالية فقط</span>}
      {message && <span className="text-xs text-destructive">{message}</span>}
    </div>
  )
}
