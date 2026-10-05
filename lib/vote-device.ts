const BROWSERS: [RegExp, string][] = [
  [/EdgA?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/FxiOS\/|Firefox\//, "Firefox"],
  [/CriOS\/|Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
]

const PLATFORMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Macintosh/, "Mac"],
  [/Windows/, "Windows"],
  [/Linux|X11/, "Linux"],
]

/** Collapses a user agent into a short "platform · browser" label, e.g. "iPhone · Safari". */
export function describeDevice(userAgent: string | null | undefined) {
  if (!userAgent) return null
  const platform = PLATFORMS.find(([pattern]) => pattern.test(userAgent))?.[1]
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1]
  if (!platform && !browser) return null
  return formatDevice(platform, browser)
}

export function formatDevice(platform: string | null | undefined, browser: string | null | undefined) {
  return `${platform || "غير معروف"} · ${browser || "غير معروف"}`
}
