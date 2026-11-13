export function fmtDate(iso, withTime = true) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
  return withTime ? `${date} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : date
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
