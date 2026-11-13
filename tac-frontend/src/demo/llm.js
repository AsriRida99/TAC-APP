import { DICTIONNAIRE, SOURCES_EXTERNES, lookup } from "./dictionary"
import { MISTRAL, MISTRAL_ACTIF, askMistral } from "./mistral"

export const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export const LLM_SOURCE = MISTRAL_ACTIF ? `Mistral · ${MISTRAL.model}` : "Simulation"

const FORMAT_CONCEPT =
  "Réponds uniquement dans ce format, un champ par ligne, sans autre texte :\n" +
  "prefLabel: …\naltLabel: synonyme 1 ; synonyme 2\ndefinition: …\nbroader: …\nnarrower: spécifique 1 ; spécifique 2"

function lireConcept(texte, terme) {
  const out = { prefLabel: terme.trim().toLowerCase(), altLabel: [], definition: "", broader: "", narrower: [] }
  for (const ligne of texte.split("\n")) {
    const m = ligne.replace(/^[\s*\-•]+/, "").match(/^(prefLabel|altLabel|definition|broader|narrower)\s*:\s*(.*)$/i)
    if (!m) continue
    const champ = Object.keys(out).find((k) => k.toLowerCase() === m[1].toLowerCase())
    const valeur = m[2].replace(/\*\*/g, "").trim()
    if (!valeur || /^\(?aucun\)?$/i.test(valeur)) continue
    out[champ] = champ === "altLabel" || champ === "narrower" ? valeur.split(";").map((v) => v.trim()).filter(Boolean) : valeur
  }
  return out
}

export async function generateConcept(terme, examples, iteration, components, prompt) {
  if (!MISTRAL_ACTIF) return { concept: await generateConceptB5(terme, examples, iteration, components), source: LLM_SOURCE }
  try {
    const texte = await askMistral(prompt, { system: FORMAT_CONCEPT })
    return { concept: lireConcept(texte, terme), source: LLM_SOURCE }
  } catch (e) {
    return { concept: await generateConceptB5(terme, examples, iteration, components), source: "Simulation", erreur: e.message }
  }
}

export async function generateThesaurus(candidates, iteration, prompt) {
  if (!MISTRAL_ACTIF) return { titre: await generateThesaurusB4(candidates, iteration), source: LLM_SOURCE }
  try {
    const liste = candidates.map((c) => `- ${c.titre}`).join("\n")
    const texte = await askMistral(prompt, {
      system: "Choisis UN thésaurus dans cette liste et recopie son titre exact, sur une ligne, sans phrase ni justification :\n" + liste,
      maxTokens: 60,
    })
    const brut = (texte.split("\n").find((l) => l.trim()) || "").replace(/^[\s\d.)*\-•«"]+|[\s»".*]+$/g, "").trim()
    const proche = candidates.map((c) => ({ c, s: similarity(brut, c.titre) })).sort((a, b) => b.s - a.s)[0]
    const titre = proche && proche.s >= 0.5 ? proche.c.titre : brut
    return { titre: titre || (await generateThesaurusB4(candidates, iteration)), source: LLM_SOURCE }
  } catch (e) {
    return { titre: await generateThesaurusB4(candidates, iteration), source: "Simulation", erreur: e.message }
  }
}

function bigrams(s) {
  const t = ` ${s.toLowerCase()} `
  const out = []
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2))
  return out
}
export function similarity(a, b) {
  const A = bigrams(a), B = bigrams(b)
  const setB = [...B]
  let hit = 0
  for (const g of A) {
    const i = setB.indexOf(g)
    if (i >= 0) { hit++; setB.splice(i, 1) }
  }
  return (2 * hit) / (A.length + B.length || 1)
}

export const PROMPT_B5 = ["RÔLE", "PRÉAMBULE", "EXEMPLES", "CONTEXTE", "CADRE + DEMANDE", "MÉTHODE"]
export const PROMPT_OPTIONS = ["CONTRAINTES", "EXEMPLES +"]

const fmtList = (l) => (l && l.length ? l.join(" ; ") : "")

export function conceptPromptB5(terme, examples, components = []) {
  const ex = examples.filter((e) => e.include)
  const incomplete = ex.some((e) => !e.complet)
  const generiques = [...new Set(ex.map((e) => e.broader).filter(Boolean))]
  const specifiques = [...new Set(ex.flatMap((e) => e.narrower))].slice(0, 8)
  const lines = ["Tu es documentaliste spécialisé en terminologie du patrimoine culturel.", ""]
  lines.push("Voici des concepts proches extraits des thésaurus existants.")
  if (incomplete) lines.push("Attention : certains exemples sont incomplets ; un champ absent n'est pas une erreur.")
  lines.push("")
  ex.forEach((e, i) => {
    lines.push(
      `Exemple ${i + 1}.`,
      `Terme : « ${e.prefLabel} »`,
      `prefLabel: ${e.prefLabel}`,
      `altLabel: ${fmtList(e.altLabel)}`,
      `definition: ${e.definition || ""}`,
      `broader: ${e.broader || ""}`,
      `narrower: ${fmtList(e.narrower)}`,
      "### FIN",
      ""
    )
  })
  lines.push(`Termes génériques possibles : ${fmtList(generiques) || "—"}`)
  lines.push(`Termes spécifiques possibles : ${fmtList(specifiques) || "—"}`, "")
  if (components.includes("CONTRAINTES")) {
    lines.push("Contraintes : un seul broader ; une définition d'une ou deux phrases ; n'invente aucun terme absent du domaine.", "")
  }
  lines.push(
    `Dans le cadre de la construction d'un thésaurus SKOS pour une institution patrimoniale, quel est le concept SKOS complet associé au terme « ${terme} » ?`,
    "Procède champ par champ : d'abord la forme retenue, puis les synonymes, puis la définition, puis le générique, puis les spécifiques."
  )
  return lines.join("\n")
}

export async function generateConceptB5(terme, examples, iteration, components = []) {
  await wait(1200 + Math.random() * 700)
  const label = terme.trim().toLowerCase()
  const ex = examples.filter((e) => e.include)
  const e = lookup(label)
  const homonym = ex.find((x) => x.prefLabel.toLowerCase() === label && e && x.broader !== e.broader)
  if (homonym && iteration === 1 && !components.includes("CONTRAINTES")) {
    return {
      prefLabel: label,
      altLabel: homonym.altLabel,
      definition: homonym.definition || `Définition reprise de l'exemple « ${homonym.prefLabel} ».`,
      broader: homonym.broader,
      narrower: [...homonym.narrower, "patène"].slice(0, 3),
    }
  }
  if (e) {
    const variant = (iteration - 1) % 3
    return {
      prefLabel: label,
      altLabel: variant === 1 ? e.alt.slice(0, 1) : e.alt,
      definition: e.def,
      broader: e.broader,
      narrower: variant === 2 ? e.narrower.slice(0, 1) : e.narrower,
    }
  }
  const counts = ex.reduce((m, x) => m.set(x.broader, (m.get(x.broader) || 0) + 1), new Map())
  const broader = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "objet patrimonial"
  return {
    prefLabel: label,
    altLabel: [],
    definition: `Élément du patrimoine culturel désigné par le terme « ${terme} » (à compléter par le documentaliste).`,
    broader,
    narrower: [],
  }
}

export const PROMPT_B4 = ["RÔLE", "EXEMPLE", "CANDIDATS", "CADRE + DEMANDE", "MÉTHODE"]

export function thesaurusPromptB4(concept, example, candidates, components = []) {
  const lines = ["Tu es documentaliste spécialisé en terminologie du patrimoine culturel.", ""]
  if (example) {
    lines.push(
      "Exemple 1.",
      `Concept : « ${example.prefLabel} »`,
      `definition: ${example.definition || ""}`,
      `broader: ${example.broader || ""}`,
      `thésaurus: ${example.thesaurus}`,
      "### FIN",
      ""
    )
  }
  lines.push("Thésaurus candidats (score = 0,6 × similarité + 0,4 × vote) :")
  candidates.forEach((c, i) => lines.push(`${i + 1}. ${c.titre} — ${c.score.toFixed(2)}`))
  lines.push("")
  if (components.includes("CONTRAINTES")) lines.push("Contraintes : réponds par le titre exact d'un thésaurus existant si l'un convient.", "")
  lines.push(
    "Dans le cadre de la construction d'un thésaurus SKOS pour une institution patrimoniale, à quel thésaurus faut-il rattacher le concept suivant ?",
    `prefLabel: ${concept.prefLabel}`,
    `altLabel: ${fmtList(concept.altLabel)}`,
    `definition: ${concept.definition}`,
    `broader: ${concept.broader}`,
    "Réponds par le titre du thésaurus."
  )
  return lines.join("\n")
}

export async function generateThesaurusB4(candidates, iteration) {
  await wait(1000 + Math.random() * 600)
  const pick = candidates[Math.min(iteration - 1, candidates.length - 1)] || candidates[0]
  return pick ? pick.titre : "Nouveau thésaurus"
}

export function alignmentContext(concepts, sourceIds) {
  const sources = SOURCES_EXTERNES.filter((s) => sourceIds.includes(s.id))
  const calls = sources.map((s) => ({
    id: s.id,
    label: `${s.serveur} › search_concepts`,
    score: 0.7 + Math.random() * 0.25,
    include: true,
    text: `Source : ${s.nom}\nRequêtes : ${concepts.slice(0, 5).map((c) => c.prefLabel).join(", ")}${concepts.length > 5 ? "…" : ""}\nCandidats renvoyés : ${concepts.length * 3}`,
  }))
  const relations = concepts.slice(0, 4).map((c) => `(${c.prefLabel}) —broader→ (${c.broader})`)
  return { examples: calls, relations }
}

export function alignmentPrompt(thesaurusNom, concepts, examples) {
  const ex = examples.filter((e) => e.include)
  return [
    "Tu es un agent d'alignement de vocabulaires SKOS.",
    `Aligne les concepts du thésaurus « ${thesaurusNom} » avec les référentiels externes.`,
    "Pour chaque paire, indique le type : exactMatch, closeMatch, broadMatch ou relatedMatch.",
    "",
    "Résultats des outils MCP :",
    ...ex.map((e) => `--- ${e.label} ---\n${e.text}`),
    "",
    "Concepts :",
    ...concepts.map((c) => `- ${c.prefLabel} : ${c.definition}`),
  ].join("\n")
}

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")

export async function generateAlignments(concepts, sourceIds, iteration) {
  await wait(1500 + Math.random() * 800)
  const sources = SOURCES_EXTERNES.filter((s) => sourceIds.includes(s.id))
  const out = []
  concepts.forEach((c, i) => {
    const e = lookup(c.prefLabel)
    sources.forEach((s, j) => {
      if ((i + j + iteration) % 4 === 3) return
      const english = s.id === "aat" || s.id === "wikidata"
      const label = english && e ? e.en : c.prefLabel
      const exact = (i + j + iteration) % 3 !== 0
      out.push({
        key: `${c.id}-${s.id}`,
        conceptId: c.id,
        conceptLabel: c.prefLabel,
        source: s.nom,
        externeLabel: label,
        uri: s.base + slug(label),
        type: exact ? "exactMatch" : (i + j) % 2 ? "closeMatch" : "broadMatch",
        score: exact ? 0.86 + ((i * 7 + j * 3) % 12) / 100 : 0.62 + ((i * 5 + j) % 18) / 100,
      })
    })
  })
  return out
}

export function skosTurtle(thesaurus, concepts, alignements) {
  const base = `https://espadon.example.org/thesaurus/${slug(thesaurus.nom)}/`
  const lines = [
    "@prefix skos: <http://www.w3.org/2004/02/skos/core#> .",
    "@prefix dct:  <http://purl.org/dc/terms/> .",
    `@prefix th:   <${base}> .`,
    "",
    `th:scheme a skos:ConceptScheme ;`,
    `    dct:title "${thesaurus.nom}"@fr ;`,
    `    dct:subject "${thesaurus.domaine}"@fr .`,
    "",
  ]
  for (const c of concepts) {
    const id = slug(c.prefLabel)
    const props = [
      `th:${id} a skos:Concept`,
      `    skos:inScheme th:scheme`,
      `    skos:prefLabel "${c.prefLabel}"@fr`,
      ...c.altLabel.map((a) => `    skos:altLabel "${a}"@fr`),
      `    skos:definition "${c.definition.replace(/"/g, '\\"')}"@fr`,
      `    skos:broader th:${slug(c.broader)}`,
      ...c.narrower.map((n) => `    skos:narrower th:${slug(n)}`),
      ...alignements.filter((a) => a.conceptId === c.id).map((a) => `    skos:${a.type} <${a.uri}>`),
    ]
    lines.push(props.join(" ;\n") + " .", "")
  }
  return lines.join("\n")
}

export const knownTerms = Object.keys(DICTIONNAIRE)
