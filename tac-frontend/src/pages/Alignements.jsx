import { useMemo, useState } from "react"
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Grid, IconButton, LinearProgress, MenuItem, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material"
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined"
import ReplayOutlined from "@mui/icons-material/ReplayOutlined"
import DeleteOutlined from "@mui/icons-material/DeleteOutlined"
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined"
import { useDemo } from "../demo/DemoStore"
import { MODELES, SOURCES_EXTERNES } from "../demo/dictionary"
import { alignmentContext, alignmentPrompt, generateAlignments } from "../demo/llm"
import {
  ConfirmDialog, ContextPanel, HistoryButton, HistoryDialog, ModelBar, OpenThesoChip, PageHeader, PublishButton, WipBanner,
  RejectDialog, SectionCard,
} from "../components/curation"
import StatCard from "../components/StatCard"
import { brand, viz } from "../theme"
import { fmtDate } from "../utils/format"

const TYPES = ["exactMatch", "closeMatch", "broadMatch", "narrowMatch", "relatedMatch"]

function ScoreBar({ value }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: "6.875rem" }}>
      <LinearProgress variant="determinate" value={value * 100} sx={{ flex: 1, height: "0.375rem", borderRadius: 3 }} />
      <Typography sx={{ fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}>{value.toFixed(2)}</Typography>
    </Stack>
  )
}

export default function Alignements() {
  const { db, me, nextPromptId, saveAlignements, updateAlignement, deleteAlignement, publish } = useDemo()

  const [thesaurusId, setThesaurusId] = useState("")
  const [sources, setSources] = useState(["pactols", "aat"])
  const [examples, setExamples] = useState([])
  const [relations, setRelations] = useState([])
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState(MODELES.alignements[0])
  const [temperature, setTemperature] = useState(0.1)
  const [loading, setLoading] = useState(false)
  const [proposals, setProposals] = useState(null)
  const [keep, setKeep] = useState([])
  const [history, setHistory] = useState([])
  const [promptId, setPromptId] = useState(null)
  const [rejecting, setRejecting] = useState(false)

  const [filter, setFilter] = useState("tous")
  const [selected, setSelected] = useState([])
  const [historyOf, setHistoryOf] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const th = db.thesauri.find((t) => t.id === thesaurusId)
  const thConcepts = th ? db.concepts.filter((c) => th.conceptIds.includes(c.id)) : []

  function rebuild(tid, srcs) {
    const t = db.thesauri.find((x) => x.id === tid)
    if (!t) return
    const cs = db.concepts.filter((c) => t.conceptIds.includes(c.id))
    const ctx = alignmentContext(cs, srcs)
    setExamples(ctx.examples)
    setRelations(ctx.relations)
    setPrompt(alignmentPrompt(t.nom, cs, ctx.examples))
    setProposals(null)
    setHistory([])
  }

  const toggleSource = (id) => {
    const next = sources.includes(id) ? sources.filter((s) => s !== id) : [...sources, id]
    setSources(next)
    rebuild(thesaurusId, next)
  }

  async function generate() {
    setLoading(true)
    setProposals(null)
    setPromptId(nextPromptId())
    const r = await generateAlignments(thConcepts, sources, history.length + 1)
    setProposals(r)
    setKeep(r.filter((p) => p.score >= 0.8).map((p) => p.key))
    setLoading(false)
  }

  const entry = (decision, note = "") => ({ n: history.length + 1, date: new Date().toISOString(), user: me, model, promptId, prompt, decision, note })

  function validate() {
    const chosen = proposals.filter((p) => keep.includes(p.key)).map(({ key: _key, ...rest }) => rest)
    saveAlignements(chosen, { thesaurusId: th.id, thesaurusNom: th.nom, model, history: [...history, entry("validé")] })
    setToast(`${chosen.length} alignement(s) validé(s) pour « ${th.nom} »`)
    setProposals(null)
    setHistory([])
  }

  function reject(note) {
    setHistory([...history, entry("rejeté", note)])
    setProposals(null)
    setRejecting(false)
  }

  const alignements = useMemo(
    () => db.alignements.filter((a) => filter === "tous" || a.thesaurusId === filter),
    [db.alignements, filter]
  )
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const publishable = selected.filter((id) => db.alignements.find((a) => a.id === id)?.opentheso.statut !== "publié")
  const exact = db.alignements.filter((a) => a.type === "exactMatch").length
  const alignedConcepts = new Set(db.alignements.map((a) => a.conceptId)).size

  return (
    <Box>
      <PageHeader title="Alignements" subtitle="L'agent interroge les référentiels externes via MCP et propose des correspondances SKOS." />
      <WipBanner />

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Alignements validés" value={db.alignements.length} icon={CompareArrowsOutlined} color={viz.violet} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="exactMatch" value={exact} color={brand.slate} hint={`${db.alignements.length - exact} autres correspondances`} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Concepts alignés" value={`${alignedConcepts} / ${db.concepts.length}`} color={brand.stone} /></Grid>
      </Grid>

      <SectionCard step={1} title="Thésaurus et référentiels" subtitle="Choisissez le thésaurus interne et les référentiels externes interrogés par l'agent (serveurs MCP).">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: { md: "center" } }}>
          <TextField
            select size="small" label="Thésaurus interne" value={thesaurusId} sx={{ minWidth: "17.5rem" }}
            onChange={(e) => { setThesaurusId(e.target.value); rebuild(e.target.value, sources) }}
          >
            {db.thesauri.map((t) => <MenuItem key={t.id} value={t.id}>{t.nom} ({t.conceptIds.length} concepts)</MenuItem>)}
          </TextField>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {SOURCES_EXTERNES.map((s) => (
              <Chip
                key={s.id}
                label={`${s.nom} · ${s.serveur}`}
                icon={<Checkbox size="small" checked={sources.includes(s.id)} sx={{ p: 0, ml: "6px !important" }} />}
                onClick={() => toggleSource(s.id)}
                color={sources.includes(s.id) ? "primary" : "default"}
                variant={sources.includes(s.id) ? "filled" : "outlined"}
                disabled={loading}
              />
            ))}
          </Stack>
        </Stack>
      </SectionCard>

      {th && sources.length > 0 && (
        <>
          <SectionCard step={2} title="Contexte et prompt" subtitle="Résultats des outils MCP et relations du graphe, puis prompt modifiable.">
            <ContextPanel
              examples={examples} setExamples={setExamples} relations={relations}
              prompt={prompt} setPrompt={setPrompt}
              onRebuildPrompt={() => setPrompt(alignmentPrompt(th.nom, thConcepts, examples))}
              examplesTitle="Appels d'outils MCP"
            />
          </SectionCard>
          <SectionCard step={3} title="Génération">
            <ModelBar
              models={MODELES.alignements} model={model} setModel={setModel}
              temperature={temperature} setTemperature={setTemperature}
              onGenerate={generate} loading={loading} iteration={history.length}
              label={history.length ? "Régénérer" : "Proposer les alignements"}
            />
          </SectionCard>
        </>
      )}

      {proposals && (
        <SectionCard
          step={4}
          title="Alignements proposés"
          subtitle={`Itération ${history.length + 1} · ${model} · prompt ${promptId}. Les propositions avec un score ≥ 0,80 sont présélectionnées.`}
        >
          <TableContainer sx={{ maxHeight: "28.75rem" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"><Checkbox size="small" checked={keep.length === proposals.length} onChange={() => setKeep(keep.length === proposals.length ? [] : proposals.map((p) => p.key))} /></TableCell>
                  <TableCell>Concept interne</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Concept externe</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposals.map((p, i) => (
                  <TableRow key={p.key} hover>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={keep.includes(p.key)} onChange={() => setKeep(keep.includes(p.key) ? keep.filter((k) => k !== p.key) : [...keep, p.key])} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.conceptLabel}</TableCell>
                    <TableCell>
                      <TextField select size="small" variant="standard" value={p.type} onChange={(e) => setProposals(proposals.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                        {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>{p.externeLabel}<Typography sx={{ fontSize: "0.7188rem", color: "text.secondary" }}>{p.uri}</Typography></TableCell>
                    <TableCell>{p.source}</TableCell>
                    <TableCell><ScoreBar value={p.score} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: "flex-end" }}>
            <Button color="inherit" startIcon={<ReplayOutlined />} onClick={() => setRejecting(true)}>Rejeter et régénérer</Button>
            <Button variant="contained" startIcon={<CheckCircleOutlined />} disabled={!keep.length} onClick={validate}>Valider la sélection ({keep.length})</Button>
          </Stack>
        </SectionCard>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, flex: 1 }}>Alignements validés</Typography>
            <TextField select size="small" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: "15rem" }}>
              <MenuItem value="tous">Tous les thésaurus</MenuItem>
              {db.thesauri.map((t) => <MenuItem key={t.id} value={t.id}>{t.nom}</MenuItem>)}
            </TextField>
            <PublishButton count={publishable.length} onClick={() => { publish("alignements", publishable); setToast(`${publishable.length} alignement(s) envoyé(s) vers OpenTheso`); setSelected([]) }} />
          </Stack>
          <TableContainer sx={{ maxHeight: "35rem" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Concept interne</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Concept externe</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Validé par</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>OpenTheso</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alignements.map((a) => (
                  <TableRow key={a.id} hover selected={selected.includes(a.id)}>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{a.conceptLabel}<Typography sx={{ fontSize: "0.7188rem", color: "text.secondary" }}>{a.thesaurusNom}</Typography></TableCell>
                    <TableCell>
                      <TextField select size="small" variant="standard" value={a.type} onChange={(e) => updateAlignement(a.id, { type: e.target.value })}>
                        {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      {a.externeLabel}
                      <Typography sx={{ fontSize: "0.7188rem", color: "text.secondary" }}>{a.uri}</Typography>
                    </TableCell>
                    <TableCell>{a.source}</TableCell>
                    <TableCell><ScoreBar value={a.score} /></TableCell>
                    <TableCell>{a.validated_by}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(a.validated_at)}</TableCell>
                    <TableCell><OpenThesoChip opentheso={a.opentheso} /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <HistoryButton onClick={() => setHistoryOf(a)} />
                      <IconButton size="small" onClick={() => setConfirm(a)}><DeleteOutlined fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {alignements.length === 0 && <Alert severity="info" sx={{ mt: 2 }}>Aucun alignement pour ce thésaurus.</Alert>}
        </CardContent>
      </Card>

      <HistoryDialog open={Boolean(historyOf)} onClose={() => setHistoryOf(null)} title={historyOf ? `${historyOf.conceptLabel} ↔ ${historyOf.externeLabel}` : ""} history={historyOf?.history} />
      <RejectDialog open={rejecting} onClose={() => setRejecting(false)} onConfirm={reject} />
      <ConfirmDialog
        open={Boolean(confirm)} title="Supprimer l'alignement"
        text={`Supprimer l'alignement « ${confirm?.conceptLabel} ↔ ${confirm?.externeLabel} » ?`}
        onClose={() => setConfirm(null)} onConfirm={() => { deleteAlignement(confirm.id); setConfirm(null) }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
