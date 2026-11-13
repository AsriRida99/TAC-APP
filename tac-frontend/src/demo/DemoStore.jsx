import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createSeed } from "./seed"
import { useAuth } from "../auth/AuthContext"

const DemoContext = createContext(null)

const now = () => new Date().toISOString()
let idCounter = 1000
const newId = (prefix) => `${prefix}${++idCounter}`

export function DemoProvider({ children }) {
  const [db, setDb] = useState(createSeed)
  const { user } = useAuth()
  const me = user?.nom || "Utilisateur"

  const update = useCallback((key, fn) => setDb((d) => ({ ...d, [key]: fn(d[key]) })), [])

  const dbRef = useRef(db)
  useEffect(() => {
    dbRef.current = db
  }, [db])
  const promptRef = useRef(db.promptCounter)

  const nextPromptId = useCallback(() => `P-${String(++promptRef.current).padStart(4, "0")}`, [])

  const actions = useMemo(() => ({
    addTermes(labels, source) {
      const known = new Set(dbRef.current.termes.map((t) => t.label.toLowerCase()))
      const fresh = []
      for (const raw of labels) {
        const label = String(raw).trim()
        if (!label || known.has(label.toLowerCase())) continue
        known.add(label.toLowerCase())
        fresh.push({ id: newId("T"), label, source, created_at: now(), created_by: me, statut: "nouveau" })
      }
      dbRef.current = { ...dbRef.current, termes: [...fresh, ...dbRef.current.termes] }
      update("termes", (ts) => [...fresh, ...ts])
      return fresh.length
    },
    updateTerme: (id, label) => update("termes", (ts) => ts.map((t) => (t.id === id ? { ...t, label } : t))),
    deleteTermes: (ids) => update("termes", (ts) => ts.filter((t) => !ids.includes(t.id))),

    saveConcept(result, meta) {
      const concept = {
        id: newId("C"),
        termeId: meta.termeId,
        terme: meta.terme,
        ...result,
        statut: "validé",
        iteration: meta.history.length,
        model: meta.model,
        promptId: meta.history.at(-1).promptId,
        validated_by: me,
        validated_at: now(),
        opentheso: { statut: "non envoyé" },
        history: meta.history,
      }
      setDb((d) => ({
        ...d,
        concepts: [concept, ...d.concepts],
        termes: d.termes.map((t) => (t.id === meta.termeId ? { ...t, statut: "concept généré" } : t)),
      }))
      return concept.id
    },
    updateConcept: (id, patch) => update("concepts", (cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    deleteConcept(id) {
      setDb((d) => {
        const c = d.concepts.find((x) => x.id === id)
        return {
          ...d,
          concepts: d.concepts.filter((x) => x.id !== id),
          termes: d.termes.map((t) => (t.id === c?.termeId ? { ...t, statut: "nouveau" } : t)),
          thesauri: d.thesauri.map((t) => ({ ...t, conceptIds: t.conceptIds.filter((x) => x !== id) })),
        }
      })
    },

    saveThesaurus(result, meta) {
      const createdId = result.existingId ? null : newId("TH")
      setDb((d) => {
        if (result.existingId) {
          return {
            ...d,
            thesauri: d.thesauri.map((t) =>
              t.id === result.existingId
                ? {
                    ...t,
                    conceptIds: [...new Set([...t.conceptIds, ...result.conceptIds])],
                    iteration: t.iteration + meta.history.length,
                    validated_by: me,
                    validated_at: now(),
                    history: [...t.history, ...meta.history],
                    opentheso: t.opentheso.statut === "publié" ? { statut: "à mettre à jour" } : t.opentheso,
                  }
                : t
            ),
          }
        }
        const th = {
          id: createdId,
          nom: result.nom,
          domaine: result.domaine,
          langue: result.langue,
          conceptIds: result.conceptIds,
          statut: "validé",
          iteration: meta.history.length,
          model: meta.model,
          promptId: meta.history.at(-1).promptId,
          validated_by: me,
          validated_at: now(),
          opentheso: { statut: "non envoyé" },
          history: meta.history,
        }
        return { ...d, thesauri: [...d.thesauri, th] }
      })
      return result.existingId || createdId
    },
    updateThesaurus: (id, patch) => update("thesauri", (ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    deleteThesaurus: (id) =>
      setDb((d) => ({
        ...d,
        thesauri: d.thesauri.filter((t) => t.id !== id),
        alignements: d.alignements.filter((a) => a.thesaurusId !== id),
        exports: d.exports.filter((e) => e.thesaurusId !== id),
      })),

    saveAlignements(results, meta) {
      const fresh = results.map((r) => ({
        id: newId("A"),
        ...r,
        thesaurusId: meta.thesaurusId,
        thesaurusNom: meta.thesaurusNom,
        statut: "validé",
        iteration: meta.history.length,
        model: meta.model,
        validated_by: me,
        validated_at: now(),
        opentheso: { statut: "non envoyé" },
        history: meta.history,
      }))
      update("alignements", (as) => [...fresh, ...as])
    },
    updateAlignement: (id, patch) => update("alignements", (as) => as.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    deleteAlignement: (id) => update("alignements", (as) => as.filter((a) => a.id !== id)),

    addExport(e) {
      const exp = { id: newId("E"), ...e, created_at: now(), created_by: me, updated_at: now(), opentheso: { statut: "non envoyé" } }
      update("exports", (es) => [exp, ...es])
      return exp
    },
    updateExport: (id, patch) => update("exports", (es) => es.map((e) => (e.id === id ? { ...e, ...patch, updated_at: now() } : e))),
    deleteExport: (id) => update("exports", (es) => es.filter((e) => e.id !== id)),

    publish(key, ids) {
      update(key, (items) =>
        items.map((x) =>
          ids.includes(x.id)
            ? { ...x, opentheso: { statut: "publié", id: x.opentheso?.id || `ot-${Math.floor(2000 + Math.random() * 7000)}`, date: now() } }
            : x
        )
      )
    },

    addSync: (s) => update("syncs", (ss) => [{ id: newId("S"), date: now(), user: me, ...s }, ...ss]),

    reset() {
      const seed = createSeed()
      promptRef.current = seed.promptCounter
      setDb(seed)
    },
  }), [me, update])

  const value = useMemo(() => ({ db, me, nextPromptId, ...actions }), [db, me, nextPromptId, actions])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  return useContext(DemoContext)
}
