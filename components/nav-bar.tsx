import Image from "next/image"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function NavCrumbs({ projectTitle }: { projectTitle?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">الرئيسية</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {projectTitle ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/projects">المشاريع</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{projectTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>المشاريع</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function NavBar({ projectTitle }: { projectTitle?: string }) {
  return (
    <div className="px-6 pt-6 md:px-12 md:pt-10">
      <div className="mx-auto max-w-6xl rounded-2xl border border-border/70 bg-card/80 px-6 py-4 shadow-sm backdrop-blur md:px-8 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <NavCrumbs projectTitle={projectTitle} />
          <Link href="/" aria-label="الرئيسية">
            <Image
              src="/design/logo.png"
              alt="مشاريع التخرج"
              className="h-10 w-auto md:h-14"
              width={480}
              height={200}
              priority
            />
          </Link>
        </div>
      </div>
    </div>
  )
}
