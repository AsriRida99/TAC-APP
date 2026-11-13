import { useState } from "react"
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, LinearProgress, MenuItem, Slider, Stack, TextField, Tooltip, Typography,
} from "@mui/material"
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined"
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined"
import DeleteOutlined from "@mui/icons-material/DeleteOutlined"
import HistoryOutlined from "@mui/icons-material/HistoryOutlined"
import RestartAltOutlined from "@mui/icons-material/RestartAltOutlined"
import HubOutlined from "@mui/icons-material/HubOutlined"
import { brand, gradient } from "../theme"
import { fmtDate } from "../utils/format"
import { useI18n } from "../i18n/I18nContext"

export function WipBanner() {
  const { t } = useI18n()
  return (
    <Alert severity="warning" icon={<span aria-hidden style={{ fontSize: "1.1rem", lineHeight: 1.4 }}>🚧</span>}
      sx={{ mb: 2.5, borderLeft: "4px solid #f59e0b", bgcolor: "rgba(245,158,11,0.1)", color: "text.primary" }}>
      <strong>{t("wip.title")}</strong> — {t("wip.text")}
    </Alert>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ background: "linear-gradient(90deg, #0f172a 0%, #4f46e5 70%, #8b5cf6 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{title}</Typography>
        <Box sx={{ width: "3.5rem", height: "0.25rem", borderRadius: 2, mt: 1, background: gradient.rainbow }} />
        {subtitle && <Typography sx={{ color: "text.secondary", mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>{actions}</Stack>}
    </Stack>
  )
}

export function SectionCard({ step, title, subtitle, action, children }) {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          {step && (
            <Box sx={{ width: "1.875rem", height: "1.875rem", borderRadius: "50%", background: gradient.primary, boxShadow: "0 4px 10px -4px rgba(99,102,241,0.7)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
              {step}
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>{title}</Typography>
            {subtitle && <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>{subtitle}</Typography>}
          </Box>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  )
}

const STATUS_COLORS = {
  validé: "success",
  publié: "success",
  rejeté: "error",
  nouveau: "default",
  "en attente": "warning",
  "non envoyé": "default",
  "à mettre à jour": "warning",
  "concept généré": "primary",
  accepté: "success",
  corrigé: "warning",
  réussie: "success",
  actif: "success",
  refusé: "error",
  désactivé: "default",
}

export function LlmSourceNote({ llm }) {
  if (!llm) return null
  if (llm.erreur) {
    return <Alert severity="warning" sx={{ mb: 2 }}>{llm.erreur} — réponse simulée affichée à la place.</Alert>
  }
  return (
    <Chip size="small" variant="outlined" icon={<AutoAwesomeOutlined />} sx={{ mb: 2 }}
      label={llm.source === "Simulation" ? "Réponse simulée (Mistral non configuré)" : `Généré par ${llm.source} (modèle de base, non fine-tuné)`} />
  )
}

export function StatusChip({ statut, variant }) {
  const { t } = useI18n()
  return <Chip size="small" label={t(`status.${statut}`) === `status.${statut}` ? statut : t(`status.${statut}`)} color={STATUS_COLORS[statut] || "default"} variant={variant || (statut === "nouveau" || statut === "non envoyé" ? "outlined" : "filled")} />
}

export function OpenThesoChip({ opentheso }) {
  const { t } = useI18n()
  const s = opentheso?.statut || "non envoyé"
  return (
    <Tooltip title={s === "publié" ? t("ot.published", { id: opentheso.id, date: fmtDate(opentheso.date) }) : t("ot.notSent")}>
      <span><StatusChip statut={s} /></span>
    </Tooltip>
  )
}

export function ContextPanel({ examples, setExamples, relations, prompt, setPrompt, onRebuildPrompt, examplesTitle = "Exemples similaires · Qdrant", relationsTitle = "Relations du graphe · Neo4j" }) {
  const [editing, setEditing] = useState(null)
  const toggle = (id) => setExamples(examples.map((e) => (e.id === id ? { ...e, include: !e.include } : e)))
  const remove = (id) => setExamples(examples.filter((e) => e.id !== id))
  const edit = (id, text) => setExamples(examples.map((e) => (e.id === id ? { ...e, text } : e)))

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 1 }}>{examplesTitle}</Typography>
        <Stack spacing={1}>
          {examples.length === 0 && <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>Aucun exemple.</Typography>}
          {examples.map((e) => (
            <Box key={e.id} sx={{ border: `1px solid ${brand.stoneLight}`, borderRadius: 2, p: 1.25, bgcolor: e.include ? "background.paper" : brand.stoneSoft, opacity: e.include ? 1 : 0.7 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Checkbox size="small" checked={e.include} onChange={() => toggle(e.id)} sx={{ p: 0.5 }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", flex: 1, minWidth: 0 }} noWrap>{e.label}</Typography>
                <Chip size="small" label={`score ${e.score.toFixed(2)}`} variant="outlined" />
                <Button size="small" onClick={() => setEditing(editing === e.id ? null : e.id)}>{editing === e.id ? "Fermer" : "Modifier"}</Button>
                <IconButton size="small" onClick={() => remove(e.id)} aria-label="Retirer l'exemple"><DeleteOutlined fontSize="small" /></IconButton>
              </Stack>
              {editing === e.id ? (
                <TextField value={e.text} onChange={(ev) => edit(e.id, ev.target.value)} multiline minRows={3} fullWidth size="small" sx={{ mt: 1, "& textarea": { fontFamily: "Consolas, monospace", fontSize: "0.7812rem" } }} />
              ) : (
                <Typography sx={{ fontSize: "0.7812rem", color: "text.secondary", whiteSpace: "pre-line", mt: 0.5, pl: 4.5 }}>
                  {e.text.split("\n").slice(0, 3).join("\n")}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
        <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mt: 2, mb: 1 }}>
          <HubOutlined sx={{ fontSize: "1rem", verticalAlign: -3, mr: 0.5, color: "primary.main" }} />
          {relationsTitle}
        </Typography>
        <Stack spacing={0.5}>
          {relations.map((r) => (
            <Typography key={r} sx={{ fontSize: "0.7812rem", fontFamily: "Consolas, monospace", bgcolor: brand.stoneSoft, borderRadius: 1, px: 1, py: 0.5 }}>{r}</Typography>
          ))}
        </Stack>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" sx={{ alignItems: "center", mb: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", flex: 1 }}>Prompt envoyé au modèle</Typography>
          <Button size="small" startIcon={<RestartAltOutlined />} onClick={onRebuildPrompt}>Reconstruire</Button>
        </Stack>
        <TextField
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          multiline
          minRows={14}
          maxRows={22}
          fullWidth
          sx={{ "& textarea": { fontFamily: "Consolas, monospace", fontSize: "0.7812rem", lineHeight: 1.55 } }}
        />
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.75 }}>
          Vous pouvez modifier le prompt librement. « Reconstruire » le régénère à partir des exemples cochés.
        </Typography>
      </Box>
    </Box>
  )
}

export function ModelBar({ models, model, setModel, temperature, setTemperature, onGenerate, loading, disabled, label = "Générer", iteration }) {
  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
        <TextField select size="small" label="Modèle" value={model} onChange={(e) => setModel(e.target.value)} sx={{ minWidth: "16.25rem" }}>
          {models.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        <Box sx={{ minWidth: "12.5rem", px: 1 }}>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Température : {temperature.toFixed(1)}</Typography>
          <Slider size="small" min={0} max={1} step={0.1} value={temperature} onChange={(_, v) => setTemperature(v)} />
        </Box>
        <Box sx={{ flex: 1 }} />
        {iteration > 0 && <Chip label={`Itération ${iteration + 1}`} variant="outlined" />}
        <Button variant="contained" size="large" startIcon={<AutoAwesomeOutlined />} onClick={onGenerate} disabled={disabled || loading}>
          {loading ? "Génération en cours…" : label}
        </Button>
      </Stack>
      {loading && <LinearProgress sx={{ mt: 2, borderRadius: 2 }} />}
    </Box>
  )
}

export function HistoryButton({ onClick }) {
  const { t } = useI18n()
  return (
    <Tooltip title={t("history.tooltip")}>
      <IconButton size="small" onClick={onClick}><HistoryOutlined fontSize="small" /></IconButton>
    </Tooltip>
  )
}

export function HistoryDialog({ open, onClose, title, history = [] }) {
  const { t } = useI18n()
  const [shown, setShown] = useState(null)
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t("history.title", { name: title })}</DialogTitle>
      <DialogContent dividers>
        {history.length === 0 && <Typography color="text.secondary">{t("history.empty")}</Typography>}
        <Stack divider={<Divider />} spacing={1.5}>
          {history.map((h) => (
            <Box key={h.n + h.promptId}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Chip size="small" label={t("history.iter", { n: h.n })} />
                <StatusChip statut={h.decision} />
                <Typography sx={{ fontSize: "0.8125rem" }}><b>{h.user}</b> · {fmtDate(h.date)}</Typography>
                <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>{h.model} · prompt {h.promptId}</Typography>
                {h.prompt && (
                  <Button size="small" onClick={() => setShown(shown === h.n ? null : h.n)}>
                    {shown === h.n ? t("history.hidePrompt") : t("history.showPrompt")}
                  </Button>
                )}
              </Stack>
              {h.note && <Typography sx={{ fontSize: "0.8125rem", mt: 0.5 }}>{t("history.reason", { r: h.note })}</Typography>}
              {shown === h.n && (
                <Box component="pre" sx={{ fontSize: "0.75rem", bgcolor: brand.stoneSoft, p: 1.5, borderRadius: 1.5, whiteSpace: "pre-wrap", mt: 1, mb: 0 }}>{h.prompt}</Box>
              )}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>{t("common.close")}</Button></DialogActions>
    </Dialog>
  )
}

export function PublishButton({ count, onClick, label }) {
  const { t } = useI18n()
  label = label || t("publish")
  return (
    <Button variant="outlined" startIcon={<CloudUploadOutlined />} onClick={onClick} disabled={!count}>
      {label}{count ? ` (${count})` : ""}
    </Button>
  )
}

export function RejectDialog({ open, onClose, onConfirm }) {
  const [note, setNote] = useState("")
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Rejeter et régénérer</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Le résultat est conservé dans l'historique comme « rejeté ». Vous pouvez ajuster le prompt ou les exemples avant de relancer.
        </Alert>
        <TextField autoFocus label="Motif du rejet (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} fullWidth multiline minRows={2} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Annuler</Button>
        <Button variant="contained" onClick={() => { onConfirm(note); setNote("") }}>Rejeter</Button>
      </DialogActions>
    </Dialog>
  )
}

export function ConfirmDialog({ open, title, text, onClose, onConfirm, confirmLabel }) {
  const { t } = useI18n()
  confirmLabel = confirmLabel || t("common.delete")
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><Typography>{text}</Typography></DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">{t("common.cancel")}</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}

export function ChipsInput({ label, value, onChange }) {
  const { t } = useI18n()
  const [draft, setDraft] = useState("")
  const add = () => {
    const v = draft.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setDraft("")
  }
  return (
    <Box>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mb: 1 }}>
        {value.map((v) => <Chip key={v} label={v} size="small" onDelete={() => onChange(value.filter((x) => x !== v))} />)}
      </Stack>
      <TextField
        size="small"
        label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
        onBlur={add}
        fullWidth
        helperText={t("chips.help")}
      />
    </Box>
  )
}


const STEPS = ["step.context", "step.result", "step.stored"]

export function StepIndicator({ step }) {
  const { t } = useI18n()
  const current = { context: 0, generating: 1, result: 1, stored: 3 }[step] ?? 0
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <Stack key={label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: "1.625rem", height: "1.625rem", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "0.7812rem", fontWeight: 700,
                border: "1.5px solid", borderColor: done || active ? "primary.main" : brand.stoneLight,
                bgcolor: done ? "primary.main" : "transparent", color: done ? "#fff" : active ? "primary.main" : "text.secondary",
              }}
            >
              {done ? "✓" : i + 1}
            </Box>
            <Typography sx={{ fontSize: "0.8438rem", fontWeight: active ? 700 : 500, color: active ? "text.primary" : "text.secondary" }}>{t(label)}</Typography>
            {i < STEPS.length - 1 && <Box sx={{ width: "1.375rem", height: "0.0938rem", bgcolor: brand.stoneLight }} />}
          </Stack>
        )
      })}
    </Stack>
  )
}

export function PromptEditor({ components, extra = [], prompt, onChange, onReset, edited }) {
  const { t } = useI18n()
  return (
    <Box>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mb: 1.25 }}>
        {[...components, ...extra].map((c) => (
          <Chip key={c} size="small" label={t(`pc.${c}`)} color={extra.includes(c) ? "primary" : "default"} sx={{ fontFamily: "Consolas, monospace", fontSize: "0.7188rem" }} />
        ))}
      </Stack>
      <TextField
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        multiline minRows={16} maxRows={26} fullWidth
        sx={{ "& textarea": { fontFamily: "Consolas, monospace", fontSize: "0.75rem", lineHeight: 1.55 } }}
      />
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.75 }}>
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", flex: 1 }}>
          {edited ? t("prompt.edited") : t("prompt.auto")}
        </Typography>
        {edited && <Button size="small" startIcon={<RestartAltOutlined />} onClick={onReset}>{t("prompt.rebuild")}</Button>}
      </Stack>
    </Box>
  )
}

export function RejectPanel({ reason, setReason, extra, setExtra, options, onCancel, onBackToContext, onRelaunch }) {
  const { t } = useI18n()
  const toggle = (c) => setExtra(extra.includes(c) ? extra.filter((x) => x !== c) : [...extra, c])
  return (
    <Box sx={{ border: "1px solid", borderColor: "error.light", bgcolor: "rgba(161,74,60,0.05)", borderRadius: 2, p: 2, mt: 2 }}>
      <Typography sx={{ fontWeight: 700, color: "error.main", mb: 1.5 }}>{t("reject.title")}</Typography>
      <TextField
        label={t("reject.reason")} value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline minRows={2} required
        placeholder={t("reject.placeholder")}
        sx={{ bgcolor: "background.paper", mb: 1.5 }}
      />
      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, mb: 0.5 }}>{t("reject.components")}</Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, mb: 1.5 }}>
        {options.map((c) => (
          <Stack key={c} direction="row" sx={{ alignItems: "center" }}>
            <Checkbox size="small" checked={extra.includes(c)} onChange={() => toggle(c)} />
            <Typography sx={{ fontFamily: "Consolas, monospace", fontSize: "0.8125rem" }}>{t(`pc.${c}`)}</Typography>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button variant="contained" startIcon={<RestartAltOutlined />} disabled={!reason.trim()} onClick={onRelaunch}>{t("reject.relaunch")}</Button>
        <Button variant="outlined" onClick={onBackToContext}>{t("reject.back")}</Button>
        <Button color="inherit" onClick={onCancel}>{t("common.cancel")}</Button>
      </Stack>
    </Box>
  )
}

const LOG_STATUS = { accepté: "success", validé: "success", corrigé: "warning", rejeté: "error" }

export function IterationLog({ log }) {
  const { t } = useI18n()
  if (!log.length) return <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>{t("log.empty")}</Typography>
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", "& th, & td": { textAlign: "left", p: 1, borderBottom: `1px solid ${brand.stoneLight}` }, "& th": { color: "text.secondary", fontWeight: 600 } }}>
        <thead>
          <tr><th>#</th><th>{t("log.model")}</th><th>{t("log.prompt")}</th><th>{t("log.status")}</th><th>{t("log.reason")}</th><th>{t("log.by")}</th></tr>
        </thead>
        <tbody>
          {log.map((it) => (
            <tr key={it.n}>
              <td><b>{it.n}</b></td>
              <td>{it.model}</td>
              <td style={{ fontFamily: "Consolas, monospace", fontSize: "0.75rem" }}>{(it.components || ["standard"]).join(" + ")}</td>
              <td><Chip size="small" label={t(`status.${it.decision === "validé" ? "accepté" : it.decision}`)} color={LOG_STATUS[it.decision] || "default"} /></td>
              <td style={{ maxWidth: "16.25rem" }}>{it.note || "—"}</td>
              <td>{it.user}</td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  )
}
