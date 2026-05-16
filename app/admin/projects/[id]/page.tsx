import { getAllProjectIds } from "@/db/queries"

export async function generateStaticParams() {
  let ids: string[] = []
  try {
    ids = await getAllProjectIds()
  } catch (error) {
    console.error("Failed to fetch project IDs:", error)
    ids = ["__placeholder__"]
  }
  return ids.map((id) => ({ id }))
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await params
  return null
}
