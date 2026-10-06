import type { Metadata } from "next"
import { LiveVoteBoard } from "@/components/live-vote-board"

export const metadata: Metadata = {
  title: "التصويت المباشر",
  description: "ترتيب أعلى عشرة مشاريع في التصويت، يتحدث لحظياً.",
}

export default function LiveVotesPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-8 sm:py-12">
      <LiveVoteBoard />
    </main>
  )
}
