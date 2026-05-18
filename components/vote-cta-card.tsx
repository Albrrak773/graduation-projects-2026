"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useAuth, useClerk } from "@clerk/nextjs"
import { IconHeart, IconHeartFilled, IconHourglassHigh, IconArrowRight } from "@tabler/icons-react"
import { castVote, removeVote, switchVote } from "@/app/projects/[id]/vote/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type VoteCtaCardProps = {
  projectId: string
  projectTitle: string
  campaignName: string
  endsAt: Date
  maxVotesPerUser: number
}

const PENDING_VOTE_STORAGE_KEY = "graduation-projects:pending-vote"
const PENDING_VOTE_MAX_AGE_MS = 10 * 60 * 1000

function savePendingVote(projectId: string) {
  try {
    window.localStorage.setItem(PENDING_VOTE_STORAGE_KEY, JSON.stringify({ projectId, createdAt: Date.now() }))
  } catch {}
}

function readPendingVote() {
  try {
    const raw = window.localStorage.getItem(PENDING_VOTE_STORAGE_KEY)
    if (!raw) return null

    const pending = JSON.parse(raw) as { projectId?: string; createdAt?: number }
    if (!pending.projectId || !pending.createdAt || Date.now() - pending.createdAt > PENDING_VOTE_MAX_AGE_MS) {
      window.localStorage.removeItem(PENDING_VOTE_STORAGE_KEY)
      return null
    }

    return pending.projectId
  } catch {
    return null
  }
}

function clearPendingVote() {
  try {
    window.localStorage.removeItem(PENDING_VOTE_STORAGE_KEY)
  } catch {}
}

function useCountdown(targetDate: Date) {
  const endTs = targetDate.getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  return useMemo(() => {
    const diff = endTs - now
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true }
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return { days, hours, minutes, seconds, ended: false }
  }, [now, endTs])
}

function CountdownDigits({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-7 flex-col items-center gap-0.5 sm:min-w-10">
      <span className="font-heading text-2xl leading-none font-black text-white tabular-nums sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[0.55rem] font-medium tracking-wider text-white/60 uppercase sm:text-[0.65rem]">
        {label}
      </span>
    </div>
  )
}

export function VoteCtaCard({ projectId, projectTitle, campaignName, endsAt, maxVotesPerUser }: VoteCtaCardProps) {
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const countdown = useCountdown(endsAt)
  const [isPending, startTransition] = useTransition()
  const [votedIds, setVotedIds] = useState<string[]>([])
  const [votedTitles, setVotedTitles] = useState<Record<string, string>>({})
  const fetchedRef = useRef(false)
  const autoVoteRef = useRef(false)
  const [message, setMessage] = useState<string | null>(null)
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)

  const isVoted = votedIds.includes(projectId)

  const doToggle = useCallback(
    (nextVoted: boolean) => {
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
    },
    [projectId, startTransition]
  )

  useEffect(() => {
    if (isSignedIn && !fetchedRef.current) {
      fetchedRef.current = true
      fetch("/api/votes", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (
            data: {
              votedProjectIds?: string[]
              votedProjectTitles?: Record<string, string>
            } | null
          ) => {
            const nextVotedIds = data?.votedProjectIds ?? []

            if (data) {
              setVotedIds(nextVotedIds)
              setVotedTitles(data.votedProjectTitles ?? {})
            }

            const pendingProjectId = readPendingVote()
            if (
              pendingProjectId !== projectId ||
              countdown.ended ||
              autoVoteRef.current ||
              nextVotedIds.includes(projectId)
            ) {
              if (pendingProjectId === projectId) clearPendingVote()
              return
            }

            clearPendingVote()

            if (maxVotesPerUser > 0 && nextVotedIds.length >= maxVotesPerUser) {
              setSwitchDialogOpen(true)
              return
            }

            autoVoteRef.current = true
            setMessage(null)
            setVotedIds((prev) => (prev.includes(projectId) ? prev : [...prev, projectId]))

            startTransition(async () => {
              const result = await castVote(projectId)
              if (!result.success) {
                autoVoteRef.current = false
                setVotedIds((prev) => prev.filter((id) => id !== projectId))
                setMessage(result.error)
              }
            })
          }
        )
        .catch(() => {})
    }
    if (!isSignedIn && fetchedRef.current) {
      fetchedRef.current = false
      autoVoteRef.current = false
      setVotedIds([])
      setVotedTitles({})
    }
  }, [countdown.ended, isSignedIn, maxVotesPerUser, projectId, startTransition])

  function handleVoteClick() {
    if (!isSignedIn) {
      savePendingVote(projectId)
      openSignIn()
      return
    }
    if (isPending || countdown.ended) return

    if (!isVoted && votedIds.length >= maxVotesPerUser && maxVotesPerUser > 0) {
      setSwitchDialogOpen(true)
      return
    }

    doToggle(!isVoted)
  }

  function handleSwitchConfirm() {
    setSwitchDialogOpen(false)

    setVotedIds((prev) => prev.filter((id) => id !== projectId).concat(projectId))
    setMessage(null)

    startTransition(async () => {
      const result = await switchVote(projectId)
      if (!result.success) {
        setMessage(result.error)
        fetch("/api/votes", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((data: { votedProjectIds?: string[]; votedProjectTitles?: Record<string, string> } | null) => {
            if (data) {
              setVotedIds(data.votedProjectIds ?? [])
              setVotedTitles(data.votedProjectTitles ?? {})
            }
          })
          .catch(() => {})
      }
    })
  }

  const previousProjectTitle = votedIds.length > 0 && votedTitles[votedIds[0]] ? votedTitles[votedIds[0]] : null
  const voteButtonText = isPending
    ? isVoted
      ? "جارٍ التصويت..."
      : "جارٍ الإلغاء..."
    : isVoted
      ? "تم التصويت"
      : "صوّت للمشروع"

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-bl from-brand-darkblue via-primary/90 to-brand-teal">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
        <div className="pointer-events-none absolute -start-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -end-6 -bottom-6 size-32 rounded-full bg-brand-teal/30 blur-xl" />
        <div className="brand-sheen pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" />

        <div className="relative z-10 flex flex-col gap-4 p-5 sm:p-8">
          <div className="space-y-0.5">
            <p className="font-heading text-3xl leading-tight font-black text-white md:text-4xl">
              صوّت لـ {projectTitle}
            </p>
            <p className="text-sm text-white/50">لـ {campaignName}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            {!countdown.ended ? (
              <div className="flex w-full items-center gap-3 rounded-xl bg-black/20 px-4 py-3 backdrop-blur-sm sm:flex-1 sm:px-4 sm:py-4">
                <div className="flex shrink-0 items-center gap-2">
                  <IconHourglassHigh className="size-5 shrink-0 text-yellow-300" />
                  <span className="text-xs font-semibold text-white/80 sm:text-sm">ينتهي التصويت خلال</span>
                </div>
                <div className="ms-auto flex items-center gap-1 sm:gap-1.5" dir="ltr">
                  {countdown.days > 0 && <CountdownDigits value={countdown.days} label="يوم" />}
                  {countdown.days > 0 && <span className="text-lg font-bold text-white/40 sm:text-2xl">:</span>}
                  <CountdownDigits value={countdown.hours} label="ساعة" />
                  <span className="text-lg font-bold text-white/40 sm:text-2xl">:</span>
                  <CountdownDigits value={countdown.minutes} label="دقيقة" />
                  <span className="text-lg font-bold text-white/40 sm:text-2xl">:</span>
                  <CountdownDigits value={countdown.seconds} label="ثانية" />
                </div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-center rounded-xl bg-black/20 px-4 py-3 text-center text-sm font-bold text-white/70 backdrop-blur-sm sm:flex-1">
                انتهت فترة التصويت
              </div>
            )}

            {!isSignedIn ? (
              <Button
                size="lg"
                className="h-auto w-full gap-2 rounded-xl bg-white px-5 py-3 text-brand-darkblue shadow-lg shadow-black/20 hover:bg-white/90 hover:text-brand-darkblue sm:w-auto sm:shrink-0 sm:rounded-full sm:px-6"
                onClick={handleVoteClick}
              >
                <IconHeart className="size-5" />
                <span>صوّت الآن</span>
              </Button>
            ) : (
              <div className="flex flex-col items-stretch gap-1.5 sm:shrink-0 sm:items-center">
                <Button
                  size="lg"
                  variant={isVoted ? "secondary" : "default"}
                  disabled={isPending || countdown.ended}
                  className={cn(
                    "h-auto w-full gap-2 rounded-xl px-5 py-3 shadow-lg shadow-black/20 sm:w-auto sm:rounded-full sm:px-6",
                    isVoted
                      ? "bg-white/20 text-white hover:bg-white/30 hover:text-white"
                      : "bg-white text-brand-darkblue shadow-lg shadow-black/20 hover:bg-white/90 hover:text-brand-darkblue"
                  )}
                  onClick={handleVoteClick}
                >
                  {isVoted ? <IconHeartFilled className="size-5 text-pink-300" /> : <IconHeart className="size-5" />}
                  <span>{voteButtonText}</span>
                </Button>
                {maxVotesPerUser > 1 && (
                  <span className="text-center text-xs font-medium text-white/60">
                    {votedIds.length} من {maxVotesPerUser} أصوات
                  </span>
                )}
              </div>
            )}
          </div>
          {message && <span className="text-xs font-medium text-pink-200">{message}</span>}
        </div>
      </section>

      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير التصويت</DialogTitle>
            <DialogDescription>
              {previousProjectTitle ? (
                <>
                  أنت مصوّت حالياً لـ
                  <span className="font-bold text-foreground"> «{previousProjectTitle}» </span>
                  هل تريد تغيير تصويتك إلى
                  <span className="font-bold text-foreground"> «{projectTitle}» </span>؟
                </>
              ) : (
                <>وصلت إلى الحد الأقصى للأصوات. هل تريد تغيير تصويتك؟</>
              )}
            </DialogDescription>
          </DialogHeader>
          {previousProjectTitle && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
              <span className="flex shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <IconHeartFilled className="size-4" />
              </span>
              <span className="text-muted-foreground line-through">{previousProjectTitle}</span>
              <IconArrowRight className="size-4 shrink-0 rotate-180 text-muted-foreground" />
              <span className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconHeartFilled className="size-4" />
              </span>
              <span className="font-bold text-foreground">{projectTitle}</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSwitchConfirm} disabled={isPending}>
              {isPending ? "جارٍ التغيير..." : "تغيير التصويت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}
