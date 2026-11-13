import { useState } from "react"
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Grid, LinearProgress, Snackbar, Stack, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography,
} from "@mui/material"
import SyncOutlined from "@mui/icons-material/SyncOutlined"
import StorageOutlined from "@mui/icons-material/StorageOutlined"
import HubOutlined from "@mui/icons-material/HubOutlined"
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined"
import RadioButtonUncheckedOutlined from "@mui/icons-material/RadioButtonUncheckedOutlined"
import { useDemo } from "../demo/DemoStore"
import { wait } from "../demo/llm"
import { BASE_THESAURI, CORPUS } from "../demo/vectorBase"
import KnowledgeGraph from "../components/KnowledgeGraph"
import { graphStats } from "../demo/graph"
import VectorBaseExplorer from "../components/VectorBaseExplorer"
import { PageHeader, SectionCard, StatusChip } from "../components/curation"
import { brand } from "../theme"
import { fmtDate } from "../utils/format"

const STEPS = [
  "Connexion à l'API OpenTheso",
  "Lecture des thésaurus sélectionnés",
  "Calcul des embeddings des concepts",
  "Mise à jour de la base vectorielle (Qdrant)",
  "Mise à jour du graphe de connaissances (Neo4j)",
]

function ResourceCard({ icon: Icon, title, lines, last, gradient }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
          <Box sx={{ width: "2.625rem", height: "2.625rem", borderRadius: 2.5, background: gradient, color: "#fff", display: "grid", placeItems: "center" }}><Icon /></Box>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
            <Typography sx={{ fontSize: "0.7812rem", color: "text.secondary" }}>Dernière mise à jour : {fmtDate(last)}</Typography>
          </Box>
        </Stack>
        <Stack spacing={0.75}>
          {lines.map(([k, v]) => (
            <Stack key={k} direction="row" sx={{ justifyContent: "space-between", borderBottom: `1px dashed ${brand.stoneLight}`, pb: 0.5 }}>
              <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>{k}</Typography>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString("fr-FR")}</Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function Synchronisation() {
  const { db, addSync } = useDemo()
  const sources = ["Thésaurus exemple", ...db.thesauri.map((t) => t.nom)]
  const [picked, setPicked] = useState(["Thésaurus exemple"])
  const [step, setStep] = useState(-1)
  const [toast, setToast] = useState(null)
  const [vue, setVue] = useState("sync")
  const stats = graphStats()

  const last = db.syncs[0]
  const steps = STEPS
  const running = step >= 0 && step < steps.length

  async function run() {
    const t0 = Date.now()
    for (let i = 0; i < steps.length; i++) {
      setStep(i)
      await wait(700 + Math.random() * 600)
    }
    setStep(steps.length)
    const concepts = picked.reduce((s, name) => s + (name === "Thésaurus exemple" ? CORPUS.length : (db.thesauri.find((t) => t.nom === name)?.conceptIds.length || 0)), 0) + db.concepts.length
    addSync({
      thesauri: picked,
      concepts,
      vectors: concepts,
      nodes: Math.round(concepts * 1.26),
      relations: Math.round(concepts * 2.24),
      duree: `${Math.round((Date.now() - t0) / 1000)} s`,
      statut: "réussie",
    })
    setToast(`Synchronisation terminée : ${concepts.toLocaleString("fr-FR")} concepts traités`)
  }

  return (
    <Box>
      <PageHeader title="Synchronisation" subtitle="Mettez à jour la base vectorielle et le graphe de connaissances de l'agent à partir des thésaurus publiés dans OpenTheso." />
      <Alert severity="info" sx={{ mb: 2.5 }}>
        Démonstration : les bases et le graphe affichés contiennent des données d'exemple fictives. Les bases réelles ne sont pas publiées.
      </Alert>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ResourceCard gradient="linear-gradient(135deg, #6366f1, #0ea5e9)" icon={StorageOutlined} title="Base vectorielle · Qdrant" last={last?.date}
            lines={[["Collection « tac_rag_concepts » (points)", CORPUS.length], ["Collection « tac_rag_thesaurus » (points)", BASE_THESAURI.length], ["Dimension des embeddings", 1024]]} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ResourceCard gradient="linear-gradient(135deg, #f59e0b, #f43f5e)" icon={HubOutlined} title="Graphe de connaissances · Neo4j" last={last?.date}
            lines={[["Nœuds (Concept, Thésaurus)", stats.noeuds], ["Relations BROADER", stats.broader], ["Relations APPARTIENT", stats.appartient]]} />
        </Grid>
      </Grid>

      <Tabs value={vue} onChange={(_, v) => setVue(v)} variant="scrollable" sx={{ mb: 2.5, borderBottom: `1px solid ${brand.stoneLight}` }}>
        <Tab value="sync" label="Synchroniser" />
        <Tab value="graphe" label="Graphe de connaissances" />
        <Tab value="vecteurs" label="Bases vectorielles" />
      </Tabs>

      {vue === "graphe" && (
        <SectionCard title="Graphe de connaissances · Neo4j" subtitle="Relations BROADER entre concepts et APPARTIENT vers les thésaurus.">
          <KnowledgeGraph />
        </SectionCard>
      )}

      {vue === "vecteurs" && (
        <SectionCard title="Bases vectorielles · Qdrant" subtitle="Les points stockés dans chaque collection et une recherche par similarité.">
          <VectorBaseExplorer />
        </SectionCard>
      )}

      {vue === "sync" && <>
      <SectionCard step={1} title="Lancer une synchronisation" subtitle="Choisissez les thésaurus OpenTheso à relire et les ressources à mettre à jour.">
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, mb: 1 }}>Thésaurus OpenTheso</Typography>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
          {sources.map((s) => (
            <Chip
              key={s} label={s}
              icon={<Checkbox size="small" checked={picked.includes(s)} sx={{ p: 0, ml: "6px !important" }} />}
              onClick={() => setPicked(picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s])}
              color={picked.includes(s) ? "primary" : "default"} variant={picked.includes(s) ? "filled" : "outlined"}
              disabled={running}
            />
          ))}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>La base vectorielle (Qdrant) et le graphe (Neo4j) sont mis à jour ensemble.</Typography>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" size="large" startIcon={<SyncOutlined />} onClick={run} disabled={running || !picked.length}>
            {running ? "Synchronisation…" : "Lancer la synchronisation"}
          </Button>
        </Stack>

        {step >= 0 && (
          <Box sx={{ mt: 2.5 }}>
            <LinearProgress variant="determinate" value={(Math.min(step, steps.length) / steps.length) * 100} sx={{ height: "0.5rem", borderRadius: 4, mb: 1.5 }} />
            <Stack spacing={0.75}>
              {steps.map((s, i) => (
                <Stack key={s} direction="row" spacing={1} sx={{ alignItems: "center", color: i <= step ? "text.primary" : "text.secondary" }}>
                  {i < step ? <CheckCircleOutlined fontSize="small" color="success" /> : <RadioButtonUncheckedOutlined fontSize="small" sx={{ opacity: i === step ? 1 : 0.4 }} />}
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: i === step ? 600 : 400 }}>{s}{i === step && running ? "…" : ""}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </SectionCard>

      <Card>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>Historique des synchronisations</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Lancée par</TableCell>
                  <TableCell>Thésaurus</TableCell>
                  <TableCell align="right">Concepts</TableCell>
                  <TableCell align="right">Vecteurs</TableCell>
                  <TableCell align="right">Nœuds</TableCell>
                  <TableCell align="right">Relations</TableCell>
                  <TableCell>Durée</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {db.syncs.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(s.date)}</TableCell>
                    <TableCell>{s.user}</TableCell>
                    <TableCell sx={{ maxWidth: "16.25rem" }}>{s.thesauri.join(", ")}</TableCell>
                    {[s.concepts, s.vectors, s.nodes, s.relations].map((v, i) => (
                      <TableCell key={i} align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString("fr-FR")}</TableCell>
                    ))}
                    <TableCell>{s.duree}</TableCell>
                    <TableCell><StatusChip statut={s.statut} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      </>}

      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
