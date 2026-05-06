import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "حفل ختام مشاريع التخرج 2026",
    short_name: "حفل الختام",
    description:
      "حفل ختام الأنشطة ومعرض مشاريع التخرج - موقع لعرض مشاريع التخرج لسنة 2026 ومتابعة اخبار الحفل عن طريق الإشعارات",
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
