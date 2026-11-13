import { useMemo, useState } from "react"
import {
  Box, Chip, Grid, InputAdornment, MenuItem, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, TextField, Typography,
} from "@mui/material"
import SearchOutlined from "@mui/icons-material/SearchOutlined"
import { BASE_THESAURI, CORPUS, PIPELINE, rankThesauri, searchConcepts } from "../demo/vectorBase"
import { brand } from "../theme"

const titreDe = Object.fromEntries(BASE_THESAURI.map((t) => [t.id, t.titre]))
const coupe = (s, n = 90) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "—")
const fmt = (x) => (x === undefined ? "—" : x.toFixed(3))

function payloadConcept(c) {
  return { id_concept: c.id_concept, prefLabel: c.prefLabel, altLabel: c.altLabel, definition: c.definition, id_theso: c.id_theso, complet: c.complet }
}

function Payload({ point }) {
  if (!point) {
    return <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>Cliquez sur une ligne pour voir le point stocké.</Typography>
  }
  return (
    <Box>
      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 0.5 }}>payload</Typography>
      <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: brand.stoneSoft, borderRadius: 1.5, fontSize: "0.75rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(point, null, 2)}
      </Box>
      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 1 }}>
        vecteur : {PIPELINE.embedding}, 1024 dimensions (non affiché)
      </Typography>
    </Box>
  )
}

function Points({ head, rows, onPick, picked }) {
  return (
    <TableContainer sx={{ maxHeight: "28rem", border: `1px solid ${brand.stoneLight}`, borderRadius: 2 }}>
      <Table size="small" stickyHeader>
        <TableHead><TableRow>{head.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key} hover selected={picked === r.key} onClick={() => onPick(r)} sx={{ cursor: "pointer" }}>
              {r.cells.map((c, i) => <TableCell key={i} sx={{ fontVariantNumeric: "tabular-nums" }}>{c}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default function VectorBaseExplorer() {
  const [tab, setTab] = useState("concepts")
  const [filtre, setFiltre] = useState("")
  const [theso, setTheso] = useState("tous")
  const [requete, setRequete] = useState("retable")
  const [point, setPoint] = useState(null)

  const conceptRows = useMemo(() => {
    const f = filtre.trim().toLowerCase()
    return CORPUS
      .filter((c) => theso === "tous" || c.id_theso === theso)
      .filter((c) => !f || [c.prefLabel, ...c.altLabel, c.definition].some((x) => x.toLowerCase().includes(f)))
      .map((c) => ({
        key: c.id_concept, point: payloadConcept(c),
        cells: [c.id_concept, c.prefLabel, coupe(c.altLabel.join(" ; "), 40), coupe(c.definition), c.id_theso,
          <Chip key="c" size="small" label={c.complet ? "oui" : "non"} color={c.complet ? "success" : "default"} variant="outlined" />],
      }))
  }, [filtre, theso])

  const thesoRows = BASE_THESAURI.map((t) => ({
    key: t.id, point: { id_theso: t.id, titre: t.titre, nb_concepts: CORPUS.filter((c) => c.id_theso === t.id).length },
    cells: [t.id, t.titre, CORPUS.filter((c) => c.id_theso === t.id).length],
  }))

  const recherche = useMemo(() => {
    const q = requete.trim()
    if (!q) return null
    return { concepts: searchConcepts(q, { n: 10 }).rerankTop, thesaurus: rankThesauri({ prefLabel: q, broader: "" }).candidates }
  }, [requete])

  const pick = (r) => setPoint(r)
  const changeTab = (v) => { setTab(v); setPoint(null) }

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => changeTab(v)} variant="scrollable" sx={{ mb: 2, borderBottom: `1px solid ${brand.stoneLight}` }}>
        <Tab value="concepts" label={`tac_rag_concepts (${CORPUS.length})`} />
        <Tab value="thesaurus" label={`tac_rag_thesaurus (${BASE_THESAURI.length})`} />
        <Tab value="recherche" label="Recherche par similarité" />
      </Tabs>

      {tab === "concepts" && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
              <TextField size="small" placeholder="Filtrer (libellé, synonyme, définition)" value={filtre} onChange={(e) => setFiltre(e.target.value)} sx={{ flex: 1 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }} />
              <TextField select size="small" value={theso} onChange={(e) => setTheso(e.target.value)} sx={{ minWidth: "14rem" }}>
                <MenuItem value="tous">Tous les thésaurus</MenuItem>
                {BASE_THESAURI.map((t) => <MenuItem key={t.id} value={t.id}>{t.titre}</MenuItem>)}
              </TextField>
            </Stack>
            <Points head={["id_concept", "prefLabel", "altLabel", "definition", "id_theso", "complet"]} rows={conceptRows} onPick={pick} picked={point?.key} />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}><Payload point={point?.point} /></Grid>
        </Grid>
      )}

      {tab === "thesaurus" && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Points head={["id_theso", "titre", "nb_concepts"]} rows={thesoRows} onPick={pick} picked={point?.key} />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}><Payload point={point?.point} /></Grid>
        </Grid>
      )}

      {tab === "recherche" && (
        <Box>
          <TextField size="small" fullWidth label="Texte de la requête" value={requete} onChange={(e) => setRequete(e.target.value)} sx={{ mb: 2, maxWidth: "32rem" }} />
          {recherche && (
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Concepts proches · {PIPELINE.embedding} puis {PIPELINE.reranker}</Typography>
                <Points head={["#", "prefLabel", "thésaurus", "score vecteur", "score reranker"]} onPick={() => {}}
                  rows={recherche.concepts.map((c, i) => ({ key: c.id_concept, cells: [i + 1, <span key="l">{c.prefLabel}{c.exact ? <Chip size="small" label="exact" sx={{ ml: 1, height: "1.1rem" }} /> : null}</span>, coupe(titreDe[c.id_theso], 28), fmt(c.vec), fmt(c.rr)] }))} />
              </Grid>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Thésaurus candidats · score = {1 - PIPELINE.poidsVote} × similarité + {PIPELINE.poidsVote} × vote</Typography>
                <Points head={["titre", "similarité", "vote", "score"]} onPick={() => {}}
                  rows={recherche.thesaurus.map((t) => ({ key: t.id, cells: [coupe(t.titre, 30), fmt(t.sim), fmt(t.vote), fmt(t.score)] }))} />
              </Grid>
            </Grid>
          )}
        </Box>
      )}
    </Box>
  )
}
