import { NavLink } from "react-router-dom"
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { brand } from "../theme"
import { navigation } from "./navigation"
import { useAuth } from "../auth/AuthContext"
import { useI18n } from "../i18n/I18nContext"

export default function Sidebar({ onNavigate, collapsed = false }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const isAdmin = user?.role === "admin"
  return (
    <Box
      sx={{
        height: "100%", display: "flex", flexDirection: "column", overflowX: "hidden",
        background: `linear-gradient(180deg, ${brand.paper} 0%, ${brand.sidebar} 100%)`, color: brand.ink, borderRight: `1px solid ${brand.stoneLight}`,
      }}
    >
      <Box sx={{ px: collapsed ? 1 : 2.5, pt: 2.5, pb: 2, borderBottom: `1px solid ${brand.stoneLight}`, textAlign: "center" }}>
        <Box
          component="img"
          src="/logo-espadon-transparent.png"
          alt="ESPADON"
          sx={{ height: collapsed ? "2.75rem" : "6.875rem", maxWidth: "100%", display: "block", mx: "auto", objectFit: "contain", transition: "height .2s ease" }}
        />
        {!collapsed && (
          <Typography sx={{ mt: 1, fontSize: "0.75rem", color: brand.slate, letterSpacing: 0.3 }}>
            {t("app.subtitle")}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1 }}>
        {navigation.map((group) => (
          <Box key={group.section} sx={{ mb: 1 }}>
            {collapsed ? (
              <Box sx={{ mx: 2, my: 1.25, borderTop: `1px solid ${brand.stoneLight}` }} />
            ) : (
              <Typography
                variant="overline"
                sx={{ px: 3, pt: 1.5, display: "block", color: brand.stone, fontWeight: 700, fontSize: "0.6875rem", letterSpacing: 1.2 }}
              >
                {t(group.section)}
              </Typography>
            )}
            <List dense disablePadding>
              {group.items.filter((i) => !i.adminOnly || isAdmin).map(({ path, label, icon: Icon, color, wip }) => (
                <Tooltip key={path} title={collapsed ? (wip ? `${t(label)} · ${t("wip.short")}` : t(label)) : ""} placement="right" arrow>
                  <ListItemButton
                    component={NavLink}
                    to={path}
                    end={path === "/"}
                    onClick={onNavigate}
                    aria-label={t(label)}
                    sx={{
                      mx: collapsed ? 1 : 1.5,
                      my: 0.25,
                      borderRadius: 2,
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 1 : 2,
                      color: brand.slate,
                      "& .MuiListItemIcon-root": { color, minWidth: collapsed ? 0 : "2.375rem" },
                      "&:hover": { bgcolor: alpha(color, 0.1), color: brand.ink },
                      "&.active": {
                        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.75)} 100%)`,
                        color: "#fff",
                        boxShadow: `0 6px 14px -6px ${alpha(color, 0.8)}`,
                        "& .MuiListItemIcon-root": { color: "#fff" },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={t(label)} slotProps={{ primary: { fontSize: "0.875rem", fontWeight: 500, noWrap: true } }} />}
                    {!collapsed && wip && (
                      <Box component="span" sx={{ ml: 0.5, px: 0.75, py: 0.1, borderRadius: 1, fontSize: "0.625rem", fontWeight: 700, whiteSpace: "nowrap",
                        bgcolor: "#f59e0b", color: "#fff", ".active &": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                        {t("wip.short")}
                      </Box>
                    )}
                    {collapsed && wip && (
                      <Box component="span" sx={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", bgcolor: "#f59e0b" }} />
                    )}
                  </ListItemButton>
                </Tooltip>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {!collapsed && (
        <Box sx={{ px: 2, py: 2, borderTop: `1px solid ${brand.stoneLight}`, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="img"
            src="/logo-fsp-transparent.png"
            alt="Fondation des Sciences du Patrimoine"
            sx={{ height: "6rem", flexShrink: 0, objectFit: "contain" }}
          />
          <Typography sx={{ fontSize: "0.6875rem", color: brand.slate, lineHeight: 1.4 }}>
            {t("app.fsp")}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
