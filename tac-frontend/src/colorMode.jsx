import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { CssBaseline, ThemeProvider } from "@mui/material"
import { makeTheme } from "./theme"

const KEY = "tac-color-mode"
const ColorModeContext = createContext({ mode: "light", pref: "system", setPref: () => {} })

function readPref() {
  try {
    const p = localStorage.getItem(KEY)
    return p === "light" || p === "dark" ? p : "system"
  } catch {
    return "system"
  }
}

const media = () => window.matchMedia?.("(prefers-color-scheme: dark)")

export function ColorModeProvider({ children }) {
  const [pref, setPrefState] = useState(readPref)
  const [systemDark, setSystemDark] = useState(() => Boolean(media()?.matches))

  useEffect(() => {
    const m = media()
    if (!m) return
    const on = (e) => setSystemDark(e.matches)
    m.addEventListener("change", on)
    return () => m.removeEventListener("change", on)
  }, [])

  const setPref = useCallback((p) => {
    setPrefState(p)
    try { localStorage.setItem(KEY, p) } catch { return }
  }, [])

  const mode = pref === "system" ? (systemDark ? "dark" : "light") : pref
  const theme = useMemo(() => makeTheme(mode), [mode])
  const value = useMemo(() => ({ mode, pref, setPref, toggle: () => setPref(mode === "dark" ? "light" : "dark") }), [mode, pref, setPref])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  return useContext(ColorModeContext)
}
