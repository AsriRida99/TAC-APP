import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { Box, Drawer } from "@mui/material"
import Sidebar from "./Sidebar"
import Header from "./Header"
import CommandMenu from "./CommandMenu"
import { useI18n } from "../i18n/I18nContext"

export const SIDEBAR_WIDTH = "17.5rem"
export const SIDEBAR_COLLAPSED = "4.75rem"
const KEY = "tac-sidebar-collapsed"

function readCollapsed() {
  try { return localStorage.getItem(KEY) === "1" } catch { return false }
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [searchOpen, setSearchOpen] = useState(false)
  const { t } = useI18n()
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(KEY, next ? "1" : "0") } catch { return }
  }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      <Box component="nav" sx={{ width: { md: width }, flexShrink: { md: 0 }, transition: "width .2s ease" }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, border: 0 } }}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width, border: 0, transition: "width .2s ease", overflowX: "hidden" } }}
        >
          <Sidebar collapsed={collapsed} />
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Header
          onMenuClick={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onSearch={() => setSearchOpen(true)}
        />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
        <Box
          component="footer"
          sx={{
            px: { xs: 2, md: 3 }, py: 2, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", alignItems: "center",
            bgcolor: "background.paper", borderTop: "1px solid", borderTopColor: "divider", color: "text.secondary", fontSize: "0.78rem",
          }}
        >
          <span>{t("footer.copyright", { y: new Date().getFullYear() })}</span>
        </Box>
      </Box>

      {searchOpen && <CommandMenu open onClose={() => setSearchOpen(false)} />}
    </Box>
  )
}
