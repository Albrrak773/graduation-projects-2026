import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { IconThumbUp, IconArrowRight } from "@tabler/icons-react"
import { getMyVotedProjects } from "@/app/profile/actions"
import { ProfileUserProfile } from "@/components/profile-user-profile"
import { VotedProjectsList } from "@/components/voted-projects-list"
import { Button } from "@/components/ui/button"

async function VotedProjectsContent() {
  const { userId } = await auth()
  if (!userId) return null

  const votes = await getMyVotedProjects()

  return <VotedProjectsList votes={votes} />
}

export default function ProfileCatchAllPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10">
      <div className="mb-4 w-full max-w-[680px]">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href="/">
            <IconArrowRight className="size-4" />
            العودة للموقع
          </Link>
        </Button>
      </div>
      <div className="w-full max-w-[680px]">
        <ProfileUserProfile />
        <div className="mt-6 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <IconThumbUp className="size-5 text-primary" />
            <h2 className="font-heading text-lg font-bold">تصويتك</h2>
          </div>
          <Suspense
            fallback={
              <div className="mt-4 space-y-3">
                <div className="h-20 animate-pulse rounded-xl bg-muted" />
                <div className="h-20 animate-pulse rounded-xl bg-muted" />
              </div>
            }
          >
            <VotedProjectsContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
