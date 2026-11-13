import { BASE_THESAURI, CORPUS } from "./vectorBase"

const key = (s) => String(s || "").trim().toLowerCase()

export function graphOf(idTheso) {
  const nodes = new Map()
  const node = (label, data = null) => {
    const k = key(label)
    if (!nodes.has(k)) nodes.set(k, { id: k, label, data, inBase: Boolean(data) })
    else if (data && !nodes.get(k).data) Object.assign(nodes.get(k), { data, inBase: true })
    return nodes.get(k)
  }
  const concepts = CORPUS.filter((c) => c.id_theso === idTheso)
  concepts.forEach((c) => node(c.prefLabel, c))

  const edges = new Map()
  const broader = (enfant, parent) => {
    const a = node(enfant).id, b = node(parent).id
    if (a !== b) edges.set(`${a}>${b}`, { from: a, to: b })
  }
  concepts.forEach((c) => {
    if (c.broader) broader(c.prefLabel, c.broader)
    c.narrower.forEach((n) => broader(n, c.prefLabel))
  })
  return { nodes: [...nodes.values()], edges: [...edges.values()], concepts }
}

export function graphStats() {
  let noeuds = BASE_THESAURI.length, broader = 0, appartient = 0
  for (const t of BASE_THESAURI) {
    const g = graphOf(t.id)
    noeuds += g.nodes.length
    broader += g.edges.length
    appartient += g.concepts.length
  }
  return { noeuds, broader, appartient }
}
