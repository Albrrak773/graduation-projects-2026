import { z } from "zod"

const memberSchema = z.object({
  name: z.string().min(1, "اسم العضو مطلوب"),
  uni_id: z.string().min(1, "الرقم الجامعي مطلوب"),
  x_url: z.string(),
  linked_url: z.string(),
  github_url: z.string(),
  personal_email: z.string(),
})

export const projectEditSchema = z.object({
  title: z.string().min(1, "عنوان المشروع مطلوب"),
  supervisor: z.string().min(1, "اسم المشرف مطلوب"),
  discription: z.string(),
  project_external_link: z.string(),
  members: z.array(memberSchema).min(1, "يجب أن يحتوي المشروع على عضو واحد على الأقل"),
})

export type ProjectEditFormData = z.infer<typeof projectEditSchema>
