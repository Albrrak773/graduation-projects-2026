"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { IconTrash, IconLoader2, IconThumbUp } from "@tabler/icons-react"
import { removeMyVote } from "@/app/profile/actions"

type VotedProject = {
  voteId: string
  projectId: string
  campaignId: string
  campaignName: string
  projectTitle: string
  projectImageUrl: string | null
  votedAt: Date | null
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return ""
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "الآن"
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  return new Date(date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
}

export function VotedProjectsList({ votes }: { votes: VotedProject[] }) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  if (votes.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <IconThumbUp className="mx-auto size-10 text-muted-foreground/20" />
        <p className="mt-3 text-sm text-muted-foreground">ما صوت لاي مشروع للحين 😕</p>
        <Link href="/projects" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          تصفح المشاريع
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {votes.map((vote) => (
        <div key={vote.voteId} className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <Link href={`/projects/${vote.projectId}`} className="shrink-0">
            {vote.projectImageUrl ? (
              <Image
                src={vote.projectImageUrl}
                alt={vote.projectTitle}
                width={56}
                height={70}
                className="size-14 rounded-lg object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-lg font-bold text-primary/60">
                {vote.projectTitle[0]}
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/projects/${vote.projectId}`}
              className="truncate font-heading text-sm font-bold text-foreground hover:text-primary"
              dir="auto"
            >
              {vote.projectTitle}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {vote.campaignName}
              </span>
              <span>{formatRelativeTime(vote.votedAt)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={removingId === vote.voteId}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            onClick={() => {
              setRemovingId(vote.voteId)
              startTransition(async () => {
                await removeMyVote(vote.voteId)
                setRemovingId(null)
              })
            }}
          >
            {removingId === vote.voteId ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconTrash className="size-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
