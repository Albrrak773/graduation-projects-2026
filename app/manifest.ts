import type { MetadataRoute } from "next"
import { CURRENT_YEAR, toHijri } from "@/lib/years"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `معرض مشاريع كلية الحاسب ${toHijri(CURRENT_YEAR)}`,
    short_name: "معرض الحاسب",
    description: `معرض مشاريع كلية الحاسب - موقع لعرض مشاريع التخرج لسنة ${toHijri(CURRENT_YEAR)} ومتابعة أخبار المعرض عن طريق الإشعارات`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
