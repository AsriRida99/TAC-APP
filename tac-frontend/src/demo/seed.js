import { DICTIONNAIRE, DOMAINES, MODELES, SOURCES_EXTERNES } from "./dictionary"
import { conceptPromptB5, skosTurtle } from "./llm"

function rng(seed) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

const CURATEURS = ["Claire Martin", "Julien Moreau", "Sophie Bernard", "Thomas Lefèvre"]
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")

function daysAgo(n, rand) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(9 + Math.floor(rand() * 9), Math.floor(rand() * 60), 0, 0)
  return d.toISOString()
}

const AVEC_CONCEPT = {
  mobilier: ["amphore", "fibule", "lampe à huile", "céramique sigillée", "ostracon", "sarcophage", "monnaie", "stèle"],
  architecture: ["cathédrale", "chapiteau", "pilastre", "retable", "crypte", "abside", "transept", "clocher"],
  arts: ["fresque", "mosaïque", "enluminure", "tapisserie", "émail", "marqueterie", "icône", "vitrail"],
}
const NON_RATTACHES = new Set(["monnaie", "stèle", "clocher", "transept", "icône", "vitrail"])

export function createSeed() {
  const rand = rng(42)
  let promptCounter = 0
  const nextPrompt = () => `P-${String(++promptCounter).padStart(4, "0")}`
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]

  const termes = []
  const concepts = []

  Object.keys(DICTIONNAIRE).forEach((label, i) => {
    const age = 26 - Math.floor(i / 2)
    termes.push({
      id: `T${String(i + 1).padStart(3, "0")}`,
      label,
      source: i < 20 ? "import CSV" : i < 30 ? "import JSON" : "saisie",
      created_at: daysAgo(Math.max(age, 1), rand),
      created_by: pick(CURATEURS),
      statut: "nouveau",
    })
  })

  let n = 0
  for (const [dom, labels] of Object.entries(AVEC_CONCEPT)) {
    for (const label of labels) {
      const e = DICTIONNAIRE[label]
      const terme = termes.find((t) => t.label === label)
      terme.statut = "concept généré"
      const iterations = 1 + Math.floor(rand() * rand() * 4)
      const by = pick(CURATEURS)
      const day = 24 - Math.floor((n * 24) / 24) + Math.floor(rand() * 3) - 1
      const validated_at = daysAgo(Math.max(1, Math.min(27, day - (n % 5))), rand)
      const model = rand() < 0.75 ? MODELES.concepts[0] : MODELES.concepts[1]
      const history = []
      for (let k = 1; k <= iterations; k++) {
        const promptId = nextPrompt()
        history.push({
          n: k,
          date: validated_at,
          user: by,
          model,
          promptId,
          prompt: conceptPromptB5(label, []),
          decision: k < iterations ? "rejeté" : "validé",
          note: k < iterations ? pick(["Définition trop vague", "Broader incorrect", "altLabel manquants", "Narrower hors domaine"]) : "",
        })
      }
      concepts.push({
        id: `C${String(++n).padStart(3, "0")}`,
        termeId: terme.id,
        terme: label,
        prefLabel: label,
        altLabel: e.alt,
        definition: e.def,
        broader: e.broader,
        narrower: e.narrower,
        statut: "validé",
        domaine: dom,
        iteration: iterations,
        model,
        promptId: history.at(-1).promptId,
        validated_by: by,
        validated_at,
        opentheso: rand() < 0.55 ? { statut: "publié", id: `ot-${1200 + n}`, date: validated_at } : { statut: "non envoyé" },
        history,
      })
    }
  }

  const thesauri = Object.entries(DOMAINES).map(([dom, d], i) => {
    const members = concepts.filter((c) => c.domaine === dom && !NON_RATTACHES.has(c.prefLabel))
    const by = CURATEURS[i]
    const validated_at = daysAgo(12 - i * 4, rand)
    return {
      id: `TH${i + 1}`,
      nom: d.nom,
      domaine: d.domaine,
      langue: "fr",
      conceptIds: members.map((c) => c.id),
      statut: "validé",
      iteration: i === 1 ? 2 : 1,
      model: MODELES.thesaurus[0],
      promptId: nextPrompt(),
      validated_by: by,
      validated_at,
      opentheso: i < 2 ? { statut: "publié", id: `th-${40 + i}`, date: validated_at } : { statut: "non envoyé" },
      history: [{ n: 1, date: validated_at, user: by, model: MODELES.thesaurus[0], promptId: `P-${String(promptCounter).padStart(4, "0")}`, prompt: "", decision: "validé", note: "" }],
    }
  })

  const alignements = []
  thesauri.slice(0, 2).forEach((th, ti) => {
    th.conceptIds.forEach((cid, ci) => {
      const c = concepts.find((x) => x.id === cid)
      const e = DICTIONNAIRE[c.prefLabel]
      const sources = ci % 2 ? [SOURCES_EXTERNES[0], SOURCES_EXTERNES[1]] : [SOURCES_EXTERNES[1]]
      sources.forEach((s) => {
        const label = s.id === "aat" ? e.en : c.prefLabel
        const type = (ci + ti) % 4 === 0 ? "closeMatch" : "exactMatch"
        const by = pick(CURATEURS)
        const validated_at = daysAgo(Math.max(1, 9 - ci - ti * 2), rand)
        alignements.push({
          id: `A${String(alignements.length + 1).padStart(3, "0")}`,
          conceptId: c.id,
          conceptLabel: c.prefLabel,
          thesaurusId: th.id,
          thesaurusNom: th.nom,
          source: s.nom,
          externeLabel: label,
          uri: s.base + slug(label),
          type,
          score: type === "exactMatch" ? 0.9 + rand() * 0.08 : 0.7 + rand() * 0.1,
          statut: "validé",
          iteration: 1,
          model: MODELES.alignements[0],
          validated_by: by,
          validated_at,
          opentheso: ti === 0 ? { statut: "publié", id: `al-${300 + alignements.length}`, date: validated_at } : { statut: "non envoyé" },
          history: [{ n: 1, date: validated_at, user: by, model: MODELES.alignements[0], promptId: nextPrompt(), prompt: "", decision: "validé", note: "" }],
        })
      })
    })
  })

  const exports = thesauri.slice(0, 2).map((th, i) => {
    const cs = concepts.filter((c) => th.conceptIds.includes(c.id))
    const date = daysAgo(3 - i, rand)
    return {
      id: `E${i + 1}`,
      thesaurusId: th.id,
      nom: `${th.nom} — SKOS`,
      format: "Turtle (.ttl)",
      contenu: skosTurtle(th, cs, alignements.filter((a) => a.thesaurusId === th.id)),
      created_at: date,
      created_by: th.validated_by,
      updated_at: date,
      opentheso: i === 0 ? { statut: "publié", id: `th-${40 + i}`, date } : { statut: "non envoyé" },
    }
  })

  const syncs = [
    { id: "S1", date: daysAgo(20, rand), user: CURATEURS[0], thesauri: ["Thésaurus exemple", "Mobilier archéologique"], concepts: 41, vectors: 41, nodes: 52, relations: 88, duree: "6 s", statut: "réussie" },
    { id: "S2", date: daysAgo(9, rand), user: CURATEURS[2], thesauri: ["Architecture religieuse"], concepts: 12, vectors: 12, nodes: 15, relations: 24, duree: "3 s", statut: "réussie" },
    { id: "S3", date: daysAgo(2, rand), user: CURATEURS[1], thesauri: ["Thésaurus exemple", "Arts décoratifs et peinture"], concepts: 58, vectors: 58, nodes: 70, relations: 121, duree: "7 s", statut: "réussie" },
  ]

  return { termes, concepts, thesauri, alignements, exports, syncs, promptCounter }
}
