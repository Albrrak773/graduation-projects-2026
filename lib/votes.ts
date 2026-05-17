import { CURRENT_YEAR } from "@/lib/years"

export function isVotingYear(year?: number | null) {
  return year === CURRENT_YEAR
}
