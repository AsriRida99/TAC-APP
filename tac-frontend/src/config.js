const env = import.meta.env

export const DEMO_AUTH = env.VITE_DEMO_AUTH !== "false"

export const API = {
  auth: env.VITE_API_AUTH || "http://localhost:8010",
  termes: env.VITE_API_TERMES || "http://localhost:8000",
  concepts: env.VITE_API_CONCEPTS || "http://localhost:8001",
  thesaurus: env.VITE_API_THESAURUS || "http://localhost:8002",
  alignements: env.VITE_API_ALIGNEMENTS || "http://localhost:8003",
  export: env.VITE_API_EXPORT || "http://localhost:8005",
}
