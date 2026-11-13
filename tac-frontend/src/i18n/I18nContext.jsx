import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { ToggleButton, ToggleButtonGroup } from "@mui/material"
import { DICT } from "./dict"
import { brand } from "../theme"

const KEY = "tac_lang"
const I18nContext = createContext({ lang: "fr", setLang: () => {}, t: (k) => k })

function initialLang() {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "fr"
  } catch {
    return "fr"
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l) => {
    setLangState(l)
    try {
      localStorage.setItem(KEY, l)
    } catch {
    }
  }, [])

  const t = useCallback(
    (key, vars) => {
      let s = DICT[lang]?.[key] ?? DICT.fr[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v)
      return s
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function LanguageSwitch({ sx }) {
  const { lang, setLang } = useI18n()
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={lang}
      onChange={(_, v) => v && setLang(v)}
      aria-label="Langue / Language"
      sx={{
        bgcolor: "background.paper",
        borderRadius: 999,
        "& .MuiToggleButton-root": { border: 0, borderRadius: 999, px: 1.5, py: 0.4, fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" },
        "& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover": { backgroundColor: brand.accent, color: "#fff" },
        boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
        ...sx,
      }}
    >
      <ToggleButton value="fr" aria-label="Français">FR</ToggleButton>
      <ToggleButton value="en" aria-label="English">EN</ToggleButton>
    </ToggleButtonGroup>
  )
}
