import { Skeleton } from "@/components/ui/skeleton"

function NavBarSkeleton() {
  return (
    <div className="flex h-20 justify-center px-4 sm:px-6 md:h-24 md:px-12">
      <div
        className="fixed z-30 flex w-[min(calc(100%-2rem),31rem)] items-center justify-between gap-4 rounded-full border border-white/20 px-4 py-2.5 shadow-2xl shadow-black/15"
        style={{
          backgroundColor: "rgba(13, 43, 107, 0.88)",
          top: "calc(var(--notification-bar-height, 0px) + 1rem)",
        }}
      >
        <Skeleton className="size-10 shrink-0 rounded-full bg-white/20" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-10 shrink-0 rounded-full bg-white/20" />
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

        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-6 pb-12 sm:px-6 md:px-12 md:pt-10">
          {/* title card */}
          <section className="surface-glass rounded-3xl p-5 md:p-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <Skeleton className="mb-1 h-10 w-4/5 rounded-xl md:h-14" />
            <Skeleton className="h-7 w-2/3 rounded-xl md:h-9" />
          </section>

          {/* hero image */}
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/82 shadow-[0_30px_90px_rgba(13,43,107,0.12)] backdrop-blur">
            <Skeleton className="aspect-3/4 w-full rounded-3xl" />
          </section>

          {/* tags card */}
          <section className="surface-glass rounded-3xl p-5 md:p-6">
            <Skeleton className="mb-4 h-6 w-28 rounded" />
            <div className="flex flex-wrap gap-2">
              {[80, 100, 72, 90].map((w, i) => (
                <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
              ))}
            </div>
          </section>

          {/* description card */}
          <section className="surface-glass rounded-3xl p-5 md:p-6">
            <Skeleton className="mb-4 h-6 w-32 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-11/12 rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </section>

          {/* external link card */}
          <section className="surface-glass rounded-3xl p-5 md:p-6">
            <Skeleton className="mb-4 h-6 w-36 rounded" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </section>

          {/* team card */}
          <section className="surface-glass rounded-3xl p-5 md:p-6">
            <Skeleton className="mb-4 h-6 w-28 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-white/75 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Skeleton className="h-5 w-32 rounded" />
                      <Skeleton className="h-3 w-40 rounded" />
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Skeleton className="size-8 rounded-full" />
                      <Skeleton className="size-8 rounded-full" />
                      <Skeleton className="size-8 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* related projects */}
          <section className="pt-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <Skeleton className="mb-1 h-4 w-24 rounded" />
                <Skeleton className="h-7 w-36 rounded md:h-8" />
              </div>
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-3xl border border-white/70 bg-white/82 shadow-[0_20px_60px_rgba(13,43,107,0.08)] backdrop-blur"
                >
                  <Skeleton className="aspect-[4/5] w-full" />
                  <div className="space-y-3 px-5 pt-4 pb-5">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <div className="flex gap-1.5">
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* footer skeleton */}
        <footer className="relative mt-16 border-t border-border bg-card">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-12 md:py-16">
            <Skeleton className="h-20 w-40 md:h-24" />
            <div className="flex flex-col items-center gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
