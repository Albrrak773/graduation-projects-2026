import { notFound } from "next/navigation"
import { getProjectBySignature, getAllProjectSignatures } from "@/db/queries"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { EditProjectForm } from "@/components/edit-project-form"

type EditProjectPageProps = {
  params: Promise<{ signature: string }>
}

export async function generateStaticParams() {
  let signatures: string[] = []
  try {
    signatures = await getAllProjectSignatures()
  } catch (error) {
    console.error("Failed to fetch project signatures:", error)
  }
  if (signatures.length === 0) signatures = ["__placeholder__"]
  return signatures.map((signature) => ({ signature }))
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { signature } = await params
  let project = null

  try {
    project = await getProjectBySignature(signature)
  } catch (error) {
    console.error("Failed to fetch project:", error)
  }

  if (!project) {
    notFound()
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <NavBar projectTitle={`تعديل: ${project.title}`} />
        <main className="px-6 py-12 md:px-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">تعديل بيانات المشروع</h1>
              <p className="mt-2 text-muted-foreground">قم بتحديث المعلومات الأساسية للمشروع وإدارة أعضاء الفريق.</p>
            </div>

            <EditProjectForm project={project} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
