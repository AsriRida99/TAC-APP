import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  AppBar, Box, ButtonBase, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip, Typography,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import LogoutOutlined from "@mui/icons-material/LogoutOutlined"
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined"
import FormatSizeOutlined from "@mui/icons-material/FormatSizeOutlined"
import CheckOutlined from "@mui/icons-material/CheckOutlined"
import MenuOpenOutlined from "@mui/icons-material/MenuOpenOutlined"
import SearchOutlined from "@mui/icons-material/SearchOutlined"
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined"
import LightModeOutlined from "@mui/icons-material/LightModeOutlined"
import { useColorMode } from "../colorMode"
import { Kbd } from "./CommandMenu"
import { brand } from "../theme"
import { DISPLAY_SIZES, getDisplaySize, setDisplaySize } from "../utils/displaySize"
import { alpha } from "@mui/material/styles"
import { gradient } from "../theme"
import { useAuth } from "../auth/AuthContext"
import { allNavItems } from "./navigation"
import UserAvatar from "./UserAvatar"
import ProfileDialog from "./ProfileDialog"
import { LanguageSwitch, useI18n } from "../i18n/I18nContext"

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "")

export default function Header({ onMenuClick, collapsed, onToggleCollapsed, onSearch }) {
  const { mode, toggle } = useColorMode()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sizeAnchor, setSizeAnchor] = useState(null)
  const [size, setSize] = useState(getDisplaySize)

  const current = allNavItems.find((i) => i.path === pathname)

  return (
    <AppBar position="sticky" color="inherit" sx={{ bgcolor: (th) => alpha(th.palette.background.paper, 0.88), backdropFilter: "blur(8px)", borderBottom: "1px solid", borderBottomColor: "divider", boxShadow: "none", "&::before": { content: '""', position: "absolute", inset: "0 0 auto 0", height: 3, background: gradient.rainbow } }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <IconButton edge="start" onClick={onMenuClick} sx={{ display: { md: "none" } }} aria-label="Ouvrir le menu">
          <MenuIcon />
        </IconButton>
        <Tooltip title={collapsed ? t("header.expand") : t("header.collapse")}>
          <IconButton edge="start" onClick={onToggleCollapsed} sx={{ display: { xs: "none", md: "inline-flex" } }} aria-label={collapsed ? t("header.expand") : t("header.collapse")}>
            <MenuOpenOutlined sx={{ transform: collapsed ? "scaleX(-1)" : "none", transition: "transform .2s ease" }} />
          </IconButton>
        </Tooltip>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, minWidth: 0 }}>
          {current && (
            <Box sx={{ width: "2.25rem", height: "2.25rem", borderRadius: 2, display: "grid", placeItems: "center", color: "#fff", flexShrink: 0,
              background: `linear-gradient(135deg, ${current.color}, ${current.color}bb)`, boxShadow: `0 6px 14px -6px ${current.color}` }}>
              <current.icon fontSize="small" />
            </Box>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 0 }} noWrap>
            {current ? t(current.label) : ""}
          </Typography>
        </Box>


        <ButtonBase onClick={onSearch} aria-label={t("cmd.placeholder")}
          sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1, px: 1.5, py: 0.75, minWidth: { sm: "12rem", lg: "16rem" },
            borderRadius: 2, border: `1px solid ${brand.stoneLight}`, bgcolor: brand.stoneSoft, color: "text.secondary", fontSize: "0.85rem",
            "&:hover": { borderColor: "primary.main", color: "text.primary" } }}>
          <SearchOutlined sx={{ fontSize: "1.1rem" }} />
          <Box component="span" sx={{ flex: 1, textAlign: "left" }}>{t("cmd.search")}</Box>
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd><Kbd>K</Kbd>
        </ButtonBase>
        <IconButton onClick={onSearch} sx={{ display: { xs: "inline-flex", sm: "none" } }} aria-label={t("cmd.placeholder")}>
          <SearchOutlined />
        </IconButton>

        <LanguageSwitch />

        <Tooltip title={mode === "dark" ? t("cmd.light") : t("cmd.dark")}>
          <IconButton onClick={toggle} aria-label={mode === "dark" ? t("cmd.light") : t("cmd.dark")}>
            {mode === "dark" ? <LightModeOutlined sx={{ color: "#f59e0b" }} /> : <DarkModeOutlined sx={{ color: "#6366f1" }} />}
          </IconButton>
        </Tooltip>

        <Tooltip title={t("header.size")}>
          <IconButton onClick={(e) => setSizeAnchor(e.currentTarget)} aria-label={t("header.size")}>
            <FormatSizeOutlined />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={sizeAnchor}
          open={Boolean(sizeAnchor)}
          onClose={() => setSizeAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Typography sx={{ px: 2, py: 0.75, fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>{t("header.size")}</Typography>
          <Typography sx={{ px: 2, pb: 0.75, fontSize: "0.75rem", color: "text.secondary" }}>
            {t("header.sizeInfo", { w: window.innerWidth, f: parseFloat(getComputedStyle(document.documentElement).fontSize) })}
          </Typography>
          {DISPLAY_SIZES.map((o) => (
            <MenuItem key={o.value} selected={size === o.value} onClick={() => { setDisplaySize(o.value); setSize(o.value); setSizeAnchor(null) }}>
              <ListItemIcon>{size === o.value && <CheckOutlined fontSize="small" />}</ListItemIcon>
              {t(`size.${o.value}`)}{<Typography component="span" sx={{ ml: 1, color: "text.secondary", fontSize: "0.8rem" }}>{o.value} %</Typography>}
            </MenuItem>
          ))}
        </Menu>

        <ButtonBase
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ borderRadius: 3, px: 1, py: 0.5, gap: 1.25, "&:hover": { bgcolor: "action.hover" } }}
        >
          <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.2 }}>{user?.nom}</Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textTransform: "capitalize" }}>
              {user?.role}
            </Typography>
          </Box>
          <UserAvatar user={user} size={40} />
        </ButtonBase>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>{user?.nom}</Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchor(null); setProfileOpen(true) }}>
            <ListItemIcon><PhotoCameraOutlined fontSize="small" /></ListItemIcon>
            {t("header.profile")}
          </MenuItem>
          <MenuItem onClick={() => { logout(); navigate("/login") }}>
            <ListItemIcon><LogoutOutlined fontSize="small" /></ListItemIcon>
            {t("header.logout")}
          </MenuItem>
        </Menu>

        {profileOpen && <ProfileDialog open onClose={() => setProfileOpen(false)} />}
      </Toolbar>
    </AppBar>
  )
}
