import { getAllProjectIds } from "@/db/queries"

export async function generateStaticParams() {
  const ids = await getAllProjectIds()
  return ids.map((id) => ({ id }))
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await params
  return null
}
