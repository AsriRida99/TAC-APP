import { alpha, createTheme } from "@mui/material/styles"

export const neutral = {
  light: {
    accentSoft: "#eef2ff",
    stone: "#94a3b8",
    stoneLight: "#e2e8f0",
    stoneSoft: "#f8fafc",
    slate: "#64748b",
    ink: "#0f172a",
    bg: "#f5f7fb",
    paper: "#ffffff",
    sidebar: "#f5f7ff",
    cocoa: "#475569",
  },
  dark: {
    accentSoft: "#1e1b4b",
    stone: "#64748b",
    stoneLight: "#262f40",
    stoneSoft: "#111827",
    slate: "#94a3b8",
    ink: "#e2e8f0",
    bg: "#0b1020",
    paper: "#111827",
    sidebar: "#0d1324",
    cocoa: "#cbd5e1",
  },
}

export const cssVars = (mode) =>
  Object.fromEntries(Object.entries(neutral[mode]).map(([k, v]) => [`--tac-${k}`, v]))

const v = (k) => `var(--tac-${k})`

export const brand = {
  accent: "#6366f1",
  accentDark: "#4f46e5",
  accentSoft: v("accentSoft"),
  stone: v("stone"),
  stoneLight: v("stoneLight"),
  stoneSoft: v("stoneSoft"),
  slate: v("slate"),
  ink: v("ink"),
  bg: v("bg"),
  paper: v("paper"),
  sidebar: v("sidebar"),
  danger: "#e11d48",
  ok: "#059669",
  warn: "#d97706",
  red: "#f43f5e",
  cocoa: v("cocoa"),
}

export const gradient = {
  primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  rainbow: "linear-gradient(90deg, #6366f1 0%, #0ea5e9 35%, #14b8a6 65%, #f59e0b 100%)",
}

export const viz = {
  indigo: "#6366f1",
  teal: "#14b8a6",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
  emerald: "#10b981",
  orange: "#f97316",
}

export const chartColors = [viz.indigo, viz.teal, viz.amber, viz.rose, viz.sky, viz.violet, viz.emerald, viz.orange]

const sans = '"Inter", "Segoe UI", Arial, sans-serif'

const solid = (main) => ({
  backgroundImage: `linear-gradient(135deg, ${main} 0%, ${alpha(main, 0.82)} 100%)`,
  backgroundColor: main,
  color: "#fff",
  fontWeight: 600,
  "& .MuiChip-icon, & .MuiChip-deleteIcon, & .MuiSvgIcon-root": { color: "#fff" },
})
const CHIP_GRADIENTS = { primary: gradient.primary }

export function makeTheme(mode = "light") {
  const n = neutral[mode]
  const dark = mode === "dark"
  return createTheme({
    palette: {
      mode,
      primary: { main: brand.accent, dark: brand.accentDark, contrastText: "#fff" },
      secondary: { main: "#8b5cf6", contrastText: "#fff" },
      error: { main: brand.danger, contrastText: "#fff" },
      success: { main: brand.ok, contrastText: "#fff" },
      warning: { main: brand.warn, contrastText: "#fff" },
      info: { main: "#0ea5e9", contrastText: "#fff" },
      background: { default: n.bg, paper: n.paper },
      text: { primary: n.ink, secondary: n.slate },
      divider: n.stoneLight,
      action: { hover: alpha(brand.accent, dark ? 0.12 : 0.06), selected: alpha(brand.accent, dark ? 0.2 : 0.1) },
    },
    spacing: (factor) => `${0.5 * factor}rem`,
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: sans,
      fontSize: 14,
      h3: { fontWeight: 700, letterSpacing: "-0.01em" },
      h4: { fontWeight: 700, fontSize: "2rem", lineHeight: 1.2, letterSpacing: "-0.02em" },
      h5: { fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700, letterSpacing: "-0.01em" },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
      button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
      overline: { fontWeight: 700, letterSpacing: "0.12em" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": { ...cssVars(mode), colorScheme: mode },
          body: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", fontFeatureSettings: '"tnum" 1, "cv11" 1' },
          ":focus-visible": { outline: `2px solid ${brand.accent}`, outlineOffset: 2 },
          "button, [role=button], a, .MuiChip-clickable, .MuiTableRow-hover": { cursor: "pointer" },
          "@media (prefers-reduced-motion: reduce)": { "*": { animationDuration: "0.01ms !important", transitionDuration: "0.01ms !important" } },
          "::selection": { background: alpha(brand.accent, 0.25) },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${n.stoneLight}`,
            boxShadow: dark ? "0 1px 2px rgba(0,0,0,0.4)" : "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -14px rgba(99,102,241,0.25)",
            transition: "box-shadow .2s ease, transform .2s ease",
          },
        },
      },
      MuiCardContent: { styleOverrides: { root: { padding: "1.5rem", "&:last-child": { paddingBottom: "1.5rem" } } } },
      MuiAppBar: { defaultProps: { elevation: 0 } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        variants: [
          { props: { variant: "contained" }, style: { color: "#fff", "&:hover": { color: "#fff" } } },
          { props: { variant: "contained", color: "primary" }, style: { backgroundImage: gradient.primary, boxShadow: "0 6px 16px -6px rgba(99,102,241,0.6)", "&:hover": { boxShadow: "0 8px 20px -6px rgba(99,102,241,0.7)" } } },
        ],
        styleOverrides: {
          root: { borderRadius: 8, paddingInline: "1.1rem" },
          sizeLarge: { paddingBlock: "0.7rem", paddingInline: "1.75rem", fontSize: "0.95rem" },
          outlined: { borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } },
          outlinedInherit: { borderColor: n.stoneLight },
        },
      },
      MuiIconButton: { styleOverrides: { root: { "&:hover": { backgroundColor: alpha(brand.accent, 0.1) } } } },
      MuiChip: {
        styleOverrides: {
          root: ({ ownerState, theme }) => {
            const { variant = "filled", color = "default" } = ownerState
            if (variant === "outlined") {
              return color === "default"
                ? { borderRadius: 8, fontWeight: 500, borderColor: n.stoneLight }
                : { borderRadius: 8, fontWeight: 600, borderColor: alpha(theme.palette[color].main, 0.6), color: dark ? theme.palette[color].light : theme.palette[color].dark }
            }
            if (color === "default") return { borderRadius: 8, fontWeight: 500, backgroundColor: n.accentSoft, color: n.ink }
            return { borderRadius: 8, ...solid(theme.palette[color].main), ...(CHIP_GRADIENTS[color] ? { backgroundImage: CHIP_GRADIENTS[color] } : {}),
              "&.MuiChip-clickable:hover": { filter: "brightness(1.08)" } }
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            color: dark ? "#a5b4fc" : brand.accentDark, backgroundColor: n.accentSoft, borderBottom: `1px solid ${n.stoneLight}`,
          },
          root: { borderBottom: `1px solid ${alpha(n.stoneLight, 0.8)}` },
          sizeSmall: { paddingBlock: "0.6rem" },
        },
      },
      MuiTableRow: { styleOverrides: { root: { "&.MuiTableRow-hover:hover": { backgroundColor: alpha(brand.accent, dark ? 0.08 : 0.04) } } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10, backgroundColor: n.paper,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: n.stoneLight },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: n.stone },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 999, backgroundColor: dark ? "#1f2937" : "#eef0f4" }, bar: { borderRadius: 999, backgroundImage: "linear-gradient(90deg, #6366f1, #14b8a6)" } },
      },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3, backgroundImage: "linear-gradient(90deg, #6366f1, #14b8a6)" } } },
      MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12 },
          standardInfo: { backgroundColor: n.accentSoft, color: n.ink, "& .MuiAlert-icon": { color: brand.accent } },
        },
      },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 12, border: `1px solid ${n.stoneLight}` } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: 10, border: `1px solid ${n.stoneLight}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" } } },
      MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: dark ? "#334155" : n.ink, color: "#fff", fontSize: "0.75rem", borderRadius: 8 } } },
    },
  })
}

export default makeTheme("light")
