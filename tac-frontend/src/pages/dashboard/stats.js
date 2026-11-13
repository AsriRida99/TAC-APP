
const isValidated = (x) => (x.statut || "").toLowerCase().startsWith("valid")
const isRejected = (x) => (x.statut || "").toLowerCase().startsWith("rejet")

export function countBy(items, getKey) {
  const out = new Map()
  for (const it of items) {
    const k = getKey(it)
    if (k === undefined || k === null || k === "") continue
    out.set(k, (out.get(k) || 0) + 1)
  }
  return out
}

export function statusBreakdown(items) {
  let valides = 0, rejetes = 0
  for (const it of items) {
    if (isValidated(it)) valides++
    else if (isRejected(it)) rejetes++
  }
  return { valides, rejetes, enAttente: items.length - valides - rejetes }
}

export function activitySeries(data, days = 30) {
  const today = new Date()
  const labels = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    labels.push(d.toISOString().slice(0, 10))
  }
  const serie = (items) => {
    const byDay = countBy(items.filter(isValidated), (x) => (x.validated_at || "").slice(0, 10))
    return labels.map((l) => byDay.get(l) || 0)
  }
  return {
    labels,
    series: [
      { name: "Concepts", data: serie(data.concepts || []) },
      { name: "Thésaurus", data: serie(data.thesauri || []) },
      { name: "Alignements", data: serie(data.alignements || []) },
    ],
  }
}

export function topValidators(data, limit = 6) {
  const all = [...(data.concepts || []), ...(data.thesauri || []), ...(data.alignements || [])]
  const counts = countBy(all.filter(isValidated), (x) => (x.validated_by || "").trim() || undefined)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}

export function iterationsDistribution(concepts) {
  const counts = countBy(concepts, (c) => (c.iteration ? Number(c.iteration) : undefined))
  return [...counts.entries()].sort((a, b) => a[0] - b[0])
}

export function recentValidations(data, limit = 8) {
  const tag = (items, type, label) =>
    items.filter((x) => x.validated_at).map((x) => ({ type, label: label(x), by: x.validated_by, at: x.validated_at, statut: x.statut }))
  return [
    ...tag(data.concepts || [], "Concept", (x) => x.prefLabel),
    ...tag(data.thesauri || [], "Thésaurus", (x) => x.nom),
    ...tag(data.alignements || [], "Alignement", (x) => `${x.concept_tac_label} ↔ ${x.concept_externe_label}`),
  ]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, limit)
}
