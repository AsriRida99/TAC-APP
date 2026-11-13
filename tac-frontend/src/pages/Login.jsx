import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import {
  Alert, Box, Button, Card, CardContent, Stack, Tab, Tabs, TextField, Typography,
} from "@mui/material"
import { useAuth } from "../auth/AuthContext"
import { DEMO_AUTH } from "../config"
import { DEMO_ACCOUNT } from "../demo/authMock"
import { alpha } from "@mui/material/styles"
import { brand, cssVars } from "../theme"
import UserAvatar from "../layout/UserAvatar"
import { fileToAvatar } from "../layout/avatarImage"
import { LanguageSwitch, useI18n } from "../i18n/I18nContext"

export default function Login() {
  const { user, login, register } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState("login")
  const [form, setForm] = useState({ nom: "", email: "", password: "", avatar: null, organisation: "", motif: "" })
  const [info, setInfo] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={location.state?.from || "/"} replace />

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function pickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setForm({ ...form, avatar: await fileToAvatar(file) })
    } catch (err) {
      setError(err.message)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError("")
    setInfo("")
    setSubmitting(true)
    try {
      if (mode === "login") {
        await login(form.email, form.password)
        navigate(location.state?.from || "/", { replace: true })
      } else {
        const r = await register(form)
        if (r.pending) {
          setInfo(t("login.pending"))
          setMode("login")
          setForm({ ...form, password: "" })
        } else {
          navigate("/", { replace: true })
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      <Box
        sx={{
          flex: { md: "0 0 45%" },
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: 6,
          ...cssVars("light"),
          color: brand.ink,
          position: "relative",
          overflow: "hidden",
          zIndex: 1,
          background: "radial-gradient(110% 85% at 30% 25%, #ffffff 0%, #eef2ff 45%, #e0e7ff 75%, #ccfbf1 100%)",
          boxShadow: "18px 0 48px rgba(0,0,0,0.25)",
          "@keyframes flotter": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
          "@media (prefers-reduced-motion: reduce)": { "& *": { animation: "none !important" } },
        }}
      >
        <Box aria-hidden sx={{ position: "absolute", width: "26rem", height: "26rem", borderRadius: "50%", top: "-8rem", right: "-9rem", background: "radial-gradient(circle at 35% 35%, #c7d2fe, #6366f1 60%, #312e81)", opacity: 0.3, boxShadow: "inset -30px -30px 60px rgba(0,0,0,0.35)", animation: "flotter 9s ease-in-out infinite" }} />
        <Box aria-hidden sx={{ position: "absolute", width: "9rem", height: "9rem", borderRadius: "50%", bottom: "2.5rem", right: "-2rem", background: "radial-gradient(circle at 35% 35%, #fecdd3, #f43f5e 60%, #881337)", opacity: 0.4, boxShadow: "inset -18px -18px 36px rgba(0,0,0,0.4)", animation: "flotter 7s ease-in-out infinite reverse" }} />
        <Box aria-hidden sx={{ position: "absolute", width: "16rem", height: "16rem", borderRadius: "50%", bottom: "-10rem", left: "-8rem", background: "radial-gradient(circle at 40% 40%, #99f6e4, #14b8a6 65%, #134e4a)", opacity: 0.25, boxShadow: "inset -24px -24px 48px rgba(0,0,0,0.35), 0 20px 40px rgba(0,0,0,0.15)" }} />

        <Box
          component="img"
          src="/logo-espadon-transparent.png"
          alt="ESPADON"
          sx={{
            height: { md: "12rem", xl: "14rem" }, maxWidth: "92%", objectFit: "contain", alignSelf: "center", position: "relative",
            filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.28))", animation: "flotter 8s ease-in-out infinite",
          }}
        />
        <Box sx={{ maxWidth: "30rem", position: "relative" }}>
          <Box sx={{ width: "3.5rem", height: "0.25rem", background: "linear-gradient(90deg, #6366f1, #0ea5e9, #14b8a6, #f59e0b)", borderRadius: 2, mb: 3 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.15, background: "linear-gradient(90deg, #0f172a 0%, #4f46e5 70%, #8b5cf6 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            {t("login.title")}
          </Typography>
          <Typography sx={{ color: "#334155", lineHeight: 1.7 }}>
            {t("login.pitch")}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.8125rem", color: "#334155", position: "relative" }}>
          {t("login.footer")}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1, display: "grid", placeItems: "center", p: 2, position: "relative",
          backgroundImage: "linear-gradient(160deg, rgba(49,46,129,0.35) 0%, rgba(15,23,42,0.6) 100%), url(/login-bg.jpg)",
          backgroundSize: "cover", backgroundPosition: "center 40%",
        }}
      >
        <LanguageSwitch sx={{ position: "absolute", top: 20, right: 20 }} />
        <Card sx={{ width: "100%", maxWidth: "30rem", bgcolor: (th) => alpha(th.palette.background.paper, 0.93), backdropFilter: "blur(10px)", border: 0, boxShadow: "0 30px 70px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.2)" }}>
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              {mode === "login" ? t("login.connexion") : t("login.createAccount")}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mb: 2 }}>
              {t("login.access")}
            </Typography>

            <Tabs value={mode} onChange={(_, v) => { setMode(v); setError(""); setInfo("") }} sx={{ mb: 3 }} variant="fullWidth">
              <Tab value="login" label={t("login.tabLogin")} />
              <Tab value="register" label={t("login.tabRegister")} />
            </Tabs>

            <Stack component="form" spacing={2} onSubmit={submit}>
              {mode === "register" && (
                <>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <UserAvatar user={{ nom: form.nom, avatar: form.avatar }} size={56} />
                    <Button component="label" variant="outlined" size="small">
                      {t("login.addPhoto")}
                      <input hidden type="file" accept="image/*" onChange={pickImage} />
                    </Button>
                  </Stack>
                  <TextField label={t("login.name")} value={form.nom} onChange={set("nom")} required autoComplete="name" />
                  <TextField label={t("login.org")} value={form.organisation} onChange={set("organisation")} autoComplete="organization" />
                  <TextField label={t("login.reason")} value={form.motif} onChange={set("motif")} multiline minRows={2} helperText={t("login.reasonHelp")} />
                </>
              )}
              <TextField label={t("login.email")} type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
              <TextField
                label={t("login.password")}
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                helperText={mode === "register" ? t("login.passwordHelp") : undefined}
              />
              {error && <Alert severity="error">{error}</Alert>}
              {info && <Alert severity="success">{info}</Alert>}
              {DEMO_AUTH && mode === "login" && (
                <Alert severity="info">
                  Mode démo : {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
                </Alert>
              )}
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? t("login.wait") : mode === "login" ? t("login.submit") : t("login.submitRegister")}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
