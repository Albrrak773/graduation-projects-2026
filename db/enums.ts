export const COLLEDGE_LABELS: Record<string, string> = {
  CS: "علوم الحاسب",
  IT: "تقنية المعلومات",
  COE: "هندسة الحاسب",
}

export const COLLEDGE_VALUES = ["CS", "IT", "COE"] as const

export const SECTION_LABELS: Record<string, string> = {
  male: "طلاب",
  female: "طالبات",
}

export const SECTION_VALUES = ["male", "female"] as const

export const COLLEDGE_COLORS: Record<string, string> = {
  CS: "bg-[#0097a7]/10 text-[#0097a7] dark:bg-[#0097a7]/20 dark:text-[#4dd0e1]",
  IT: "bg-[#4285f4]/10 text-[#4285f4] dark:bg-[#4285f4]/20 dark:text-[#90caf9]",
  COE: "bg-[#0d2b6b]/10 text-[#0d2b6b] dark:bg-[#0d2b6b]/20 dark:text-[#7986cb]",
}

export const ADMIN_ROLE_VALUES = ["super_admin", "project_owner"] as const

export const ADMIN_ROLE_LABELS: Record<string, string> = {
  super_admin: "مشرف عام",
  project_owner: "مالك المشروع",
}