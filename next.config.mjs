/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-a6be409c3f9a4835975317cc9adcddef.r2.dev" },
      { protocol: "https", hostname: "pub-323f8fa04e8942cdb4e73a1e57c0ddb1.r2.dev" },
    ],
  },
}

export default nextConfig
