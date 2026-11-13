import { useMemo } from "react"
import { useDemo } from "../../demo/DemoStore"

export default function useDemoDashboard() {
  const { db } = useDemo()
  const data = useMemo(() => {
    const validated = db.concepts.map((c) => ({ ...c, statut: "validé" }))
    const rejected = db.concepts.flatMap((c) =>
      c.history.filter((h) => h.decision === "rejeté").map((h) => ({ prefLabel: c.prefLabel, statut: "rejeté", validated_by: h.user }))
    )
    const pending = db.termes.filter((t) => t.statut === "nouveau").map((t) => ({ prefLabel: t.label, statut: "en attente" }))
    return {
      termes: db.termes,
      concepts: [...validated, ...rejected, ...pending],
      conceptsValides: validated,
      thesauri: db.thesauri,
      alignements: db.alignements.map((a) => ({
        ...a,
        type_alignement: a.type,
        concept_tac_label: a.conceptLabel,
        concept_externe_label: a.externeLabel,
      })),
      exports: db.exports,
    }
  }, [db])
  return { data }
}
