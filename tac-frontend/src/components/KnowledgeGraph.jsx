import { useEffect, useMemo, useRef, useState } from "react"
import { Box, Chip, FormControlLabel, Grid, IconButton, Stack, Switch, Tooltip, Typography } from "@mui/material"
import AddOutlined from "@mui/icons-material/AddOutlined"
import RemoveOutlined from "@mui/icons-material/RemoveOutlined"
import CenterFocusStrongOutlined from "@mui/icons-material/CenterFocusStrongOutlined"
import { BASE_THESAURI } from "../demo/vectorBase"
import { graphOf } from "../demo/graph"
import { brand, viz } from "../theme"


const W = 960
const H = 620
const R_CONCEPT = 26
const R_THESO = 38
const THESO = "__theso"

function simulate(nodes, links) {
  const n = nodes.length
  const p = nodes.map((_, i) => {
    const a = (i / Math.max(n, 1)) * Math.PI * 2
    const r = 60 + (i % 5) * 40
    return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r }
  })
  const idx = new Map(nodes.map((nd, i) => [nd.id, i]))
  const L = links.map((l) => [idx.get(l.source), idx.get(l.target), l.type === "APPARTIENT" ? 190 : 130])
  for (let it = 0, t = 40; it < 450; it++, t *= 0.992) {
    const d = p.map(() => ({ x: 0, y: 0 }))
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = p[i].x - p[j].x, dy = p[i].y - p[j].y
        let dist2 = dx * dx + dy * dy
        if (dist2 < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist2 = 0.5 }
        const f = 9000 / dist2
        const dist = Math.sqrt(dist2)
        d[i].x += (dx / dist) * f; d[i].y += (dy / dist) * f
        d[j].x -= (dx / dist) * f; d[j].y -= (dy / dist) * f
      }
    }
    for (const [a, b, len] of L) {
      const dx = p[b].x - p[a].x, dy = p[b].y - p[a].y
      const dist = Math.hypot(dx, dy) || 1
      const f = (dist - len) * 0.06
      d[a].x += (dx / dist) * f; d[a].y += (dy / dist) * f
      d[b].x -= (dx / dist) * f; d[b].y -= (dy / dist) * f
    }
    for (let i = 0; i < n; i++) {
      d[i].x += (W / 2 - p[i].x) * 0.012
      d[i].y += (H / 2 - p[i].y) * 0.012
      const m = Math.hypot(d[i].x, d[i].y) || 1
      const step = Math.min(m, t)
      p[i].x += (d[i].x / m) * step
      p[i].y += (d[i].y / m) * step
    }
  }
  return new Map(nodes.map((nd, i) => [nd.id, p[i]]))
}

const court = (s, n = 12) => (s.length > n ? s.slice(0, n - 1) + "…" : s)

function lignes(label, max) {
  const mots = label.split(/\s+/)
  const out = [""]
  for (const m of mots) {
    const cur = out[out.length - 1]
    if (!cur) out[out.length - 1] = m
    else if ((cur + " " + m).length <= max) out[out.length - 1] = cur + " " + m
    else out.push(m)
  }
  if (out.length > 2) return [out[0], court(out.slice(1).join(" "), max)]
  return out.map((l) => court(l, max))
}

const STYLE = {
  Thesaurus: { fill: viz.amber, stroke: "#c27c06", text: "#3b2400" },
  Concept: { fill: viz.indigo, stroke: "#4338ca", text: "#fff" },
  Absent: { fill: "#e5e7eb", stroke: "#9aa3b2", text: "#374151" },
}

export default function KnowledgeGraph() {
  const [theso, setTheso] = useState(BASE_THESAURI[3].id)
  const [selected, setSelected] = useState(null)
  const [appartient, setAppartient] = useState(true)
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [pos, setPos] = useState(new Map())
  const svgRef = useRef(null)
  const drag = useRef(null)
  const info = BASE_THESAURI.find((t) => t.id === theso)

  const { nodes, edges, concepts } = useMemo(() => graphOf(theso), [theso])

  const graph = useMemo(() => {
    const gNodes = [
      { id: THESO, label: info.titre, kind: "Thesaurus" },
      ...nodes.map((n) => ({ id: n.id, label: n.label, kind: n.inBase ? "Concept" : "Absent", src: n })),
    ]
    const links = [
      ...edges.map((e) => ({ source: e.from, target: e.to, type: "BROADER" })),
      ...(appartient ? nodes.filter((n) => n.inBase).map((n) => ({ source: n.id, target: THESO, type: "APPARTIENT" })) : []),
    ]
    return { gNodes, links }
  }, [nodes, edges, appartient, info])

  useEffect(() => {
    setPos(simulate(graph.gNodes, graph.links))
  }, [graph])

  useEffect(() => { setView({ x: 0, y: 0, k: 1 }); setSelected(null) }, [theso])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e) => {
      e.preventDefault()
      const pt = toSvg(e.clientX, e.clientY)
      setView((v) => {
        const k = Math.min(3, Math.max(0.3, v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)))
        return { k, x: pt.x - ((pt.x - v.x) / v.k) * k, y: pt.y - ((pt.y - v.y) / v.k) * k }
      })
    }
    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
  }, [])

  function toSvg(cx, cy) {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = cx; pt.y = cy
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }

  const onPointerDown = (e, id) => {
    e.stopPropagation()
    svgRef.current.setPointerCapture(e.pointerId)
    const pt = toSvg(e.clientX, e.clientY)
    drag.current = id
      ? { id, moved: false }
      : { pan: true, sx: pt.x, sy: pt.y, vx: view.x, vy: view.y, moved: false }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const pt = toSvg(e.clientX, e.clientY)
    d.moved = true
    if (d.pan) setView((v) => ({ ...v, x: d.vx + pt.x - d.sx, y: d.vy + pt.y - d.sy }))
    else setPos((m) => new Map(m).set(d.id, { x: (pt.x - view.x) / view.k, y: (pt.y - view.y) / view.k }))
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.id && !d.moved) setSelected(d.id)
    if (d.pan && !d.moved) setSelected(null)
  }

  const zoom = (f) => setView((v) => {
    const k = Math.min(3, Math.max(0.3, v.k * f))
    return { k, x: W / 2 - ((W / 2 - v.x) / v.k) * k, y: H / 2 - ((H / 2 - v.y) / v.k) * k }
  })

  const radius = (n) => (n.kind === "Thesaurus" ? R_THESO : R_CONCEPT)
  const sel = graph.gNodes.find((n) => n.id === selected)
  const voisins = new Set(selected ? graph.links.flatMap((l) => (l.source === selected ? [l.target] : l.target === selected ? [l.source] : [])) : [])
  const nbAbsents = nodes.filter((n) => !n.inBase).length

  const cypher = `MATCH (c:Concept)-[r:BROADER${appartient ? "|APPARTIENT" : ""}]->(n)\nWHERE c.id_theso = "${info.id}"\nRETURN c, r, n`

  return (
    <Box>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
        {BASE_THESAURI.map((t) => (
          <Chip key={t.id} label={t.titre} onClick={() => setTheso(t.id)}
            color={t.id === theso ? "primary" : "default"} variant={t.id === theso ? "filled" : "outlined"} />
        ))}
      </Stack>

      <Box component="pre" sx={{
        m: 0, mb: 1.5, px: 1.5, py: 1, borderRadius: 1.5, background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)", color: "#e0e7ff",
        fontFamily: "Consolas, 'Courier New', monospace", fontSize: "0.78rem", whiteSpace: "pre-wrap",
      }}>
        <Box component="span" sx={{ color: "#5eead4" }}>neo4j$ </Box>{cypher}
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ position: "relative", border: `1px solid ${brand.stoneLight}`, borderRadius: 2, bgcolor: "background.paper", overflow: "hidden" }}>
            <Stack direction="row" sx={{ position: "absolute", top: 10, left: 12, gap: 0.75, flexWrap: "wrap", zIndex: 1 }}>
              <LabelChip kind="Thesaurus" text="Thesaurus (1)" />
              <LabelChip kind="Concept" text={`Concept (${concepts.length})`} />
              {nbAbsents > 0 && <LabelChip kind="Absent" text={`Hors base (${nbAbsents})`} />}
              <RelChip text={`BROADER (${edges.length})`} />
              {appartient && <RelChip color="#b45309" text={`APPARTIENT (${concepts.length})`} />}
            </Stack>
            <Stack sx={{ position: "absolute", right: 10, bottom: 10, zIndex: 1, bgcolor: "background.paper", border: `1px solid ${brand.stoneLight}`, borderRadius: 1.5 }}>
              <Tooltip title="Zoom +" placement="left"><IconButton size="small" onClick={() => zoom(1.2)}><AddOutlined fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Zoom −" placement="left"><IconButton size="small" onClick={() => zoom(1 / 1.2)}><RemoveOutlined fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Recentrer" placement="left"><IconButton size="small" onClick={() => setView({ x: 0, y: 0, k: 1 })}><CenterFocusStrongOutlined fontSize="small" /></IconButton></Tooltip>
            </Stack>

            <svg
              ref={svgRef} viewBox={`0 0 ${W} ${H}`}
              style={{ display: "block", width: "100%", height: "auto", touchAction: "none", cursor: drag.current?.pan ? "grabbing" : "grab",
                backgroundImage: `radial-gradient(${brand.stoneLight} 1px, transparent 1px)`, backgroundSize: "22px 22px" }}
              aria-label={`Graphe du thésaurus ${info.titre}`}
              onPointerDown={(e) => onPointerDown(e, null)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            >
              <defs>
                <marker id="kg-fleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
                </marker>
                <marker id="kg-fleche-app" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={viz.amber} />
                </marker>
                <marker id="kg-fleche-sel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={viz.rose} />
                </marker>
              </defs>

              <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
                {graph.links.map((l) => {
                  const a = pos.get(l.source), b = pos.get(l.target)
                  if (!a || !b) return null
                  const ra = radius(graph.gNodes.find((n) => n.id === l.source))
                  const rb = radius(graph.gNodes.find((n) => n.id === l.target))
                  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1
                  const x1 = a.x + (dx / len) * ra, y1 = a.y + (dy / len) * ra
                  const x2 = b.x - (dx / len) * (rb + 2), y2 = b.y - (dy / len) * (rb + 2)
                  const actif = selected && (l.source === selected || l.target === selected)
                  const estomp = selected && !actif
                  let ang = (Math.atan2(dy, dx) * 180) / Math.PI
                  if (ang > 90 || ang < -90) ang += 180
                  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
                  const app = l.type === "APPARTIENT"
                  return (
                    <g key={`${l.source}-${l.type}-${l.target}`} opacity={estomp ? 0.15 : 1}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={actif ? viz.rose : app ? viz.amber : "#94a3b8"}
                        strokeWidth={actif ? 2.2 : 1.4} strokeDasharray={app ? "4 4" : ""} markerEnd={`url(#${actif ? "kg-fleche-sel" : app ? "kg-fleche-app" : "kg-fleche"})`} />
                      {len > 90 && (
                        <text x={mx} y={my} transform={`rotate(${ang} ${mx} ${my})`} dy="-4" textAnchor="middle"
                          fontSize="9.5" fontWeight="600" letterSpacing="0.04em" style={{ pointerEvents: "none", fill: actif ? viz.rose : brand.slate }}>{l.type}</text>
                      )}
                    </g>
                  )
                })}

                {graph.gNodes.map((n) => {
                  const p = pos.get(n.id)
                  if (!p) return null
                  const st = STYLE[n.kind]
                  const r = radius(n)
                  const actif = selected === n.id
                  const estomp = selected && !actif && !voisins.has(n.id)
                  const ls = lignes(n.label, n.kind === "Thesaurus" ? 11 : 9)
                  return (
                    <g key={n.id} transform={`translate(${p.x},${p.y})`} opacity={estomp ? 0.25 : 1}
                      style={{ cursor: "pointer" }} role="button" tabIndex={0}
                      onPointerDown={(e) => onPointerDown(e, n.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(n.id)}>
                      <title>{n.label}{n.kind === "Absent" ? " (cité dans une relation, hors base)" : ""}</title>
                      {actif && <circle r={r + 7} fill="none" stroke={viz.rose} strokeWidth="3" opacity="0.45" />}
                      <circle r={r} fill={st.fill} style={{ filter: n.kind === "Absent" ? "none" : "drop-shadow(0 3px 5px rgba(0,0,0,0.18))" }} stroke={st.stroke} strokeWidth={actif ? 3 : 1.8} strokeDasharray={n.kind === "Absent" ? "4 3" : ""} />
                      {ls.map((t, i) => (
                        <text key={i} y={(i - (ls.length - 1) / 2) * 11.5 + 3.5} textAnchor="middle" fontSize="10" fontWeight="600"
                          fill={st.text} style={{ pointerEvents: "none", userSelect: "none" }}>{t}</text>
                      ))}
                    </g>
                  )
                })}
              </g>
            </svg>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, mt: 1, alignItems: "center", fontSize: "0.8125rem", color: "text.secondary" }}>
            <span>Glisser un nœud pour le déplacer · glisser le fond pour naviguer · molette pour zoomer</span>
            <FormControlLabel control={<Switch size="small" checked={appartient} onChange={(e) => setAppartient(e.target.checked)} />}
              label={<Typography sx={{ fontSize: "0.8125rem" }}>Afficher APPARTIENT</Typography>} />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ border: `1px solid ${brand.stoneLight}`, borderRadius: 2, p: 2, height: "100%", bgcolor: "background.paper" }}>
            {!sel && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                Cliquez sur un nœud pour voir ses propriétés (lues dans la base vectorielle) et ses relations (lues dans le graphe).
                <br /><br />
                Ce thésaurus : {concepts.length} concepts, {edges.length} relations BROADER.
              </Typography>
            )}
            {sel?.kind === "Thesaurus" && (
              <Detail kind="Thesaurus" titre={info.titre} lignes={[["<id>", info.id], ["id_theso", info.id], ["Concepts (APPARTIENT)", concepts.length], ["Relations BROADER", edges.length]]} />
            )}
            {sel && sel.kind !== "Thesaurus" && (
              <Detail kind={sel.kind} titre={sel.label} lignes={[
                ...(sel.src.inBase
                  ? [["id_concept", sel.src.data.id_concept], ["prefLabel", sel.label], ["altLabel", sel.src.data.altLabel.join(" ; ") || "—"], ["definition", sel.src.data.definition || "—"]]
                  : [["Statut", "absent de la base (cité dans une relation)"]]),
                ["Génériques (BROADER →)", edges.filter((e) => e.from === sel.id).map((e) => nodes.find((n) => n.id === e.to).label).join(" ; ") || "—"],
                ["Spécifiques (← BROADER)", edges.filter((e) => e.to === sel.id).map((e) => nodes.find((n) => n.id === e.from).label).join(" ; ") || "—"],
                ...(sel.src.inBase ? [["APPARTIENT", info.titre]] : []),
              ]} />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

function LabelChip({ kind, text }) {
  const st = STYLE[kind]
  return (
    <Box sx={{ px: 1, py: 0.25, borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, bgcolor: st.fill, color: st.text,
      border: `1.5px ${kind === "Absent" ? "dashed" : "solid"} ${st.stroke}` }}>{text}</Box>
  )
}

function RelChip({ text, color = "#64748b" }) {
  return (
    <Box sx={{ px: 1, py: 0.25, borderRadius: 0.75, fontSize: "0.72rem", fontWeight: 600, bgcolor: "background.paper", color, border: `1.5px solid ${color}` }}>{text}</Box>
  )
}

function Detail({ kind, titre, lignes }) {
  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <LabelChip kind={kind} text={kind === "Absent" ? "Hors base" : kind} />
        <Typography sx={{ fontWeight: 700 }}>{titre}</Typography>
      </Stack>
      <Stack spacing={1.25}>
        {lignes.map(([k, v]) => (
          <Box key={k}>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontFamily: "Consolas, monospace" }}>{k}</Typography>
            <Typography sx={{ fontSize: "0.875rem", wordBreak: "break-word" }}>{String(v)}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
