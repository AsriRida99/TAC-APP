import { DICTIONNAIRE } from "./dictionary"

export const PIPELINE = {
  embedding: "bge-m3",
  reranker: "bge-reranker-v2-m3",
  candidats: 30,
  exemples: 5,
  motsExacts: 6,
  poidsVote: 0.4,
}

export const BASE_THESAURI = [
  { id: "th43", titre: "Mobilier archéologique", nb: 2140, domaine: "mobilier" },
  { id: "th12", titre: "Architecture religieuse", nb: 1243, domaine: "architecture" },
  { id: "th61", titre: "Arts décoratifs et peinture", nb: 1890, domaine: "arts" },
  { id: "th19", titre: "Objets liturgiques", nb: 876, domaine: "liturgie" },
  { id: "th31", titre: "Architecture funéraire", nb: 512, domaine: "funeraire" },
  { id: "th07", titre: "Patrimoine bâti", nb: 3410, domaine: "bati" },
  { id: "th88", titre: "Parure et ornement", nb: 395, domaine: "parure" },
  { id: "th77", titre: "Céramique antique", nb: 640, domaine: "ceramique" },
  { id: "th05", titre: "Vocabulaire général des collections", nb: 2741, domaine: "general" },
  { id: "th90", titre: "Vocabulaire médical", nb: 2210, domaine: "medical" },
]
const THESO = Object.fromEntries(BASE_THESAURI.map((t) => [t.id, t]))
const DOMAINE_THESO = { mobilier: "th43", architecture: "th12", arts: "th61" }

const VOISINS = {
  mobilier: ["ceramique", "parure", "funeraire"],
  architecture: ["bati", "funeraire", "liturgie"],
  arts: ["liturgie", "general"],
}

const EXTRA = [
  ["th12", "église", ["lieu de culte"], "Édifice consacré au culte chrétien, où se réunissent les fidèles.", "édifice religieux", ["basilique", "cathédrale", "collégiale"]],
  ["th12", "oratoire", [], "", "édifice religieux", []],
  ["th12", "abbatiale", ["église abbatiale"], "Église d'une abbaye, où se déroulent les offices de la communauté.", "église", []],
  ["th12", "basilique", [], "Église dotée de privilèges particuliers accordés par le pape.", "église", ["basilique mineure"]],
  ["th12", "baptistère", ["baptisterium"], "Édifice ou chapelle où l'on administre le baptême.", "édifice religieux", []],
  ["th19", "chapelle", ["chapelle d'autel"], "Ensemble des objets liturgiques nécessaires à la célébration d'un office.", "orfèvrerie", ["calice", "burette"]],
  ["th19", "calice", ["coupe eucharistique"], "Vase liturgique à pied dans lequel est consacré le vin pendant la messe.", "vase liturgique", ["calice ministériel"]],
  ["th19", "burette", [], "Petit flacon contenant l'eau ou le vin de la messe.", "vase liturgique", []],
  ["th19", "ciboire", ["pyxide"], "Vase sacré à couvercle où l'on conserve les hosties consacrées.", "vase liturgique", []],
  ["th31", "chapelle funéraire", [], "", "chapelle", []],
  ["th31", "mausolée", ["monument funéraire"], "Monument funéraire de grandes dimensions.", "monument funéraire", []],
  ["th31", "enfeu", [], "Niche funéraire à fond plat pratiquée dans un mur d'église.", "sépulture", []],
  ["th07", "lavoir", ["lavoir public"], "Bassin public couvert ou non, destiné au lavage du linge.", "édicule", ["lavoir à impluvium"]],
  ["th07", "croix de chemin", ["croix de mission"], "Croix érigée au bord d'un chemin ou à un carrefour.", "édicule religieux", ["calvaire"]],
  ["th07", "calvaire", [], "Croix monumentale représentant la crucifixion, souvent entourée de personnages.", "croix de chemin", []],
  ["th88", "collier", ["tour de cou"], "Parure qui se porte autour du cou.", "parure", ["torque", "rivière"]],
  ["th88", "bracelet", ["armille"], "Parure portée autour du poignet ou du bras.", "parure", ["bracelet ouvert"]],
  ["th88", "pendentif", [], "Bijou suspendu à une chaîne ou un collier.", "parure", []],
  ["th77", "canthare", ["kantharos"], "Vase à boire grec à deux grandes anses verticales.", "vase à boire", ["canthare à anses hautes"]],
  ["th77", "cruche", [], "Récipient à anse et à bec verseur pour les liquides.", "récipient", []],
  ["th77", "stamnos", [], "Vase grec à large panse et à deux anses horizontales.", "vase", []],
  ["th77", "dolium", ["dolia"], "Grande jarre en terre cuite servant au stockage des denrées.", "récipient", []],
  ["th77", "amphore", ["amphora", "jarre à anses"], DICTIONNAIRE.amphore.def, "récipient", ["amphore vinaire", "amphore à huile"]],
  ["th05", "amphore", ["amphora", "jarre à anses"], DICTIONNAIRE.amphore.def, "récipient", ["amphore vinaire", "amphore à huile"]],
  ["th05", "vase", [], "Récipient de forme et de matière variables.", "récipient", ["amphore", "cruche"]],
  ["th05", "peinture murale", ["décor peint"], "Peinture exécutée directement sur un mur.", "peinture", ["fresque"]],
  ["th05", "retable", ["rétable"], DICTIONNAIRE.retable.def, "mobilier liturgique", ["retable sculpté"]],
  ["th61", "triptyque", ["retable à trois volets"], "Œuvre peinte ou sculptée composée de trois panneaux, dont les deux volets latéraux peuvent se replier sur le panneau central.", "polyptyque", ["triptyque à volets mobiles"]],
  ["th61", "panneau peint", ["peinture sur bois"], "Peinture exécutée sur un support de bois préparé, technique dominante de la peinture européenne avant la toile.", "peinture", ["diptyque", "triptyque", "polyptyque"]],
  ["th61", "volet", ["volet de retable"], "Panneau latéral articulé d'un retable ou d'un polyptyque, souvent peint sur ses deux faces.", "élément de retable", []],
  ["th19", "prédelle", ["gradin de retable"], "Partie inférieure d'un retable, formée d'une suite de petits panneaux peints ou sculptés.", "élément de retable", []],
  ["th05", "diptyque", ["tablette double"], "Œuvre composée de deux panneaux reliés par des charnières.", "peinture sur panneau", ["diptyque de dévotion"]],
  ["th05", "retable à volets", [], "", "retable", ["triptyque"]],
  ["th90", "cathéter", ["sonde"], "Tube fin introduit dans un conduit ou une cavité du corps.", "dispositif médical", []],
]

const DOMAINE_EXTRA = (theso) => THESO[theso].domaine

function makeConcept(theso, prefLabel, altLabel, definition, broader, narrower, i) {
  const complet = Boolean(prefLabel && altLabel.length && definition && broader && narrower.length)
  return {
    id_concept: `${theso}/${1000 + i}`,
    id_theso: theso,
    thesaurus: THESO[theso].titre,
    domaine: DOMAINE_EXTRA(theso),
    prefLabel, altLabel, definition, broader, narrower, complet,
  }
}

const VALIDES = [
  "amphore", "fibule", "lampe à huile", "céramique sigillée", "ostracon", "sarcophage", "monnaie", "stèle",
  "cathédrale", "chapiteau", "pilastre", "retable", "crypte", "abside", "transept", "clocher",
  "fresque", "mosaïque", "enluminure", "tapisserie", "émail", "marqueterie", "icône", "vitrail",
]
export const CORPUS = [
  ...VALIDES.map((label, i) => {
    const e = DICTIONNAIRE[label]
    return makeConcept(DOMAINE_THESO[e.domaine], label, e.alt, e.def, e.broader, e.narrower, i)
  }),
  ...EXTRA.map(([th, ...rest], i) => makeConcept(th, ...rest, 100 + i)),
]

export const BASE_STATS = { concepts: CORPUS.length, thesaurus: BASE_THESAURI.length }

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim()
function bigrams(s) {
  const t = ` ${norm(s)} `
  const out = []
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2))
  return out
}
export function dice(a, b) {
  const A = bigrams(a), B = [...bigrams(b)]
  let hit = 0
  for (const g of A) {
    const i = B.indexOf(g)
    if (i >= 0) { hit++; B.splice(i, 1) }
  }
  return (2 * hit) / (A.length + B.length || 1)
}
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 997
const clamp = (x) => Math.max(0, Math.min(0.99, x))

function affinity(domaine, c) {
  if (!domaine) return 0
  if (c.domaine === domaine) return 1
  if (VOISINS[domaine]?.includes(c.domaine)) return 0.55
  return c.domaine === "general" ? 0.4 : 0
}

export function queryDocument(terme, fields = {}) {
  return [
    `Terme : ${terme}`,
    fields.altLabel?.length ? `Synonymes : ${fields.altLabel.join(", ")}` : null,
    fields.definition ? `Définition : ${fields.definition}` : null,
    fields.broader ? `Terme générique : ${fields.broader}` : null,
  ].filter(Boolean).join("\n")
}

export function searchConcepts(terme, { n = PIPELINE.exemples } = {}) {
  const domaine = DICTIONNAIRE[terme.trim().toLowerCase()]?.domaine
  const words = terme.trim().split(/\s+/).length

  const scored = CORPUS.map((c) => {
    const lex = Math.max(dice(terme, c.prefLabel), ...c.altLabel.map((a) => dice(terme, a) * 0.9), 0)
    const vec = clamp(0.32 + 0.38 * lex + 0.22 * affinity(domaine, c) + 0.08 * hash(c.id_concept + terme))
    return { ...c, vec }
  }).sort((a, b) => b.vec - a.vec)
  const vector = scored.slice(0, PIPELINE.candidats).map((c, i) => ({ ...c, rangVec: i + 1 }))

  const entry = DICTIONNAIRE[terme.trim().toLowerCase()]
  const t = norm(terme)
  const related = (c) =>
    (entry && c.broader === entry.broader) || norm(c.broader) === t || c.narrower.some((n) => norm(n) === t) ||
    (entry && entry.narrower.some((n) => norm(n) === norm(c.prefLabel)))||
    (entry && entry.alt.some((a) => norm(a) === norm(c.prefLabel))) ||
    (entry && c.narrower.some((n) => entry.narrower.some((m) => norm(m) === norm(n))))
  const reranked = vector
    .map((c) => {
      const rr = clamp(0.1 + 0.2 * c.vec + 0.33 * affinity(domaine, c) + 0.32 * (related(c) ? 1 : 0) + 0.1 * dice(terme, c.prefLabel) + 0.05 * hash(terme + c.id_concept))
      return { ...c, rr }
    })
    .sort((a, b) => b.rr - a.rr)

  const isExact = (c) => words <= PIPELINE.motsExacts && [c.prefLabel, ...c.altLabel].some((l) => norm(l) === norm(terme))
  const exact = reranked.filter(isExact).slice(0, Math.floor(n / 2) || 1)
  const ordered = [...exact, ...reranked.filter((c) => !exact.includes(c))]

  const deduped = []
  let copies = 0
  for (const c of ordered) {
    const twin = deduped.find((d) => d.prefLabel === c.prefLabel && d.definition === c.definition)
    if (twin) { twin.aussi = [...(twin.aussi || []), c.id_theso]; copies++ }
    else deduped.push({ ...c, aussi: [] })
  }
  const ranked = deduped.map((c, i) => ({ ...c, rangFinal: i + 1, exact: exact.includes(c) || exact.some((e) => e.id_concept === c.id_concept) }))

  let chosen = ranked.slice(0, n)
  if (!chosen.some((c) => c.complet)) {
    const firstComplete = ranked.slice(n).find((c) => c.complet)
    if (firstComplete) chosen = [...chosen.slice(0, n - 1), firstComplete]
  }

  return {
    query: queryDocument(terme),
    exactCount: exact.length,
    vectorTop: vector.slice(0, 10),
    rerankTop: ranked.slice(0, 10),
    copies,
    examples: chosen.map((c) => ({ ...c, id: c.id_concept, include: true, original: { broader: c.broader } })),
  }
}

export function rankThesauri(concept, extraThesauri = []) {
  const domaine = DICTIONNAIRE[concept.prefLabel.trim().toLowerCase()]?.domaine
  const near = searchConcepts(concept.prefLabel, { n: 10 }).rerankTop.slice(0, 10)
  const votes = {}
  for (const c of near) for (const th of [c.id_theso, ...(c.aussi || [])]) votes[th] = (votes[th] || 0) + 1

  const pool = [
    ...BASE_THESAURI,
    ...extraThesauri.filter((t) => !BASE_THESAURI.some((b) => b.titre === t.titre)),
  ]
  const candidates = pool.map((t) => {
    const fam = t.domaine === domaine ? 1 : VOISINS[domaine]?.includes(t.domaine) ? 0.55 : t.domaine === "general" ? 0.45 : 0.15
    const sim = clamp(0.3 + 0.5 * fam + 0.1 * dice(concept.broader || "", t.titre) + 0.08 * hash(t.id + concept.prefLabel))
    const vote = Math.min(1, (votes[t.id] || 0) / 10)
    return { ...t, sim, vote, score: (1 - PIPELINE.poidsVote) * sim + PIPELINE.poidsVote * vote }
  })
  return {
    near,
    candidates: candidates.sort((a, b) => b.score - a.score).slice(0, 5),
  }
}
