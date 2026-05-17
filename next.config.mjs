/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [45, 60, 65, 75],
    deviceSizes: [360, 414, 640, 768, 1024, 1280],
    imageSizes: [32, 48, 64, 96, 128, 256, 320],
    remotePatterns: [
      { protocol: "https", hostname: "pub-a6be409c3f9a4835975317cc9adcddef.r2.dev" },
      { protocol: "https", hostname: "pub-323f8fa04e8942cdb4e73a1e57c0ddb1.r2.dev" },
    ],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ]
  },
}

export default nextConfig
