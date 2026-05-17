"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
  IconAlertTriangle,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { requestProjectImageUpload, processProjectImage } from "@/app/admin/projects/actions"
import { updateProject } from "@/app/projects/edit/[signature]/actions"
import { projectEditSchema, type ProjectEditFormData } from "@/lib/project-edit-schema"
import type { Project } from "@/db/types"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

type UploadState = "idle" | "uploading" | "processing" | "success" | "error"

export function EditProjectForm({ project }: { project: Project }) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(project.image_thumb_url || project.image_url || null)
  const [currentImageUrl, setCurrentImageUrl] = useState(project.image_thumb_url || project.image_url || null)
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProjectEditFormData>({
    resolver: zodResolver(projectEditSchema),
    defaultValues: {
      title: project.title,
      supervisor: project.supervisor,
      discription: project.discription || "",
      project_external_link: project.project_external_link || "",
      members: (project.participants || []).map((p) => ({
        name: p.name,
        uni_id: p.uni_id,
        x_url: p.x_url || "",
        linked_url: p.linked_url || "",
        github_url: p.github_url || "",
        personal_email: p.personal_email || "",
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  })

  const {
    formState: { isDirty, isSubmitting },
  } = form

  const hasChanges = isDirty || uploadState === "success"

  async function onSubmit(data: ProjectEditFormData) {
    setSubmitState("submitting")
    setSubmitError(null)

    try {
      const result = await updateProject(project.signature!, data)

      if ("error" in result) {
        setSubmitState("error")
        setSubmitError(result.error ?? "فشل في حفظ التغييرات")
        return
      }

      setSubmitState("success")
      form.reset(data)
      setTimeout(() => setSubmitState("idle"), 3000)
    } catch {
      setSubmitState("error")
      setSubmitError("حدث خطأ غير متوقع")
    }
  }

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      } catch {
        setUploadState("error")
        setUploadError("حدث خطأ غير متوقع أثناء رفع الصورة")
        URL.revokeObjectURL(localPreview)
      }
    },
    [project.id]
  )

  const displayImageUrl = currentImageUrl || previewUrl

  const confirmDeleteMember = (index: number) => {
    setPendingDeleteIndex(index)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (pendingDeleteIndex !== null) {
      remove(pendingDeleteIndex)
      setPendingDeleteIndex(null)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="size-5" />
              تأكيد حذف العضو
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا العضو من الفريق؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">البيانات الأساسية</CardTitle>
            <CardDescription>المعلومات الرئيسية للمشروع.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">صورة المشروع</label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="group relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted/50">
                  {displayImageUrl ? (
                    <>
                      <Image
                        src={displayImageUrl}
                        alt={project.title}
                        fill
                        sizes="144px"
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
                  <p className="text-xs text-muted-foreground">
                    الحد الأقصى {MAX_FILE_SIZE / 1024 / 1024}MB
                    <br />
                    الصيغ المدعومة: JPEG, PNG
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

            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">عنوان المشروع</label>
              <Controller
                name="title"
                control={form.control}
                render={({ field }) => (
                  <Input {...field} dir="auto" placeholder="أدخل عنوان المشروع" className="h-10 bg-background/50" />
                )}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">اسم المشرف</label>
              <Controller
                name="supervisor"
                control={form.control}
                render={({ field }) => (
                  <InputGroup className="h-10 bg-background/50">
                    <InputGroupAddon>
                      <IconUser />
                    </InputGroupAddon>
                    <InputGroupInput {...field} dir="auto" placeholder="أدخل اسم مشرف المشروع" />
                  </InputGroup>
                )}
              />
              {form.formState.errors.supervisor && (
                <p className="text-xs text-destructive">{form.formState.errors.supervisor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">
                رابط المشروع (الخارجي) <span className="font-normal text-muted-foreground">— اختياري</span>
              </label>
              <Controller
                name="project_external_link"
                control={form.control}
                render={({ field }) => (
                  <InputGroup className="h-10 bg-background/50">
                    <InputGroupAddon>
                      <IconLink />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      type="url"
                      dir="ltr"
                      placeholder="https://example.com"
                      className="text-left"
                    />
                  </InputGroup>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">وصف المشروع</label>
              <Controller
                name="discription"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    dir="auto"
                    placeholder="أدخل وصفاً تفصيلياً للمشروع"
                    className="min-h-[120px] bg-background/50"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="font-heading text-xl">فريق المشروع</CardTitle>
              <CardDescription className="mt-1.5">بيانات الطلاب المشاركين في المشروع.</CardDescription>
            </div>
            <Button
              type="button"
              onClick={() =>
                append({
                  name: "",
                  uni_id: "",
                  x_url: "",
                  linked_url: "",
                  github_url: "",
                  personal_email: "",
                })
              }
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <IconPlus className="size-4" />
              إضافة عضو
            </Button>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">لم يتم إضافة أعضاء للفريق بعد.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="relative rounded-3xl border border-border/50 bg-linear-to-b from-muted/20 to-transparent p-6 shadow-xs backdrop-blur-sm transition-all hover:border-border/80 hover:shadow-md"
                  >
                    <div className="absolute end-4 top-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive opacity-70 transition-opacity hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                        onClick={() => confirmDeleteMember(index)}
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
                        <Controller
                          name={`members.${index}.name`}
                          control={form.control}
                          render={({ field: memberField }) => (
                            <InputGroup className="h-10 bg-background/60">
                              <InputGroupAddon>
                                <IconUser />
                              </InputGroupAddon>
                              <InputGroupInput {...memberField} dir="auto" placeholder="اسم الطالب" />
                            </InputGroup>
                          )}
                        />
                        {form.formState.errors.members?.[index]?.name && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.members[index].name?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">الرقم الجامعي</label>
                        <Controller
                          name={`members.${index}.uni_id`}
                          control={form.control}
                          render={({ field: memberField }) => (
                            <InputGroup className="h-10 bg-background/60">
                              <InputGroupAddon>
                                <IconSchool />
                              </InputGroupAddon>
                              <InputGroupInput
                                {...memberField}
                                dir="ltr"
                                placeholder="الرقم الجامعي"
                                className="text-left"
                              />
                            </InputGroup>
                          )}
                        />
                        {form.formState.errors.members?.[index]?.uni_id && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.members[index].uni_id?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">البريد الإلكتروني الشخصي</label>
                        <Controller
                          name={`members.${index}.personal_email`}
                          control={form.control}
                          render={({ field: memberField }) => (
                            <InputGroup className="h-10 bg-background/60">
                              <InputGroupAddon>
                                <IconMail />
                              </InputGroupAddon>
                              <InputGroupInput
                                {...memberField}
                                type="email"
                                dir="ltr"
                                placeholder="email@example.com"
                                className="text-left"
                              />
                            </InputGroup>
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">رابط X (تويتر)</label>
                        <Controller
                          name={`members.${index}.x_url`}
                          control={form.control}
                          render={({ field: memberField }) => (
                            <InputGroup className="h-10 bg-background/60">
                              <InputGroupAddon>
                                <IconBrandX />
                              </InputGroupAddon>
                              <InputGroupInput
                                {...memberField}
                                type="url"
                                dir="ltr"
                                placeholder="https://x.com/username"
                                className="text-left"
                              />
                            </InputGroup>
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">رابط LinkedIn</label>
                        <Controller
                          name={`members.${index}.linked_url`}
                          control={form.control}
                          render={({ field: memberField }) => (
                            <InputGroup className="h-10 bg-background/60">
                              <InputGroupAddon>
                                <IconBrandLinkedin />
                              </InputGroupAddon>
                              <InputGroupInput
                                {...memberField}
                                type="url"
                                dir="ltr"
                                placeholder="https://linkedin.com/in/username"
                                className="text-left"
                              />
                            </InputGroup>
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">رابط GitHub</label>
                        <Controller
                          name={`members.${index}.github_url`}
                          control={form.control}
                          render={({ field: memberField }) => (
                            <InputGroup className="h-10 bg-background/60">
                              <InputGroupAddon>
                                <IconBrandGithub />
                              </InputGroupAddon>
                              <InputGroupInput
                                {...memberField}
                                type="url"
                                dir="ltr"
                                placeholder="https://github.com/username"
                                className="text-left"
                              />
                            </InputGroup>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-4">
        {submitState === "success" && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-green-500">
            <IconCircleCheck className="size-4" />
            تم الحفظ بنجاح
          </p>
        )}
        {submitState === "error" && submitError && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <IconAlertCircle className="size-4" />
            {submitError}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!hasChanges || isSubmitting || submitState === "submitting"}
        >
          {submitState === "submitting" ? (
            <>
              <IconLoader2 className="size-4 animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            "حفظ التغييرات"
          )}
        </Button>
      </div>
    </form>
  )
}
