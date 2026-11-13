import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Dialog, InputBase, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import SearchOutlined from "@mui/icons-material/SearchOutlined"
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined"
import LightModeOutlined from "@mui/icons-material/LightModeOutlined"
import TranslateOutlined from "@mui/icons-material/TranslateOutlined"
import LogoutOutlined from "@mui/icons-material/LogoutOutlined"
import LabelOutlined from "@mui/icons-material/LabelOutlined"
import { useAuth } from "../auth/AuthContext"
import { useDemo } from "../demo/DemoStore"
import { useI18n } from "../i18n/I18nContext"
import { useColorMode } from "../colorMode"
import { allNavItems } from "./navigation"
import { brand } from "../theme"


const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const PAR_GROUPE = 6

export function Kbd({ children }) {
  return (
    <Box component="kbd" sx={{ px: 0.75, py: 0.1, borderRadius: 1, border: `1px solid ${brand.stoneLight}`, bgcolor: brand.stoneSoft,
      fontFamily: "inherit", fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", lineHeight: 1.6 }}>{children}</Box>
  )
}

export default function CommandMenu({ open, onClose }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useI18n()
  const { mode, toggle } = useColorMode()
  const { db } = useDemo() || {}
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const listRef = useRef(null)

  const groupes = useMemo(() => {
    const f = norm(q.trim())
    const match = (...xs) => !f || xs.some((x) => norm(x).includes(f))
    const go = (path) => () => navigate(path)
    const isAdmin = user?.role === "admin"

    const pages = allNavItems
      .filter((i) => !i.adminOnly || isAdmin)
      .filter((i) => match(t(i.label)))
      .map((i) => ({ id: `p-${i.path}`, label: t(i.label), icon: i.icon, color: i.color, run: go(i.path) }))

    const donnees = !f || !db ? [] : [
      ...(db.termes || []).filter((x) => match(x.label)).slice(0, PAR_GROUPE)
        .map((x) => ({ id: `t-${x.id}`, label: x.label, hint: t("nav.termes"), icon: LabelOutlined, color: "#0ea5e9", run: go("/termes") })),
      ...(db.concepts || []).filter((x) => match(x.prefLabel, x.definition)).slice(0, PAR_GROUPE)
        .map((x) => ({ id: `c-${x.id}`, label: x.prefLabel, hint: t("nav.concepts"), icon: LabelOutlined, color: "#14b8a6", run: go("/concepts") })),
      ...(db.thesauri || []).filter((x) => match(x.nom, x.domaine)).slice(0, PAR_GROUPE)
        .map((x) => ({ id: `th-${x.id}`, label: x.nom, hint: t("nav.thesaurus"), icon: LabelOutlined, color: "#f59e0b", run: go("/thesaurus") })),
    ]

    const actions = [
      { id: "a-mode", label: mode === "dark" ? t("cmd.light") : t("cmd.dark"), icon: mode === "dark" ? LightModeOutlined : DarkModeOutlined, color: "#8b5cf6", run: toggle },
      { id: "a-lang", label: lang === "fr" ? "Switch to English" : "Passer en français", icon: TranslateOutlined, color: "#10b981", run: () => setLang(lang === "fr" ? "en" : "fr") },
      { id: "a-logout", label: t("header.logout"), icon: LogoutOutlined, color: "#f43f5e", run: () => { logout(); navigate("/login") } },
    ].filter((a) => match(a.label))

    return [
      { titre: t("cmd.pages"), items: pages },
      { titre: t("cmd.data"), items: donnees },
      { titre: t("cmd.actions"), items: actions },
    ].filter((g) => g.items.length)
  }, [q, db, t, lang, setLang, mode, toggle, user, logout, navigate])

  const plats = groupes.flatMap((g) => g.items)

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const lancer = (item) => { if (!item) return; onClose(); item.run() }
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, plats.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); lancer(plats[active]) }
  }

  let idx = -1
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      slotProps={{ paper: { sx: { alignSelf: "flex-start", mt: "12vh", overflow: "hidden" } } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2, py: 1.25, borderBottom: `1px solid ${brand.stoneLight}` }}>
        <SearchOutlined sx={{ color: "text.secondary" }} />
        <InputBase autoFocus fullWidth value={q} onChange={(e) => { setQ(e.target.value); setActive(0) }} onKeyDown={onKeyDown}
          placeholder={t("cmd.placeholder")} inputProps={{ "aria-label": t("cmd.placeholder") }} sx={{ fontSize: "0.95rem" }} />
        <Kbd>Esc</Kbd>
      </Box>

      <Box ref={listRef} role="listbox" sx={{ maxHeight: "24rem", overflowY: "auto", py: 1 }}>
        {plats.length === 0 && (
          <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary", fontSize: "0.875rem" }}>{t("cmd.empty")}</Typography>
        )}
        {groupes.map((g) => (
          <Box key={g.titre} sx={{ mb: 0.5 }}>
            <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {g.titre}
            </Typography>
            {g.items.map((item) => {
              idx += 1
              const i = idx
              const Icon = item.icon
              const sel = i === active
              return (
                <Box key={item.id} role="option" aria-selected={sel} data-idx={i}
                  onMouseMove={() => setActive(i)} onClick={() => lancer(item)}
                  sx={{ mx: 1, px: 1.25, py: 0.85, borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1.25, cursor: "pointer",
                    bgcolor: sel ? alpha(item.color, 0.12) : "transparent" }}>
                  <Box sx={{ width: "1.75rem", height: "1.75rem", borderRadius: 1.25, display: "grid", placeItems: "center", flexShrink: 0,
                    bgcolor: alpha(item.color, sel ? 1 : 0.14), color: sel ? "#fff" : item.color }}>
                    <Icon sx={{ fontSize: "1rem" }} />
                  </Box>
                  <Typography sx={{ flex: 1, minWidth: 0, fontSize: "0.875rem", fontWeight: sel ? 600 : 500 }} noWrap>{item.label}</Typography>
                  {item.hint && <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{item.hint}</Typography>}
                  {sel && <Kbd>↵</Kbd>}
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 2, px: 2, py: 1, borderTop: `1px solid ${brand.stoneLight}`, color: "text.secondary", fontSize: "0.75rem", alignItems: "center" }}>
        <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> {t("cmd.navigate")}</span>
        <span><Kbd>↵</Kbd> {t("cmd.open")}</span>
      </Box>
    </Dialog>
  )
}
