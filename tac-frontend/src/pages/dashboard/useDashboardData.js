import { useCallback, useEffect, useState } from "react"
import { API } from "../../config"
import { apiFetch } from "../../api/http"

const SOURCES = [
  { key: "termes", label: "Termes", base: API.termes, path: "/termes" },
  { key: "concepts", label: "Concepts", base: API.concepts, path: "/concepts" },
  { key: "thesauri", label: "Thésaurus", base: API.thesaurus, path: "/thesaurus" },
  { key: "alignements", label: "Alignements", base: API.alignements, path: "/alignements" },
  { key: "exports", label: "Export", base: API.export, path: "/export" },
]

function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") return Object.values(data).find(Array.isArray) ?? []
  return []
}

export default function useDashboardData() {
  const [state, setState] = useState({ loading: true, data: {}, status: {} })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    const results = await Promise.allSettled(SOURCES.map((s) => apiFetch(s.base, s.path)))
    const data = {}
    const status = {}
    results.forEach((r, i) => {
      const { key } = SOURCES[i]
      data[key] = r.status === "fulfilled" ? toArray(r.value) : []
      status[key] = r.status === "fulfilled"
    })
    setState({ loading: false, data, status })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, sources: SOURCES, reload: load }
}
