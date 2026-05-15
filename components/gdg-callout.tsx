import Image from "next/image"

export function GDGCallout() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 py-4 md:px-12">
      <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:gap-8 md:p-8">
        {/* Google Colors Top Border */}
        <div className="absolute top-0 left-0 flex h-1.5 w-full">
          <div className="h-full flex-1 bg-[#4285F4]" />
          <div className="h-full flex-1 bg-[#EA4335]" />
          <div className="h-full flex-1 bg-[#FBBC05]" />
          <div className="h-full flex-1 bg-[#34A853]" />
        </div>

        <div className="z-10 flex w-full flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6 md:gap-8">
          <div className="h-16 w-16 shrink-0 sm:h-20 sm:w-20 md:h-24 md:w-24">
            <Image
              src="/design/gdg.png"
              alt="GDG Logo"
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase md:text-sm">
              Google Developer Group - Qassim
            </p>
            <h3 className="font-heading text-2xl leading-tight font-extrabold md:text-3xl">
              تبي تشوف مين اعلى نقاط؟ 👀
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              لوحة صدارة مجتمع مطوّري قوقل في القصيم — تابع نقاطك، شارك في الفعاليات، وتنافس مع أقوى المطورين
            </p>
          </div>
        </div>

        <a
          href="https://gdg-q.com"
          target="_blank"
          rel="noopener noreferrer"
          className="z-10 flex w-full shrink-0 items-center justify-center rounded-full bg-foreground px-8 py-3.5 text-sm font-bold text-background transition-transform hover:scale-105 active:scale-95 md:w-auto md:px-10"
        >
          اكتشف لوحة الصدارة
        </a>
      </div>
    </section>
  )
}
