import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Alert, Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, MenuItem, Snackbar, Stack, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material"
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined"
import CancelOutlined from "@mui/icons-material/CancelOutlined"
import BlockOutlined from "@mui/icons-material/BlockOutlined"
import PlayCircleOutlined from "@mui/icons-material/PlayCircleOutlined"
import DeleteOutlined from "@mui/icons-material/DeleteOutlined"
import SearchOutlined from "@mui/icons-material/SearchOutlined"
import RefreshOutlined from "@mui/icons-material/RefreshOutlined"
import CheckOutlined from "@mui/icons-material/CheckOutlined"
import RemoveOutlined from "@mui/icons-material/RemoveOutlined"
import { API } from "../config"
import { apiFetch } from "../api/http"
import { useAuth } from "../auth/AuthContext"
import { ConfirmDialog, PageHeader, StatusChip } from "../components/curation"
import StatCard from "../components/StatCard"
import UserAvatar from "../layout/UserAvatar"
import { brand, viz } from "../theme"
import { fmtDate } from "../utils/format"

const ROLE_LABELS = { admin: "Administrateur", curateur: "Curateur", lecteur: "Lecteur" }

const DROITS = [
  ["Consulter les termes, concepts, thésaurus et tableaux de bord", ["admin", "curateur", "lecteur"]],
  ["Saisir et importer des termes", ["admin", "curateur"]],
  ["Générer, modifier le prompt, valider ou rejeter", ["admin", "curateur"]],
  ["Envoyer vers OpenTheso et exporter en SKOS", ["admin", "curateur"]],
  ["Lancer une synchronisation Qdrant / Neo4j", ["admin"]],
  ["Accepter les inscriptions et gérer les comptes", ["admin"]],
]

const FILTRES = [
  ["tous", "Tous"],
  ["en attente", "En attente"],
  ["actif", "Actifs"],
  ["refusé", "Refusés"],
  ["désactivé", "Désactivés"],
]

export default function Administration() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filtre, setFiltre] = useState("tous")
  const [search, setSearch] = useState("")
  const [pendingRoles, setPendingRoles] = useState({})
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch(API.auth, "/admin/users")
      setUsers(data.users)
      setError("")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function change(u, patch, message) {
    try {
      const updated = await apiFetch(API.auth, `/admin/users/${u.id}`, { method: "PATCH", body: patch })
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)))
      setToast({ severity: "success", text: message })
    } catch (err) {
      setToast({ severity: "error", text: err.message })
    }
  }

  async function remove(u) {
    try {
      await apiFetch(API.auth, `/admin/users/${u.id}`, { method: "DELETE" })
      setUsers((list) => list.filter((x) => x.id !== u.id))
      setToast({ severity: "success", text: `Compte de ${u.nom} supprimé` })
    } catch (err) {
      setToast({ severity: "error", text: err.message })
    }
    setConfirm(null)
  }

  const pending = users.filter((u) => u.statut === "en attente")
  const count = (statut) => users.filter((u) => u.statut === statut).length
  const shown = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        (filtre === "tous" || u.statut === filtre) &&
        [u.nom, u.email, u.organisation].some((v) => (v || "").toLowerCase().includes(q))
    )
  }, [users, filtre, search])

  return (
    <Box>
      <PageHeader
        title="Utilisateurs"
        subtitle="Acceptez les demandes d'inscription, attribuez les rôles et gérez l'accès des comptes."
        actions={<Button variant="outlined" startIcon={<RefreshOutlined />} onClick={load} disabled={loading}>Actualiser</Button>}
      />

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}. Vérifiez que le service d'authentification (port 8010) est lancé.</Alert>}

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Comptes" value={users.length} color={brand.slate} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Demandes en attente" value={pending.length} color={viz.amber} hint={pending.length ? "À traiter ci-dessous" : "Aucune demande"} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Comptes actifs" value={count("actif")} color={brand.ok} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Administrateurs" value={users.filter((u) => u.role === "admin").length} color={brand.ink} /></Grid>
      </Grid>

      {pending.length > 0 && (
        <Card sx={{ mb: 2.5, borderColor: brand.accent }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Demandes d'inscription ({pending.length})</Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 2 }}>Choisissez le rôle à attribuer, puis acceptez ou refusez la demande.</Typography>
            <Stack spacing={1.5}>
              {pending.map((u) => (
                <Stack
                  key={u.id}
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{ alignItems: { md: "center" }, border: `1px solid ${brand.stoneLight}`, borderRadius: 2, p: 1.5 }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
                    <UserAvatar user={u} size={44} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>{u.nom}</Typography>
                      <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                        {u.email}{u.organisation ? ` · ${u.organisation}` : ""} · demandé le {fmtDate(u.created_at)}
                      </Typography>
                      {u.motif && <Typography sx={{ fontSize: "0.8125rem", mt: 0.5, fontStyle: "italic" }}>« {u.motif} »</Typography>}
                    </Box>
                  </Stack>
                  <TextField
                    select size="small" label="Rôle" sx={{ minWidth: "10rem" }}
                    value={pendingRoles[u.id] || u.role}
                    onChange={(e) => setPendingRoles({ ...pendingRoles, [u.id]: e.target.value })}
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </TextField>
                  <Stack direction="row" spacing={1}>
                    <Button color="inherit" startIcon={<CancelOutlined />} onClick={() => change(u, { statut: "refusé" }, `Demande de ${u.nom} refusée`)}>Refuser</Button>
                    <Button
                      variant="contained" startIcon={<CheckCircleOutlined />}
                      onClick={() => change(u, { statut: "actif", role: pendingRoles[u.id] || u.role }, `${u.nom} peut maintenant se connecter`)}
                    >
                      Accepter
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" }, mb: 1 }}>
            <Typography sx={{ fontWeight: 700, flex: 1 }}>Comptes</Typography>
            <TextField
              size="small" placeholder="Nom, email, établissement…" value={search} onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Stack>
          <Tabs value={filtre} onChange={(_, v) => setFiltre(v)} variant="scrollable" sx={{ mb: 1.5, borderBottom: `1px solid ${brand.stoneLight}` }}>
            {FILTRES.map(([k, label]) => (
              <Tab key={k} value={k} label={`${label} (${k === "tous" ? users.length : count(k)})`} />
            ))}
          </Tabs>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Établissement</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Inscrit le</TableCell>
                  <TableCell>Dernière connexion</TableCell>
                  <TableCell>Décision</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((u) => {
                  const self = u.id === me?.id
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                          <UserAvatar user={u} size={34} />
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                              {u.nom} {self && <Chip size="small" label="vous" sx={{ ml: 0.5, height: "1.125rem", fontSize: "0.6875rem" }} />}
                            </Typography>
                            <Typography sx={{ fontSize: "0.7812rem", color: "text.secondary" }}>{u.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{u.organisation || "—"}</TableCell>
                      <TableCell>
                        <TextField
                          select size="small" variant="standard" value={u.role} disabled={self}
                          onChange={(e) => change(u, { role: e.target.value }, `${u.nom} est maintenant ${ROLE_LABELS[e.target.value].toLowerCase()}`)}
                        >
                          {Object.entries(ROLE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell><StatusChip statut={u.statut} /></TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(u.created_at, false)}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{u.last_login ? fmtDate(u.last_login) : "jamais"}</TableCell>
                      <TableCell sx={{ fontSize: "0.7812rem", color: "text.secondary" }}>
                        {u.decided_by ? <>{u.decided_by}<br />{fmtDate(u.decided_at, false)}</> : "—"}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {!self && u.statut === "actif" && (
                          <Tooltip title="Désactiver le compte">
                            <IconButton size="small" onClick={() => change(u, { statut: "désactivé" }, `Compte de ${u.nom} désactivé`)}><BlockOutlined fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {!self && u.statut !== "actif" && (
                          <Tooltip title={u.statut === "en attente" ? "Accepter" : "Réactiver le compte"}>
                            <IconButton size="small" color="primary" onClick={() => change(u, { statut: "actif" }, `Compte de ${u.nom} activé`)}><PlayCircleOutlined fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {!self && (
                          <Tooltip title="Supprimer le compte">
                            <IconButton size="small" onClick={() => setConfirm(u)}><DeleteOutlined fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {!loading && shown.length === 0 && <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 2 }}>Aucun compte dans cette catégorie.</Typography>}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Rôles et droits</Typography>
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 2 }}>Ce que chaque rôle permet de faire dans l'application.</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Droit</TableCell>
                  {Object.values(ROLE_LABELS).map((r) => <TableCell key={r} align="center">{r}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {DROITS.map(([droit, roles]) => (
                  <TableRow key={droit}>
                    <TableCell>{droit}</TableCell>
                    {Object.keys(ROLE_LABELS).map((r) => (
                      <TableCell key={r} align="center">
                        {roles.includes(r)
                          ? <CheckOutlined fontSize="small" sx={{ color: brand.ok }} />
                          : <RemoveOutlined fontSize="small" sx={{ color: brand.stoneLight }} />}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(confirm)} title="Supprimer le compte"
        text={`Supprimer définitivement le compte de ${confirm?.nom} (${confirm?.email}) ?`}
        onClose={() => setConfirm(null)} onConfirm={() => remove(confirm)}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.text}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
