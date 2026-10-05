export const YEAR_MAP: Record<number, string> = {
  2025: "١٤٤٦",
  2026: "١٤٤٨",
}

export const CURRENT_YEAR = 2026

export function toHijri(gregorian: number): string {
  return YEAR_MAP[gregorian] ?? String(gregorian)
}
