import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/project-card"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">المشروع جاهز!</h1>
          <p>يمكنك الآن إضافة المكونات والبدء بالبناء.</p>
          <p>لقد أضفنا مكون الزر بالفعل من أجلك.</p>
          <Button className="mt-2">زر</Button>
          <ProjectCard projectId="5d341e43-f607-4bef-8078-8a65b5b50a9c" />
        </div>
      </div>
    </div>
  )
}
