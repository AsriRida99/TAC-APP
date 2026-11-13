import { Fragment, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, LinearProgress, MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material"
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined"
import EditOutlined from "@mui/icons-material/EditOutlined"
import DeleteOutlined from "@mui/icons-material/DeleteOutlined"
import CloseOutlined from "@mui/icons-material/CloseOutlined"
import CheckOutlined from "@mui/icons-material/CheckOutlined"
import RestartAltOutlined from "@mui/icons-material/RestartAltOutlined"
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined"
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined"
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined"
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined"
import KeyboardArrowRightOutlined from "@mui/icons-material/KeyboardArrowRightOutlined"
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined"
import { useDemo } from "../demo/DemoStore"
import { MODELES } from "../demo/dictionary"
import { PROMPT_B4, generateThesaurus, thesaurusPromptB4 } from "../demo/llm"
import { BASE_STATS, BASE_THESAURI, PIPELINE, queryDocument, rankThesauri } from "../demo/vectorBase"
import {
  ConfirmDialog, HistoryButton, HistoryDialog, IterationLog, LlmSourceNote, OpenThesoChip, PageHeader, PromptEditor, PublishButton,
  RejectPanel, SectionCard, StepIndicator,
} from "../components/curation"
import StatCard from "../components/StatCard"
import { brand, viz } from "../theme"
import { fmtDate } from "../utils/format"

const DOMAINE_LABEL = {
  mobilier: "Archéologie", architecture: "Architecture", arts: "Histoire de l'art", liturgie: "Objets liturgiques",
  funeraire: "Architecture funéraire", bati: "Patrimoine bâti", parure: "Parure", ceramique: "Céramique",
  general: "Collections", medical: "Médecine",
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sameTitle = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

function ConceptTree({ concepts }) {
  const groups = concepts.reduce((m, c) => m.set(c.broader, [...(m.get(c.broader) || []), c]), new Map())
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
      {[...groups.entries()].map(([broader, cs]) => (
        <Box key={broader} sx={{ bgcolor: brand.stoneSoft, borderRadius: 2, p: 1.25 }}>
          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, mb: 0.5 }}>{broader}</Typography>
          {cs.map((c) => (
            <Typography key={c.id} sx={{ fontSize: "0.8125rem", pl: 1.5, borderLeft: `2px solid ${brand.stoneLight}` }}>
              {c.prefLabel}
              {c.narrower.length > 0 && <Box component="span" sx={{ color: "text.secondary" }}> → {c.narrower.join(", ")}</Box>}
            </Typography>
          ))}
        </Box>
      ))}
    </Box>
  )
}

function ScoreCell({ value }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: "6.875rem" }}>
      <LinearProgress variant="determinate" value={value * 100} sx={{ flex: 1, height: "0.375rem", borderRadius: 3 }} />
      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value.toFixed(2)}</Typography>
    </Stack>
  )
}

export default function Thesaurus() {
  const { db, me, nextPromptId, saveThesaurus, updateThesaurus, deleteThesaurus, publish } = useDemo()
  const location = useLocation()
  const navigate = useNavigate()

  const thesauri = useMemo(
    () => db.thesauri.map((t) => ({ ...t, concepts: db.concepts.filter((c) => t.conceptIds.includes(c.id)) })),
    [db.thesauri, db.concepts]
  )
  const attached = new Set(db.thesauri.flatMap((t) => t.conceptIds))
  const free = db.concepts.filter((c) => !attached.has(c.id))
  const options = [...db.concepts].sort((a, b) =>
    attached.has(a.id) === attached.has(b.id) ? a.prefLabel.localeCompare(b.prefLabel, "fr") : attached.has(a.id) ? 1 : -1
  )
  const appThesauri = db.thesauri.map((t) => ({ id: t.id, titre: t.nom, nb: t.conceptIds.length, domaine: "general" }))

  function buildContext(concept) {
    const { near, candidates } = rankThesauri(concept, appThesauri)
    return { concept, near, candidates, initial: candidates, example: near[0] ? { ...near[0], include: true } : null }
  }

  const [ctx, setCtx] = useState(() => {
    const c = db.concepts.find((x) => x.id === location.state?.conceptId)
    return c ? buildContext(c) : null
  })
  const [extra, setExtra] = useState([])
  const [promptOverride, setPromptOverride] = useState(null)
  const [model, setModel] = useState(MODELES.thesaurus[0])
  const [step, setStep] = useState("context")
  const [iteration, setIteration] = useState(1)
  const [title, setTitle] = useState("")
  const [originalTitle, setOriginalTitle] = useState("")
  const [log, setLog] = useState([])
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pendingExtra, setPendingExtra] = useState([])
  const [savedThId, setSavedThId] = useState(null)
  const [promptId, setPromptId] = useState(null)
  const [editingCand, setEditingCand] = useState(null)
  const [draft, setDraft] = useState("")
  const [showVotes, setShowVotes] = useState(false)
  const [llm, setLlm] = useState(null)

  const [open, setOpen] = useState(null)
  const [selected, setSelected] = useState([])
  const [historyOf, setHistoryOf] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const concept = ctx?.concept
  const example = ctx?.example?.include ? ctx.example : null
  const prompt = ctx ? promptOverride ?? thesaurusPromptB4(concept, example, ctx.candidates, extra) : ""

  function chooseConcept(c) {
    setCtx(buildContext(c))
    setExtra([])
    setPromptOverride(null)
    setStep("context")
    setIteration(1)
    setLog([])
    setRejectOpen(false)
    setSavedThId(null)
  }

  const setCandidates = (candidates) => { setCtx({ ...ctx, candidates }); setPromptOverride(null) }

  async function generate(iter, comps = extra) {
    setStep("generating")
    setRejectOpen(false)
    setPromptId(nextPromptId())
    const p = iter === iteration && promptOverride ? promptOverride : thesaurusPromptB4(concept, example, ctx.candidates, comps)
    const { titre: t, source, erreur } = await generateThesaurus(ctx.candidates, iter, p)
    setLlm({ source, erreur })
    setTitle(t)
    setOriginalTitle(t)
    setStep("result")
  }

  const appMatch = db.thesauri.find((t) => sameTitle(t.nom, title))
  const baseMatch = BASE_THESAURI.find((t) => sameTitle(t.titre, title))
  const edited = title !== originalTitle

  const entry = (decision, note = "") => ({
    n: iteration, date: new Date().toISOString(), user: me, model, promptId, prompt,
    components: ["standard", ...extra], decision, note,
  })

  function accept() {
    const newLog = [...log, entry(edited ? "corrigé" : "accepté")]
    setLog(newLog)
    const id = saveThesaurus(
      {
        existingId: appMatch?.id ?? null,
        nom: title.trim(),
        domaine: baseMatch ? DOMAINE_LABEL[baseMatch.domaine] : "Patrimoine",
        langue: "fr",
        conceptIds: [concept.id],
      },
      { model, history: newLog }
    )
    setSavedThId(id)
  }

  function relaunch() {
    setLog([...log, entry("rejeté", reason.trim())])
    const nextExtra = [...new Set([...extra, ...pendingExtra])]
    setExtra(nextExtra)
    setPromptOverride(null)
    setReason("")
    setPendingExtra([])
    setIteration(iteration + 1)
    generate(iteration + 1, nextExtra)
  }

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const publishable = selected.filter((id) => db.thesauri.find((t) => t.id === id)?.opentheso.statut !== "publié")

  return (
    <Box>
      <PageHeader
        title="Rattachement au thésaurus"
        subtitle="Les thésaurus candidats sont classés à partir de la base vectorielle et du graphe, vous validez le contexte, puis le modèle propose le rattachement."
        actions={ctx && <StepIndicator step={step} />}
      />

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Thésaurus" value={thesauri.length} icon={AccountTreeOutlined} color={viz.amber} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Concepts rattachés" value={attached.size} color={brand.slate} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Concepts à rattacher" value={free.length} color={brand.stone} /></Grid>
      </Grid>

      <SectionCard step={1} title="Choisir un concept" subtitle="Concepts validés qui n'appartiennent encore à aucun thésaurus">
        <Autocomplete
          options={options}
          groupBy={(c) => (attached.has(c.id) ? "Déjà rattaché" : "À rattacher")}
          getOptionLabel={(c) => c.prefLabel}
          getOptionDisabled={(c) => attached.has(c.id)}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={concept ?? null}
          onChange={(_, c) => c && chooseConcept(c)}
          openOnFocus
          disabled={step === "generating"}
          noOptionsText="Aucun concept trouvé"
          sx={{ maxWidth: "32.5rem", mb: free.length ? 2 : 0 }}
          renderInput={(params) => <TextField {...params} size="small" placeholder={`Rechercher parmi les ${options.length} concepts…`} />}
        />
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          {free.map((c) => (
            <Chip key={c.id} label={`${c.prefLabel} · ${c.broader}`} onClick={() => chooseConcept(c)} color={concept?.id === c.id ? "primary" : "default"} variant={concept?.id === c.id ? "filled" : "outlined"} disabled={step === "generating"} />
          ))}
        </Stack>
        {free.length === 0 && <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>Tous les concepts validés sont rattachés.</Typography>}
      </SectionCard>

      {ctx && step === "context" && (
        <SectionCard step={2} title={`Contexte pour « ${concept.prefLabel} »`} subtitle="Point de contrôle 1 : vérifiez les thésaurus candidats et l'exemple avant la génération.">
          <Box sx={{ bgcolor: brand.stoneSoft, borderRadius: 2, p: 1.5, mb: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
              <Box component="pre" sx={{ m: 0, fontSize: "0.75rem", fontFamily: "Consolas, monospace", bgcolor: "background.paper", px: 1.5, py: 1, borderRadius: 1.5, border: `1px solid ${brand.stoneLight}`, whiteSpace: "pre-wrap", maxWidth: { md: 380 } }}>
                {queryDocument(concept.prefLabel, concept)}
              </Box>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, flex: 1 }}>
                <Chip size="small" label={`Base des thésaurus : ${BASE_STATS.thesaurus.toLocaleString("fr-FR")}`} />
                <Chip size="small" label="Vote : 10 concepts les plus proches" />
                <Chip size="small" label="Neo4j : APPARTIENT" />
                <Chip size="small" color="primary" label={`score = ${1 - PIPELINE.poidsVote} × similarité + ${PIPELINE.poidsVote} × vote`} />
              </Stack>
              <Button size="small" endIcon={<KeyboardArrowDownOutlined sx={{ transform: showVotes ? "rotate(180deg)" : "none" }} />} onClick={() => setShowVotes(!showVotes)}>
                Concepts qui votent
              </Button>
            </Stack>
            <Collapse in={showVotes} unmountOnExit>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                {ctx.near.map((c) => (
                  <Chip key={c.id_concept} size="small" variant="outlined" sx={{ bgcolor: "background.paper" }}
                    label={`${c.prefLabel} → ${c.thesaurus}${c.aussi?.length ? ` (+${c.aussi.length})` : ""}`} />
                ))}
              </Stack>
            </Collapse>
          </Box>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 1 }}>Thésaurus candidats</Typography>
              <TableContainer sx={{ border: `1px solid ${brand.stoneLight}`, borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Thésaurus</TableCell>
                      <TableCell align="right">Concepts</TableCell>
                      <TableCell align="right">Similarité</TableCell>
                      <TableCell align="right">Vote</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ctx.candidates.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {editingCand === c.id ? (
                            <Stack direction="row" sx={{ alignItems: "center" }}>
                              <TextField size="small" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} sx={{ width: "13.75rem", "& input": { py: 0.5 } }}
                                onKeyDown={(e) => { if (e.key === "Enter") { setCandidates(ctx.candidates.map((x) => (x.id === c.id ? { ...x, titre: draft.trim() || x.titre } : x))); setEditingCand(null) } }} />
                              <IconButton size="small" onClick={() => { setCandidates(ctx.candidates.map((x) => (x.id === c.id ? { ...x, titre: draft.trim() || x.titre } : x))); setEditingCand(null) }}><CheckOutlined fontSize="small" /></IconButton>
                            </Stack>
                          ) : (
                            <>{c.titre}<Typography sx={{ fontSize: "0.7188rem", color: "text.secondary" }}>{c.id}</Typography></>
                          )}
                        </TableCell>
                        <TableCell align="right">{c.nb.toLocaleString("fr-FR")}</TableCell>
                        <TableCell align="right">{c.sim.toFixed(2)}</TableCell>
                        <TableCell align="right">{Math.round(c.vote * 10)} / 10</TableCell>
                        <TableCell><ScoreCell value={c.score} /></TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <IconButton size="small" onClick={() => { setEditingCand(c.id); setDraft(c.titre) }}><EditOutlined fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => setCandidates(ctx.candidates.filter((x) => x.id !== c.id))}><CloseOutlined fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mt: 2, mb: 1 }}>Exemple (1 concept proche et son thésaurus)</Typography>
              {ctx.example ? (
                <Box sx={{ border: `1px solid ${brand.stoneLight}`, borderRadius: 2, p: 1.5, bgcolor: ctx.example.include ? "background.paper" : brand.stoneSoft, opacity: ctx.example.include ? 1 : 0.6 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Checkbox size="small" checked={ctx.example.include} sx={{ p: 0.5 }} onChange={() => { setCtx({ ...ctx, example: { ...ctx.example, include: !ctx.example.include } }); setPromptOverride(null) }} />
                    <Typography sx={{ fontWeight: 700, flex: 1 }}>{ctx.example.prefLabel}</Typography>
                    <Typography sx={{ fontSize: "0.7812rem", color: "text.secondary" }}>—APPARTIENT→</Typography>
                    <Chip size="small" label={ctx.example.thesaurus} />
                  </Stack>
                  <Typography sx={{ fontSize: "0.7812rem", color: "text.secondary", pl: 4.5 }}>broader : {ctx.example.broader}</Typography>
                </Box>
              ) : <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>Aucun exemple.</Typography>}

              {!same(ctx.candidates, ctx.initial) && (
                <Button size="small" startIcon={<RestartAltOutlined />} sx={{ mt: 1 }} onClick={() => setCandidates(ctx.initial)}>Rétablir les candidats initiaux</Button>
              )}
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 1 }}>Prompt</Typography>
              <PromptEditor components={PROMPT_B4} extra={extra} prompt={prompt} onChange={setPromptOverride} onReset={() => setPromptOverride(null)} edited={promptOverride !== null} />
              <TextField select size="small" label="Modèle" value={model} onChange={(e) => setModel(e.target.value)} fullWidth sx={{ mt: 2 }}>
                {MODELES.thesaurus.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
              <Button variant="contained" size="large" fullWidth startIcon={<AutoAwesomeOutlined />} sx={{ mt: 1.5 }} disabled={!ctx.candidates.length} onClick={() => generate(iteration)}>
                Valider le contexte et générer
              </Button>
            </Grid>
          </Grid>
        </SectionCard>
      )}

      {ctx && step === "generating" && (
        <SectionCard step={3} title="Génération en cours…" subtitle={`${model} · itération ${iteration}`}>
          <LinearProgress sx={{ borderRadius: 2 }} />
        </SectionCard>
      )}

      {ctx && (step === "result" || step === "stored") && (
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <SectionCard step={3} title="Thésaurus proposé" subtitle={`Point de contrôle 2 · itération ${iteration} · ${model} · prompt ${promptId}`}>
              <LlmSourceNote llm={llm} />
              <Typography sx={{ fontFamily: "Consolas, monospace", fontSize: "0.75rem", color: "text.secondary", mb: 0.5 }}>
                titre {edited && <Chip size="small" label="modifié" color="warning" variant="outlined" sx={{ height: "1.125rem", fontSize: "0.6875rem", ml: 1 }} />}
              </Typography>
              <TextField value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" disabled={Boolean(savedThId)} />
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.25 }}>
                {appMatch || baseMatch ? (
                  <>
                    <Chip size="small" color="success" label="Thésaurus existant" />
                    <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>Identifiant : <code>{appMatch?.id ?? baseMatch.id}</code></Typography>
                  </>
                ) : (
                  <Chip size="small" color="primary" label="Nouveau thésaurus" />
                )}
              </Stack>
              {!savedThId && !rejectOpen && (
                <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, flexWrap: "wrap", gap: 1 }}>
                  <Button variant="contained" color="success" startIcon={<CheckCircleOutlined />} onClick={accept} disabled={edited || !title.trim()}>Accepter</Button>
                  <Button variant="contained" color="warning" startIcon={<EditOutlined />} onClick={accept} disabled={!edited || !title.trim()}>Valider la correction</Button>
                  <Button variant="outlined" color="error" startIcon={<CloseOutlined />} onClick={() => setRejectOpen(true)}>Rejeter</Button>
                </Stack>
              )}
              {!savedThId && rejectOpen && (
                <RejectPanel
                  reason={reason} setReason={setReason} extra={pendingExtra} setExtra={setPendingExtra} options={["CONTRAINTES"]}
                  onCancel={() => setRejectOpen(false)}
                  onBackToContext={() => { setLog([...log, entry("rejeté", reason.trim() || "Retour au contexte")]); setIteration(iteration + 1); setReason(""); setRejectOpen(false); setStep("context") }}
                  onRelaunch={relaunch}
                />
              )}
              {savedThId && step === "result" && (
                <Box sx={{ mt: 2.5 }}>
                  <Alert severity="success" sx={{ mb: 1.5 }}>Rattachement validé. Vous pouvez maintenant le stocker dans OpenTheso.</Alert>
                  <Button variant="contained" startIcon={<CloudUploadOutlined />} onClick={() => { publish("thesauri", [savedThId]); setStep("stored") }}>Stocker dans OpenTheso</Button>
                </Box>
              )}
              {step === "stored" && (
                <Box sx={{ mt: 2.5 }}>
                  <Alert severity="success" sx={{ mb: 1.5 }}>« {concept.prefLabel} » est rattaché à « {title} » dans OpenTheso (simulation).</Alert>
                  <Stack direction="row" spacing={1}>
                    {free.length > 0 && <Button variant="outlined" onClick={() => chooseConcept(free[0])}>Concept suivant</Button>}
                    <Button variant="contained" endIcon={<ArrowForwardOutlined />} onClick={() => navigate("/alignements")}>Aligner le thésaurus</Button>
                  </Stack>
                </Box>
              )}
            </SectionCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Contexte utilisé</Typography>
                <Stack spacing={0.75}>
                  {ctx.candidates.map((c) => (
                    <Stack key={c.id} direction="row" sx={{ justifyContent: "space-between", border: `1px solid ${brand.stoneLight}`, borderRadius: 1.5, px: 1.25, py: 0.75, fontSize: "0.8438rem" }}>
                      <b>{c.titre}</b><Box component="span" sx={{ color: "text.secondary" }}>{c.score.toFixed(2)}</Box>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {ctx && (log.length > 0 || step === "result") && step !== "generating" && (
        <SectionCard title="Journal des itérations" subtitle="Chaque génération est conservée : modèle, composants du prompt, décision et motif.">
          <IterationLog log={log} />
        </SectionCard>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>Thésaurus enregistrés</Typography>
              <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>Cliquez sur une ligne pour voir l'arborescence des concepts.</Typography>
            </Box>
            <PublishButton count={publishable.length} onClick={() => { publish("thesauri", publishable); setToast(`${publishable.length} thésaurus envoyé(s) vers OpenTheso`); setSelected([]) }} />
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Nom</TableCell>
                  <TableCell>Domaine</TableCell>
                  <TableCell>Langue</TableCell>
                  <TableCell align="center">Concepts</TableCell>
                  <TableCell align="center">Itér.</TableCell>
                  <TableCell>Validé par</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>OpenTheso</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {thesauri.map((t) => (
                  <Fragment key={t.id}>
                    <TableRow hover selected={selected.includes(t.id)} sx={{ cursor: "pointer", "& > td": { borderBottom: open === t.id ? 0 : undefined } }} onClick={() => setOpen(open === t.id ? null : t.id)}>
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}><Checkbox size="small" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} /></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {open === t.id ? <KeyboardArrowDownOutlined fontSize="small" sx={{ verticalAlign: -5 }} /> : <KeyboardArrowRightOutlined fontSize="small" sx={{ verticalAlign: -5 }} />} {t.nom}
                      </TableCell>
                      <TableCell>{t.domaine}</TableCell>
                      <TableCell>{t.langue}</TableCell>
                      <TableCell align="center">{t.concepts.length}</TableCell>
                      <TableCell align="center"><Chip size="small" label={t.iteration} variant="outlined" /></TableCell>
                      <TableCell>{t.validated_by}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(t.validated_at)}</TableCell>
                      <TableCell><OpenThesoChip opentheso={t.opentheso} /></TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        <HistoryButton onClick={() => setHistoryOf(t)} />
                        <IconButton size="small" onClick={() => setEditing({ id: t.id, nom: t.nom, domaine: t.domaine, langue: t.langue })}><EditOutlined fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setConfirm(t)}><DeleteOutlined fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={10} sx={{ py: 0 }}>
                        <Collapse in={open === t.id} unmountOnExit>
                          <Box sx={{ py: 2 }}><ConceptTree concepts={t.concepts} /></Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <HistoryDialog open={Boolean(historyOf)} onClose={() => setHistoryOf(null)} title={historyOf?.nom} history={historyOf?.history} />
      <ConfirmDialog
        open={Boolean(confirm)} title="Supprimer le thésaurus"
        text={`Supprimer « ${confirm?.nom} » ? Ses concepts redeviendront « à rattacher » ; ses alignements et exports seront supprimés.`}
        onClose={() => setConfirm(null)} onConfirm={() => { deleteThesaurus(confirm.id); setConfirm(null) }}
      />
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>Modifier le thésaurus</DialogTitle>
        <DialogContent>
          {editing && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Nom" value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} />
              <TextField label="Domaine" value={editing.domaine} onChange={(e) => setEditing({ ...editing, domaine: e.target.value })} />
              <TextField label="Langue" value={editing.langue} onChange={(e) => setEditing({ ...editing, langue: e.target.value })} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setEditing(null)}>Annuler</Button>
          <Button variant="contained" onClick={() => { const { id, ...patch } = editing; updateThesaurus(id, patch); setEditing(null) }}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
