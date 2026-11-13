import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Grid, IconButton, InputAdornment, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material"
import AddOutlined from "@mui/icons-material/AddOutlined"
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined"
import SearchOutlined from "@mui/icons-material/SearchOutlined"
import EditOutlined from "@mui/icons-material/EditOutlined"
import DeleteOutlined from "@mui/icons-material/DeleteOutlined"
import CheckOutlined from "@mui/icons-material/CheckOutlined"
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined"
import { useDemo } from "../demo/DemoStore"
import { ConfirmDialog, PageHeader, StatusChip } from "../components/curation"
import StatCard from "../components/StatCard"
import { brand, viz } from "../theme"
import { fmtDate } from "../utils/format"

function parseFile(name, text) {
  if (name.toLowerCase().endsWith(".json")) {
    let data = JSON.parse(text)
    if (!Array.isArray(data)) data = Object.values(data).find(Array.isArray) || []
    return data.map((x) => (typeof x === "string" ? x : x.label || x.terme || x.term || x.prefLabel || "")).filter(Boolean)
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return []
  const sep = lines[0].includes(";") ? ";" : ","
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/"/g, ""))
  let col = header.findIndex((h) => ["label", "terme", "term", "termes", "preflabel"].includes(h))
  const rows = col >= 0 ? lines.slice(1) : lines
  if (col < 0) col = 0
  return rows.map((l) => (l.split(sep)[col] || "").trim().replace(/^"|"$/g, "")).filter(Boolean)
}

export default function Termes() {
  const { db, addTermes, updateTerme, deleteTermes } = useDemo()
  const navigate = useNavigate()
  const [label, setLabel] = useState("")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState([])
  const [editId, setEditId] = useState(null)
  const [editLabel, setEditLabel] = useState("")
  const [toast, setToast] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const termes = db.termes
  const filtered = useMemo(
    () => termes.filter((t) => t.label.toLowerCase().includes(search.toLowerCase())),
    [termes, search]
  )
  const nouveaux = termes.filter((t) => t.statut === "nouveau").length
  const selectable = filtered.map((t) => t.id)
  const allChecked = selectable.length > 0 && selectable.every((id) => selected.includes(id))

  function addOne(e) {
    e.preventDefault()
    const n = addTermes([label], "saisie")
    setToast(n ? { severity: "success", text: `Terme « ${label.trim()} » ajouté` } : { severity: "warning", text: "Ce terme existe déjà" })
    setLabel("")
  }

  async function importFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const labels = parseFile(file.name, await file.text())
      const n = addTermes(labels, file.name.toLowerCase().endsWith(".json") ? "import JSON" : "import CSV")
      setToast({ severity: "success", text: `${file.name} : ${labels.length} termes lus, ${n} nouveaux ajoutés (${labels.length - n} doublons ignorés)` })
    } catch {
      setToast({ severity: "error", text: `Impossible de lire ${file.name}. Utilisez un CSV (une colonne « label ») ou un JSON (liste de termes).` })
    }
  }

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const toggleAll = () => setSelected(allChecked ? selected.filter((id) => !selectable.includes(id)) : [...new Set([...selected, ...selectable])])

  const selectedNew = selected.filter((id) => termes.find((t) => t.id === id)?.statut === "nouveau")

  return (
    <Box>
      <PageHeader
        title="Termes"
        subtitle="Point d'entrée du système : saisissez un terme ou importez une liste, puis envoyez-les à la génération de concepts."
        actions={
          <Button variant="contained" endIcon={<ArrowForwardOutlined />} disabled={!selectedNew.length} onClick={() => navigate("/concepts", { state: { termeIds: selectedNew } })}>
            Générer les concepts ({selectedNew.length})
          </Button>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Termes au total" value={termes.length} color={brand.slate} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="À traiter" value={nouveaux} color={viz.indigo} hint="Sans concept validé" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><StatCard label="Avec concept" value={termes.length - nouveaux} color={brand.ok} /></Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Saisir un terme</Typography>
              <Stack component="form" direction="row" spacing={1} onSubmit={addOne}>
                <TextField size="small" fullWidth placeholder="ex. chancel, ciboire, aquamanile…" value={label} onChange={(e) => setLabel(e.target.value)} />
                <Button type="submit" variant="contained" startIcon={<AddOutlined />} disabled={!label.trim()}>Ajouter</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Importer une liste</Typography>
              <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 1.5 }}>
                CSV (une colonne « label » ou un terme par ligne) ou JSON (liste de termes). Les doublons sont ignorés.
              </Typography>
              <Button component="label" variant="outlined" startIcon={<UploadFileOutlined />}>
                Choisir un fichier CSV ou JSON
                <input hidden type="file" accept=".csv,.json,.txt" onChange={importFile} />
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, flex: 1 }}>Liste des termes</Typography>
            <TextField
              size="small"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
            <Button color="error" startIcon={<DeleteOutlined />} disabled={!selected.length} onClick={() => setConfirm(selected)}>
              Supprimer ({selected.length})
            </Button>
          </Stack>
          <TableContainer sx={{ maxHeight: "32.5rem" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"><Checkbox size="small" checked={allChecked} onChange={toggleAll} /></TableCell>
                  <TableCell>Terme</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Ajouté par</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} hover selected={selected.includes(t.id)}>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {editId === t.id ? (
                        <TextField size="small" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} autoFocus />
                      ) : t.label}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{t.source}</TableCell>
                    <TableCell><StatusChip statut={t.statut} /></TableCell>
                    <TableCell>{t.created_by}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(t.created_at, false)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {editId === t.id ? (
                        <IconButton size="small" color="primary" onClick={() => { updateTerme(t.id, editLabel.trim() || t.label); setEditId(null) }}><CheckOutlined fontSize="small" /></IconButton>
                      ) : (
                        <IconButton size="small" onClick={() => { setEditId(t.id); setEditLabel(t.label) }}><EditOutlined fontSize="small" /></IconButton>
                      )}
                      <IconButton size="small" onClick={() => setConfirm([t.id])}><DeleteOutlined fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mt: 1.5 }}>{filtered.length} terme(s) affiché(s)</Typography>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Supprimer les termes"
        text={`Supprimer ${confirm?.length} terme(s) ? Cette action est définitive.`}
        onClose={() => setConfirm(null)}
        onConfirm={() => { deleteTermes(confirm); setSelected((s) => s.filter((id) => !confirm.includes(id))); setConfirm(null) }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)} variant="filled">{toast.text}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
