import type { ReactNode } from "react"

type ThemeProviderProps = {
  children: ReactNode
}

function ThemeProvider({ children }: ThemeProviderProps) {
  return children
}

export { ThemeProvider }
