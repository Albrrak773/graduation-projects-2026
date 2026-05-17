"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import {
  IconPlus,
  IconTrash,
  IconUpload,
  IconUser,
  IconLink,
  IconSchool,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandGithub,
  IconMail,
  IconPhotoEdit,
  IconLoader2,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requestProjectImageUpload, processProjectImage } from "@/app/admin/projects/actions"
import type { Project } from "@/db/types"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

type UploadState = "idle" | "uploading" | "processing" | "success" | "error"

export function EditProjectForm({ project }: { project: Project }) {
  const [members, setMembers] = useState(project.participants || [])
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(project.image_thumb_url || project.image_url || null)
  const [currentImageUrl, setCurrentImageUrl] = useState(project.image_thumb_url || project.image_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addMember = () => {
    setMembers([
      ...members,
      {
        project_id: project.id,
        name: "",
        uni_id: "",
        x_url: "",
        linked_url: "",
        github_url: "",
        personal_email: "",
      },
    ])
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ""

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadState("error")
      setUploadError("نوع الملف غير مدعوم. الأنواع المدعومة: JPEG, PNG, WebP")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadState("error")
      setUploadError(`حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE / 1024 / 1024}MB)`)
      return
    }

    setUploadError(null)

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setUploadState("uploading")

    try {
      const uploadResult = await requestProjectImageUpload(project.id, file.type)

      if ("error" in uploadResult || !uploadResult.uploadUrl) {
        setUploadState("error")
        setUploadError(uploadResult.error ?? "فشل في إنشاء رفع الصورة")
        URL.revokeObjectURL(localPreview)
        return
      }

      const putResponse = await fetch(uploadResult.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!putResponse.ok) {
        setUploadState("error")
        setUploadError("فشل في رفع الصورة إلى التخزين")
        URL.revokeObjectURL(localPreview)
        return
      }

      setUploadState("processing")

      const processResult = await processProjectImage(project.id, uploadResult.tempKey)

      if ("error" in processResult || !processResult.success) {
        setUploadState("error")
        setUploadError(processResult.error ?? "فشل في معالجة الصورة")
        URL.revokeObjectURL(localPreview)
        return
      }

      setCurrentImageUrl(processResult.thumbUrl)
      setUploadState("success")
      URL.revokeObjectURL(localPreview)

      setTimeout(() => setUploadState("idle"), 3000)
    } catch (err) {
      console.error("Upload error:", err)
      setUploadState("error")
      setUploadError("حدث خطأ غير متوقع أثناء رفع الصورة")
      URL.revokeObjectURL(localPreview)
    }
  }

  const displayImageUrl = currentImageUrl || previewUrl

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">البيانات الأساسية</CardTitle>
          <CardDescription>المعلومات الرئيسية للمشروع.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                صورة المشروع
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="group relative flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted/50">
                  {displayImageUrl ? (
                    <>
                      <Image
                        src={displayImageUrl}
                        alt={project.title}
                        fill
                        sizes="160px"
                        className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-40"
                      />
                      <div className="relative z-10 flex flex-col items-center gap-2 rounded-xl bg-background/80 p-3 shadow-sm backdrop-blur-md transition-transform group-hover:scale-105">
                        {uploadState === "uploading" || uploadState === "processing" ? (
                          <IconLoader2 className="size-6 animate-spin text-foreground" />
                        ) : uploadState === "success" ? (
                          <IconCircleCheck className="size-6 text-green-500" />
                        ) : (
                          <IconPhotoEdit className="size-6 text-foreground" />
                        )}
                      </div>
                    </>
                  ) : (
                    <IconUpload className="size-8 text-muted-foreground transition-transform group-hover:-translate-y-1" />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
                    onChange={handleFileSelect}
                    disabled={uploadState === "uploading" || uploadState === "processing"}
                  />
                </div>
                <div className="space-y-1.5 pb-2">
                  <p className="text-sm font-medium text-foreground">ارفع صورة جديدة للمشروع</p>
                  <p className="max-w-[250px] text-xs leading-relaxed text-muted-foreground">
                    سيتم تحويل الصورة تلقائياً إلى صيغة AVIF paddock ضغط عالي. الحد الأقصى {MAX_FILE_SIZE / 1024 / 1024}
                    MB. الأنواع المدعومة: JPEG, PNG, WebP.
                  </p>
                  {uploadState === "uploading" && <p className="text-xs text-blue-500">جارٍ رفع الصورة...</p>}
                  {uploadState === "processing" && <p className="text-xs text-blue-500">جارٍ معالجة وضغط الصورة...</p>}
                  {uploadState === "success" && (
                    <p className="text-xs font-medium text-green-500">تم تحديث الصورة بنجاح</p>
                  )}
                  {uploadState === "error" && uploadError && (
                    <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <IconAlertCircle className="size-3 shrink-0" />
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm leading-none font-medium">عنوان المشروع</label>
                <Input
                  defaultValue={project.title}
                  placeholder="أدخل عنوان المشروع"
                  className="h-10 bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm leading-none font-medium">اسم المشرف</label>
                <InputGroup className="h-10 bg-background/50">
                  <InputGroupAddon>
                    <IconUser />
                  </InputGroupAddon>
                  <InputGroupInput defaultValue={project.supervisor} placeholder="أدخل اسم مشرف المشروع" />
                </InputGroup>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">رابط المشروع (الخارجي)</label>
              <InputGroup className="h-10 bg-background/50">
                <InputGroupAddon>
                  <IconLink />
                </InputGroupAddon>
                <InputGroupInput
                  type="url"
                  dir="ltr"
                  defaultValue={project.project_external_link || ""}
                  placeholder="https://example.com"
                  className="text-left"
                />
              </InputGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">وصف المشروع</label>
              <Textarea
                defaultValue={project.discription || ""}
                placeholder="أدخل وصفاً تفصيلياً للمشروع"
                className="min-h-[120px] bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="font-heading text-xl">فريق المشروع</CardTitle>
            <CardDescription className="mt-1.5">بيانات الطلاب المشاركين في المشروع.</CardDescription>
          </div>
          <Button type="button" onClick={addMember} variant="outline" size="sm" className="gap-2">
            <IconPlus className="size-4" />
            إضافة عضو
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {members.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">لم يتم إضافة أعضاء للفريق بعد.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="relative rounded-3xl border border-border/50 bg-linear-to-b from-muted/20 to-transparent p-6 shadow-xs backdrop-blur-sm transition-all hover:border-border/80 hover:shadow-md"
                >
                  <div className="absolute end-4 top-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive opacity-70 transition-opacity hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                      onClick={() => removeMember(index)}
                    >
                      <IconTrash className="size-4" />
                      <span className="sr-only">حذف العضو</span>
                    </Button>
                  </div>

                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shadow-inner">
                      {index + 1}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">بيانات العضو</h3>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">الاسم</label>
                      <InputGroup className="h-10 bg-background/60">
                        <InputGroupAddon>
                          <IconUser />
                        </InputGroupAddon>
                        <InputGroupInput defaultValue={member.name} placeholder="اسم الطالب" />
                      </InputGroup>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">الرقم الجامعي</label>
                      <InputGroup className="h-10 bg-background/60">
                        <InputGroupAddon>
                          <IconSchool />
                        </InputGroupAddon>
                        <InputGroupInput defaultValue={member.uni_id} placeholder="الرقم الجامعي" />
                      </InputGroup>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">البريد الإلكتروني الشخصي</label>
                      <InputGroup className="h-10 bg-background/60">
                        <InputGroupAddon>
                          <IconMail />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="email"
                          dir="ltr"
                          defaultValue={member.personal_email || ""}
                          placeholder="email@example.com"
                          className="text-left"
                        />
                      </InputGroup>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">رابط X (تويتر)</label>
                      <InputGroup className="h-10 bg-background/60">
                        <InputGroupAddon>
                          <IconBrandX />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="url"
                          dir="ltr"
                          defaultValue={member.x_url || ""}
                          placeholder="https://x.com/username"
                          className="text-left"
                        />
                      </InputGroup>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">رابط LinkedIn</label>
                      <InputGroup className="h-10 bg-background/60">
                        <InputGroupAddon>
                          <IconBrandLinkedin />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="url"
                          dir="ltr"
                          defaultValue={member.linked_url || ""}
                          placeholder="https://linkedin.com/in/username"
                          className="text-left"
                        />
                      </InputGroup>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">رابط GitHub</label>
                      <InputGroup className="h-10 bg-background/60">
                        <InputGroupAddon>
                          <IconBrandGithub />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="url"
                          dir="ltr"
                          defaultValue={member.github_url || ""}
                          placeholder="https://github.com/username"
                          className="text-left"
                        />
                      </InputGroup>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" size="lg">
          إلغاء
        </Button>
        <Button size="lg">حفظ التغييرات</Button>
      </div>
    </div>
  )
}
