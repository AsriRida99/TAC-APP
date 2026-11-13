import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, InputAdornment, LinearProgress, MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material"
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined"
import EditOutlined from "@mui/icons-material/EditOutlined"
import DeleteOutlined from "@mui/icons-material/DeleteOutlined"
import SearchOutlined from "@mui/icons-material/SearchOutlined"
import CloseOutlined from "@mui/icons-material/CloseOutlined"
import CheckOutlined from "@mui/icons-material/CheckOutlined"
import RestartAltOutlined from "@mui/icons-material/RestartAltOutlined"
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined"
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined"
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined"
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined"
import { useDemo } from "../demo/DemoStore"
import { MODELES } from "../demo/dictionary"
import { PROMPT_B5, PROMPT_OPTIONS, conceptPromptB5, generateConcept } from "../demo/llm"
import { BASE_STATS, PIPELINE, searchConcepts } from "../demo/vectorBase"
import {
  ChipsInput, ConfirmDialog, HistoryButton, HistoryDialog, IterationLog, LlmSourceNote, OpenThesoChip, PageHeader, PromptEditor,
  PublishButton, RejectPanel, SectionCard, StepIndicator,
} from "../components/curation"
import StatCard from "../components/StatCard"
import { brand, viz } from "../theme"
import { fmtDate, pct } from "../utils/format"
import { useI18n } from "../i18n/I18nContext"

const FIELDS = ["prefLabel", "altLabel", "definition", "broader", "narrower"]
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function ConceptForm({ value, onChange, disabled, edited = [] }) {
  const { t } = useI18n()
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  const label = (k) => (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
      <Typography sx={{ fontFamily: "Consolas, monospace", fontSize: "0.75rem", color: "text.secondary" }}>skos:{k}</Typography>
      {edited.includes(k) && <Chip size="small" label={t("c.modified")} color="warning" variant="outlined" sx={{ height: "1.125rem", fontSize: "0.6875rem" }} />}
    </Stack>
  )
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>{label("prefLabel")}<TextField value={value.prefLabel} onChange={set("prefLabel")} fullWidth size="small" disabled={disabled} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}>{label("broader")}<TextField value={value.broader} onChange={set("broader")} fullWidth size="small" disabled={disabled} /></Grid>
      <Grid size={12}>{label("definition")}<TextField value={value.definition} onChange={set("definition")} fullWidth multiline minRows={2} size="small" disabled={disabled} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}>{label("altLabel")}{disabled ? <Typography sx={{ fontSize: "0.875rem" }}>{value.altLabel.join(", ") || "—"}</Typography> : <ChipsInput label={t("c.addAlt")} value={value.altLabel} onChange={(v) => onChange({ ...value, altLabel: v })} />}</Grid>
      <Grid size={{ xs: 12, md: 6 }}>{label("narrower")}{disabled ? <Typography sx={{ fontSize: "0.875rem" }}>{value.narrower.join(", ") || "—"}</Typography> : <ChipsInput label={t("c.addNarrower")} value={value.narrower} onChange={(v) => onChange({ ...value, narrower: v })} />}</Grid>
    </Grid>
  )
}

function ExampleCard({ e, onRemove, onBroader }) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const changed = e.broader !== e.original.broader
  return (
    <Box sx={{ border: `1px solid ${brand.stoneLight}`, borderRadius: 2, p: 1.5, bgcolor: "background.paper" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
            <Typography sx={{ fontWeight: 700 }}>{e.prefLabel}</Typography>
            <Chip size="small" label={e.complet ? t("c.complete") : t("c.incomplete")} color={e.complet ? "success" : "warning"} variant="outlined" sx={{ height: "1.25rem" }} />
            {e.exact && <Chip size="small" label={t("c.exactTerm")} variant="outlined" sx={{ height: "1.25rem" }} />}
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              {e.thesaurus} · {e.id_concept} · reranker {e.rr.toFixed(2)}
            </Typography>
          </Stack>
          {e.aussi?.length > 0 && <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{t("c.alsoIn", { list: e.aussi.join(", ") })}</Typography>}
          {(e.altLabel.length > 0 || e.definition) && (
            <Typography sx={{ fontSize: "0.7812rem", color: "text.secondary", mt: 0.5 }}>
              {e.altLabel.length > 0 && <><b>altLabel</b> {e.altLabel.join(", ")} · </>}
              {e.definition && <><b>definition</b> {e.definition}</>}
            </Typography>
          )}
          <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
            <Typography sx={{ fontFamily: "Consolas, monospace", fontSize: "0.7188rem", color: "text.secondary" }}>broader</Typography>
            {editing ? (
              <Stack direction="row" sx={{ alignItems: "center" }}>
                <TextField size="small" autoFocus value={e.broader} onChange={(ev) => onBroader(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && setEditing(false)} sx={{ width: "11.875rem", "& input": { py: 0.5 } }} />
                <IconButton size="small" onClick={() => setEditing(false)}><CheckOutlined fontSize="small" /></IconButton>
              </Stack>
            ) : (
              <Tooltip title={t("c.fixBroader")}>
                <Chip size="small" label={e.broader || "(vide)"} onClick={() => setEditing(true)} onDelete={() => setEditing(true)} deleteIcon={<EditOutlined />} color={changed ? "primary" : "default"} />
              </Tooltip>
            )}
            {e.narrower.length > 0 && (
              <>
                <Typography sx={{ fontFamily: "Consolas, monospace", fontSize: "0.7188rem", color: "text.secondary", ml: 1 }}>narrower</Typography>
                {e.narrower.map((n) => <Chip key={n} size="small" label={n} variant="outlined" />)}
              </>
            )}
          </Stack>
        </Box>
        <Button size="small" color="inherit" startIcon={<CloseOutlined />} onClick={onRemove} sx={{ flexShrink: 0 }}>{t("c.remove")}</Button>
      </Stack>
    </Box>
  )
}

export default function Concepts() {
  const { db, me, nextPromptId, saveConcept, updateConcept, deleteConcept, publish } = useDemo()
  const { t, lang } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  const [queueIds] = useState(() => location.state?.termeIds ?? null)
  const pending = db.termes.filter((t) => t.statut === "nouveau" && (!queueIds || queueIds.includes(t.id)))
  const allTermes = [...db.termes].sort((a, b) =>
    a.statut === b.statut ? a.label.localeCompare(b.label, "fr") : a.statut === "nouveau" ? -1 : 1
  )

  const [terme, setTerme] = useState(null)
  const [search, setSearch] = useState(null)
  const [initial, setInitial] = useState([])
  const [examples, setExamples] = useState([])
  const [removed, setRemoved] = useState([])
  const [extra, setExtra] = useState([])
  const [promptOverride, setPromptOverride] = useState(null)
  const [model, setModel] = useState(MODELES.concepts[0])
  const [step, setStep] = useState("context")
  const [iteration, setIteration] = useState(1)
  const [result, setResult] = useState(null)
  const [original, setOriginal] = useState(null)
  const [log, setLog] = useState([])
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pendingExtra, setPendingExtra] = useState([])
  const [savedId, setSavedId] = useState(null)
  const [promptId, setPromptId] = useState(null)
  const [showRanking, setShowRanking] = useState(false)

  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState([])
  const [historyOf, setHistoryOf] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const [llm, setLlm] = useState(null)

  const prompt = terme ? promptOverride ?? conceptPromptB5(terme.label, examples, extra) : ""
  const edited = result && original ? FIELDS.filter((k) => !same(result[k], original[k])) : []
  const included = examples.filter((e) => e.include)

  function chooseTerme(t) {
    const ctx = searchConcepts(t.label, { n: PIPELINE.exemples })
    setTerme(t)
    setSearch(ctx)
    setInitial(ctx.examples)
    setExamples(ctx.examples)
    setRemoved([])
    setExtra([])
    setPromptOverride(null)
    setStep("context")
    setIteration(1)
    setResult(null)
    setLog([])
    setRejectOpen(false)
    setSavedId(null)
  }

  const removeExample = (id) => {
    setExamples(examples.filter((e) => e.id !== id))
    setRemoved([...removed, id])
    setPromptOverride(null)
  }
  const setBroader = (id, broader) => {
    setExamples(examples.map((e) => (e.id === id ? { ...e, broader } : e)))
    setPromptOverride(null)
  }

  async function generate(iter, exs, comps) {
    setStep("generating")
    setRejectOpen(false)
    setPromptId(nextPromptId())
    const p = iter === iteration && promptOverride ? promptOverride : conceptPromptB5(terme.label, exs, comps)
    const { concept: r, source, erreur } = await generateConcept(terme.label, exs, iter, comps, p)
    setLlm({ source, erreur })
    setResult(r)
    setOriginal(r)
    setStep("result")
  }

  const entry = (decision, note = "") => ({
    n: iteration, date: new Date().toISOString(), user: me, model, promptId, prompt,
    components: ["standard", ...extra], decision, note,
  })

  function accept() {
    const newLog = [...log, entry(edited.length ? "corrigé" : "accepté")]
    setLog(newLog)
    setSavedId(saveConcept(result, { termeId: terme.id, terme: terme.label, model, history: newLog }))
  }

  function store() {
    publish("concepts", [savedId])
    setStep("stored")
  }

  function relaunch() {
    const nextExtra = [...new Set([...extra, ...pendingExtra])]
    let nextExamples = examples
    if (nextExtra.includes("EXEMPLES +") && !extra.includes("EXEMPLES +")) {
      const more = searchConcepts(terme.label, { n: PIPELINE.exemples + 2 }).examples
      nextExamples = more.filter((e) => !removed.includes(e.id)).map((e) => examples.find((x) => x.id === e.id) ?? e)
    }
    setLog([...log, entry("rejeté", reason.trim())])
    setExtra(nextExtra)
    setExamples(nextExamples)
    setPromptOverride(null)
    setReason("")
    setPendingExtra([])
    setIteration(iteration + 1)
    generate(iteration + 1, nextExamples, nextExtra)
  }

  function nextTerme() {
    const next = pending.find((t) => t.id !== terme.id)
    if (next) chooseTerme(next)
    else setTerme(null)
  }

  const concepts = db.concepts
  const filtered = useMemo(() => concepts.filter((c) => c.prefLabel.toLowerCase().includes(query.toLowerCase())), [concepts, query])
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const publishable = selected.filter((id) => concepts.find((c) => c.id === id)?.opentheso.statut !== "publié")
  const published = concepts.filter((c) => c.opentheso.statut === "publié").length
  const avgIter = concepts.length ? (concepts.reduce((s, c) => s + c.iteration, 0) / concepts.length).toFixed(1) : "0"

  return (
    <Box>
      <PageHeader
        title={t("c.title")}
        subtitle={t("c.subtitle")}
        actions={terme && <StepIndicator step={step} />}
      />

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label={t("c.kpi.validated")} value={concepts.length} color={viz.teal} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label={t("c.kpi.todo")} value={db.termes.filter((t) => t.statut === "nouveau").length} color={brand.slate} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label={t("c.kpi.avgIter")} value={avgIter} color={brand.stone} hint={t("c.kpi.avgIterHint")} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label={t("c.kpi.published")} value={`${published} / ${concepts.length}`} color={brand.ok} progress={pct(published, concepts.length)} /></Grid>
      </Grid>

      <SectionCard step={1} title={t("c.step1")} subtitle={queueIds ? t("c.step1.fromTerms") : t("c.step1.noConcept")}>
        <Autocomplete
          options={allTermes}
          groupBy={(x) => (x.statut === "nouveau" ? t("c.group.todo") : t("c.group.done"))}
          getOptionLabel={(t) => t.label}
          getOptionDisabled={(t) => t.statut !== "nouveau"}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={terme}
          onChange={(_, t) => t && chooseTerme(t)}
          openOnFocus
          disabled={step === "generating"}
          noOptionsText={t("c.noTerm")}
          sx={{ maxWidth: "32.5rem", mb: pending.length ? 2 : 0 }}
          renderInput={(params) => <TextField {...params} size="small" placeholder={t("c.searchTerms", { n: allTermes.length })} />}
        />
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          {pending.map((t) => (
            <Chip key={t.id} label={t.label} onClick={() => chooseTerme(t)} color={terme?.id === t.id ? "primary" : "default"} variant={terme?.id === t.id ? "filled" : "outlined"} disabled={step === "generating"} />
          ))}
        </Stack>
        {pending.some((t) => t.label === "chapelle") && !terme && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t("c.scenario")}
          </Alert>
        )}
      </SectionCard>

      {terme && step === "context" && search && (
        <SectionCard step={2} title={t("c.ctxTitle", { term: terme.label })} subtitle={t("c.ctxSub")}>
          <Box sx={{ bgcolor: brand.stoneSoft, borderRadius: 2, p: 1.5, mb: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
              <Box component="pre" sx={{ m: 0, fontSize: "0.7812rem", fontFamily: "Consolas, monospace", bgcolor: "background.paper", px: 1.5, py: 1, borderRadius: 1.5, border: `1px solid ${brand.stoneLight}` }}>{search.query.replace(/^Terme :/, `${t("c.queryTerm")} :`)}</Box>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, flex: 1 }}>
                <Chip size="small" label={t("c.chip.exact", { n: search.exactCount })} />
                <Chip size="small" label={t("c.chip.qdrant", { model: PIPELINE.embedding, k: PIPELINE.candidats, total: BASE_STATS.concepts.toLocaleString(lang === "en" ? "en-GB" : "fr-FR") })} />
                <Chip size="small" label={`Reranker · ${PIPELINE.reranker}`} />
                <Chip size="small" label={t("c.chip.copies", { n: search.copies })} />
                <Chip size="small" label="Neo4j : broader + narrower" />
                <Chip size="small" color="primary" label={t("c.chip.choose", { n: included.length, c: included.filter((e) => e.complet).length })} />
              </Stack>
              <Button size="small" endIcon={<KeyboardArrowDownOutlined sx={{ transform: showRanking ? "rotate(180deg)" : "none" }} />} onClick={() => setShowRanking(!showRanking)}>
                {t("c.ranking")}
              </Button>
            </Stack>
            <Collapse in={showRanking} unmountOnExit>
              <TableContainer sx={{ mt: 1.5, bgcolor: "background.paper", borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("c.col.rank")}</TableCell>
                      <TableCell>{t("c.col.concept")}</TableCell>
                      <TableCell>{t("c.col.thesaurus")}</TableCell>
                      <TableCell align="right">{t("c.col.vecRank")}</TableCell>
                      <TableCell align="right">{t("c.col.vecScore")}</TableCell>
                      <TableCell align="right">{t("c.col.rrScore")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {search.rerankTop.map((c) => (
                      <TableRow key={c.id_concept}>
                        <TableCell>{c.rangFinal}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {c.prefLabel} {c.exact && <Chip size="small" label="exact" sx={{ height: "1.125rem", fontSize: "0.6875rem" }} />}
                          {c.aussi?.length > 0 && <Typography component="span" sx={{ fontSize: "0.7188rem", color: "text.secondary" }}> ({t("c.alsoInShort", { list: c.aussi.join(", ") })})</Typography>}
                        </TableCell>
                        <TableCell>{c.thesaurus}</TableCell>
                        <TableCell align="right">{c.rangVec}</TableCell>
                        <TableCell align="right">{c.vec.toFixed(2)}</TableCell>
                        <TableCell align="right"><b>{c.rr.toFixed(2)}</b></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Box>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 1 }}>{t("c.examples")}</Typography>
              <Stack spacing={1.25}>
                {examples.map((e) => (
                  <ExampleCard key={e.id} e={e} onRemove={() => removeExample(e.id)} onBroader={(v) => setBroader(e.id, v)} />
                ))}
                {examples.length === 0 && <Alert severity="warning">{t("c.noExample")}</Alert>}
              </Stack>
              {!same(examples, initial) && (
                <Button size="small" startIcon={<RestartAltOutlined />} sx={{ mt: 1 }} onClick={() => { setExamples(initial); setRemoved([]); setPromptOverride(null) }}>
                  {t("c.restore")}
                </Button>
              )}
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 1 }}>{t("c.prompt")}</Typography>
              <PromptEditor
                components={PROMPT_B5} extra={extra} prompt={prompt}
                onChange={setPromptOverride} onReset={() => setPromptOverride(null)} edited={promptOverride !== null}
              />
              <TextField select size="small" label={t("c.model")} value={model} onChange={(e) => setModel(e.target.value)} fullWidth sx={{ mt: 2 }}>
                {MODELES.concepts.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
              <Button variant="contained" size="large" fullWidth startIcon={<AutoAwesomeOutlined />} sx={{ mt: 1.5 }} onClick={() => generate(iteration, examples, extra)}>
                {t("c.generate")}
              </Button>
            </Grid>
          </Grid>
        </SectionCard>
      )}

      {terme && step === "generating" && (
        <SectionCard step={3} title={t("c.generating")} subtitle={t("c.iterOf", { model, n: iteration })}>
          <LinearProgress sx={{ borderRadius: 2 }} />
        </SectionCard>
      )}

      {terme && (step === "result" || step === "stored") && result && (
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <SectionCard step={3} title={t("c.proposed")} subtitle={t("c.proposedSub", { n: iteration, model, p: promptId })}>
              <LlmSourceNote llm={llm} />
              <ConceptForm value={result} onChange={setResult} disabled={Boolean(savedId)} edited={edited} />
              {!savedId && !rejectOpen && (
                <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, flexWrap: "wrap", gap: 1 }}>
                  <Button variant="contained" color="success" startIcon={<CheckCircleOutlined />} onClick={accept} disabled={edited.length > 0}>{t("c.accept")}</Button>
                  <Button variant="contained" color="warning" startIcon={<EditOutlined />} onClick={accept} disabled={edited.length === 0}>{t("c.acceptFix")}</Button>
                  <Button variant="outlined" color="error" startIcon={<CloseOutlined />} onClick={() => setRejectOpen(true)}>{t("c.reject")}</Button>
                </Stack>
              )}
              {!savedId && rejectOpen && (
                <RejectPanel
                  reason={reason} setReason={setReason} extra={pendingExtra} setExtra={setPendingExtra} options={PROMPT_OPTIONS}
                  onCancel={() => setRejectOpen(false)}
                  onBackToContext={() => { setLog([...log, entry("rejeté", reason.trim() || t("c.backToCtx"))]); setIteration(iteration + 1); setReason(""); setRejectOpen(false); setStep("context") }}
                  onRelaunch={relaunch}
                />
              )}
              {savedId && step === "result" && (
                <Box sx={{ mt: 2.5 }}>
                  <Alert severity="success" sx={{ mb: 1.5 }}>{t("c.savedMsg")}</Alert>
                  <Button variant="contained" startIcon={<CloudUploadOutlined />} onClick={store}>{t("c.store")}</Button>
                </Box>
              )}
              {step === "stored" && (
                <Box sx={{ mt: 2.5 }}>
                  <Alert severity="success" sx={{ mb: 1.5 }}>{t("c.storedMsg")}</Alert>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" endIcon={<ArrowForwardOutlined />} onClick={() => navigate("/thesaurus", { state: { conceptId: savedId } })}>{t("c.attach")}</Button>
                    <Button variant="outlined" onClick={nextTerme}>{t("c.nextTerm")}</Button>
                  </Stack>
                </Box>
              )}
            </SectionCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{t("c.usedCtx")}</Typography>
                <Stack spacing={0.75}>
                  {included.map((e) => (
                    <Box key={e.id} sx={{ border: `1px solid ${brand.stoneLight}`, borderRadius: 1.5, px: 1.25, py: 0.75, fontSize: "0.8438rem" }}>
                      <b>{e.prefLabel}</b> <Box component="span" sx={{ color: "text.secondary" }}>→ {e.broader || "(vide)"}</Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {terme && (log.length > 0 || step === "result") && step !== "generating" && (
        <SectionCard title={t("c.log")} subtitle={t("c.logSub")}>
          <IterationLog log={log} />
        </SectionCard>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>{t("c.list")}</Typography>
              <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>{t("c.listSub")}</Typography>
            </Box>
            <TextField
              size="small" placeholder={t("c.search")} value={query} onChange={(e) => setQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
            <PublishButton count={publishable.length} onClick={() => { publish("concepts", publishable); setToast(t("c.sent", { n: publishable.length })); setSelected([]) }} />
          </Stack>
          <TableContainer sx={{ maxHeight: "35rem" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>prefLabel</TableCell>
                  <TableCell>altLabel</TableCell>
                  <TableCell>broader</TableCell>
                  <TableCell>narrower</TableCell>
                  <TableCell>{t("c.col.definition")}</TableCell>
                  <TableCell align="center">{t("c.col.iter")}</TableCell>
                  <TableCell>{t("c.col.modelPrompt")}</TableCell>
                  <TableCell>{t("c.col.by")}</TableCell>
                  <TableCell>{t("c.col.date")}</TableCell>
                  <TableCell>OpenTheso</TableCell>
                  <TableCell align="right">{t("c.col.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} hover selected={selected.includes(c.id)}>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.prefLabel}</TableCell>
                    <TableCell sx={{ color: "text.secondary", minWidth: "9rem", maxWidth: "14rem" }}>{c.altLabel.join(", ")}</TableCell>
                    <TableCell>{c.broader}</TableCell>
                    <TableCell sx={{ color: "text.secondary", minWidth: "9rem", maxWidth: "14rem" }}>{c.narrower.join(", ") || "—"}</TableCell>
                    <TableCell sx={{ minWidth: "13.75rem", maxWidth: "20rem" }}>
                      <Tooltip title={c.definition} placement="top-start">
                        <Typography sx={{ fontSize: "0.8125rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.definition}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center"><Chip size="small" label={c.iteration} variant="outlined" /></TableCell>
                    <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", minWidth: "12rem" }}>{c.model}<br /><Box component="span" sx={{ color: "primary.dark", fontWeight: 600 }}>{c.promptId}</Box></TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{c.validated_by}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(c.validated_at)}</TableCell>
                    <TableCell><OpenThesoChip opentheso={c.opentheso} /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <HistoryButton onClick={() => setHistoryOf(c)} />
                      <IconButton size="small" onClick={() => setEditing({ ...c })}><EditOutlined fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setConfirm(c)}><DeleteOutlined fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <HistoryDialog open={Boolean(historyOf)} onClose={() => setHistoryOf(null)} title={historyOf?.prefLabel} history={historyOf?.history} />
      <ConfirmDialog
        open={Boolean(confirm)} title={t("c.deleteTitle")}
        text={t("c.deleteText", { label: confirm?.prefLabel })}
        onClose={() => setConfirm(null)} onConfirm={() => { deleteConcept(confirm.id); setConfirm(null) }}
      />
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="md">
        <DialogTitle>{t("c.editTitle")}</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>{editing && <ConceptForm value={editing} onChange={setEditing} />}</DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => {
              const { prefLabel, altLabel, definition, broader, narrower } = editing
              const wasPublished = editing.opentheso.statut === "publié"
              updateConcept(editing.id, { prefLabel, altLabel, definition, broader, narrower, ...(wasPublished ? { opentheso: { statut: "à mettre à jour" } } : {}) })
              setEditing(null)
            }}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
