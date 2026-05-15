import { Skeleton } from "@/components/ui/skeleton"

function NavBarSkeleton() {
  return (
    <div className="px-4 pt-4 sm:px-6 md:px-12 md:pt-8">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 rounded-full border border-white/65 bg-white/78 px-3 py-2 shadow-[0_20px_60px_rgba(13,43,107,0.10)] backdrop-blur-xl md:px-4">
        <Skeleton className="h-10 w-32 rounded-full md:h-12" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default function ProjectLoading() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <NavBarSkeleton />

        <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-6 pb-12 sm:px-6 md:px-12 md:pt-10">
          {/* top grid: info card + image */}
          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
            {/* info card */}
            <div className="surface-glass rounded-3xl p-5 md:p-7">
              <div className="mb-4 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mb-2 h-10 w-4/5 rounded-xl" />
              <Skeleton className="h-7 w-2/3 rounded-xl" />

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border/60 bg-white/70 p-4">
                <Skeleton className="size-10 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-5 w-40 rounded" />
                </div>
              </div>

              <Skeleton className="mt-5 h-12 w-full rounded-full" />
            </div>

            {/* image */}
            <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
          </section>

          {/* bottom grid: details + team */}
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              {/* tags card */}
              <div className="surface-glass rounded-3xl p-5 md:p-6">
                <Skeleton className="mb-4 h-6 w-28 rounded" />
                <div className="flex flex-wrap gap-2">
                  {[80, 100, 72, 90].map((w, i) => (
                    <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
                  ))}
                </div>
              </div>

              {/* description card */}
              <div className="surface-glass rounded-3xl p-5 md:p-6">
                <Skeleton className="mb-4 h-6 w-32 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-11/12 rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </div>
            </div>

            {/* team card */}
            <div className="surface-glass rounded-3xl p-5 md:p-6">
              <Skeleton className="mb-4 h-6 w-28 rounded" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-border/60 bg-white/75 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32 rounded" />
                        <Skeleton className="h-3 w-24 rounded" />
                        <Skeleton className="h-3 w-40 rounded" />
                      </div>
                      <div className="flex gap-1.5">
                        <Skeleton className="size-8 rounded-full" />
                        <Skeleton className="size-8 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
