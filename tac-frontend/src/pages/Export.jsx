import { useState } from "react"
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid,
  IconButton, LinearProgress, MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from "@mui/material"
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined"
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined"
import DeleteOutlined from "@mui/icons-material/DeleteOutlined"
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined"
import { useDemo } from "../demo/DemoStore"
import { skosTurtle, wait } from "../demo/llm"
import { ConfirmDialog, OpenThesoChip, PageHeader, PublishButton, SectionCard, WipBanner } from "../components/curation"
import StatCard from "../components/StatCard"
import { brand, viz } from "../theme"
import { fmtDate } from "../utils/format"

function download(exp) {
  const blob = new Blob([exp.contenu], { type: "text/turtle;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${exp.nom.replace(/[^\p{L}\p{N}]+/gu, "_")}.ttl`
  a.click()
  URL.revokeObjectURL(url)
}

const countConcepts = (ttl) => (ttl.match(/ a skos:Concept/g) || []).length

export default function Export() {
  const { db, addExport, updateExport, deleteExport, publish } = useDemo()
  const [thesaurusId, setThesaurusId] = useState("")
  const [withAlign, setWithAlign] = useState(true)
  const [loading, setLoading] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [selected, setSelected] = useState([])
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  async function generate() {
    const th = db.thesauri.find((t) => t.id === thesaurusId)
    setLoading(true)
    await wait(900)
    const concepts = db.concepts.filter((c) => th.conceptIds.includes(c.id))
    const aligns = withAlign ? db.alignements.filter((a) => a.thesaurusId === th.id) : []
    const exp = addExport({ thesaurusId: th.id, nom: `${th.nom} — SKOS`, format: "Turtle (.ttl)", contenu: skosTurtle(th, concepts, aligns) })
    setLoading(false)
    setViewing({ ...exp, draft: exp.contenu })
  }

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const publishable = selected.filter((id) => db.exports.find((e) => e.id === id)?.opentheso.statut !== "publié")
  const thName = (id) => db.thesauri.find((t) => t.id === id)?.nom ?? "—"

  return (
    <Box>
      <PageHeader title="Export SKOS" subtitle="Produisez le thésaurus validé au format SKOS (RDF Turtle), modifiez-le, téléchargez-le ou envoyez-le vers OpenTheso." />
      <WipBanner />

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Exports" value={db.exports.length} icon={FileDownloadOutlined} color={viz.rose} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Publiés sur OpenTheso" value={db.exports.filter((e) => e.opentheso.statut === "publié").length} color={brand.ok} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Thésaurus sans export" value={db.thesauri.filter((t) => !db.exports.some((e) => e.thesaurusId === t.id)).length} color={brand.stone} /></Grid>
      </Grid>

      <SectionCard step={1} title="Générer un export" subtitle="Les concepts, relations broader/narrower et alignements validés sont convertis en SKOS.">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
          <TextField select size="small" label="Thésaurus" value={thesaurusId} onChange={(e) => setThesaurusId(e.target.value)} sx={{ minWidth: "18.75rem" }}>
            {db.thesauri.map((t) => <MenuItem key={t.id} value={t.id}>{t.nom} ({t.conceptIds.length} concepts)</MenuItem>)}
          </TextField>
          <FormControlLabel control={<Checkbox checked={withAlign} onChange={(e) => setWithAlign(e.target.checked)} />} label="Inclure les alignements validés" />
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" size="large" startIcon={<AutoAwesomeOutlined />} disabled={!thesaurusId || loading} onClick={generate}>
            {loading ? "Génération…" : "Générer le SKOS"}
          </Button>
        </Stack>
        {loading && <LinearProgress sx={{ mt: 2, borderRadius: 2 }} />}
      </SectionCard>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, flex: 1 }}>Exports enregistrés</Typography>
            <PublishButton count={publishable.length} onClick={() => { publish("exports", publishable); setToast(`${publishable.length} export(s) envoyé(s) vers OpenTheso`); setSelected([]) }} />
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Nom</TableCell>
                  <TableCell>Thésaurus</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell align="center">Concepts</TableCell>
                  <TableCell>Créé par</TableCell>
                  <TableCell>Modifié le</TableCell>
                  <TableCell>OpenTheso</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {db.exports.map((e) => (
                  <TableRow key={e.id} hover selected={selected.includes(e.id)}>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{e.nom}</TableCell>
                    <TableCell>{thName(e.thesaurusId)}</TableCell>
                    <TableCell>{e.format}</TableCell>
                    <TableCell align="center">{countConcepts(e.contenu)}</TableCell>
                    <TableCell>{e.created_by}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(e.updated_at)}</TableCell>
                    <TableCell><OpenThesoChip opentheso={e.opentheso} /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Voir et modifier"><IconButton size="small" onClick={() => setViewing({ ...e, draft: e.contenu })}><VisibilityOutlined fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Télécharger (.ttl)"><IconButton size="small" onClick={() => download(e)}><FileDownloadOutlined fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Supprimer"><IconButton size="small" onClick={() => setConfirm(e)}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {db.exports.length === 0 && <Alert severity="info" sx={{ mt: 2 }}>Aucun export. Générez-en un à partir d'un thésaurus.</Alert>}
        </CardContent>
      </Card>

      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} fullWidth maxWidth="lg">
        <DialogTitle>{viewing?.nom}</DialogTitle>
        <DialogContent dividers>
          {viewing && (
            <TextField
              value={viewing.draft}
              onChange={(e) => setViewing({ ...viewing, draft: e.target.value })}
              multiline minRows={18} maxRows={30} fullWidth
              sx={{ "& textarea": { fontFamily: "Consolas, monospace", fontSize: "0.7812rem", lineHeight: 1.55 } }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<FileDownloadOutlined />} onClick={() => download({ ...viewing, contenu: viewing.draft })}>Télécharger</Button>
          <Box sx={{ flex: 1 }} />
          <Button color="inherit" onClick={() => setViewing(null)}>Fermer</Button>
          <Button
            variant="contained"
            disabled={viewing?.draft === viewing?.contenu}
            onClick={() => {
              const wasPublished = viewing.opentheso.statut === "publié"
              updateExport(viewing.id, { contenu: viewing.draft, ...(wasPublished ? { opentheso: { statut: "à mettre à jour" } } : {}) })
              setToast("Export mis à jour")
              setViewing(null)
            }}
          >
            Enregistrer les modifications
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(confirm)} title="Supprimer l'export" text={`Supprimer « ${confirm?.nom} » ?`} onClose={() => setConfirm(null)} onConfirm={() => { deleteExport(confirm.id); setConfirm(null) }} />
      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
