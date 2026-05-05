export default function ProjectLoading() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-16 pb-20 md:px-12 md:pt-20">
          <div className="aspect-[16/10] w-full animate-pulse rounded-3xl bg-muted md:aspect-[16/7]" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-28 animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
