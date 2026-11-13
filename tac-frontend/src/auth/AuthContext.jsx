import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { API } from "../config"
import { apiFetch, getToken, setToken } from "../api/http"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    apiFetch(API.auth, "/auth/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await apiFetch(API.auth, "/auth/login", { method: "POST", body: { email, password } })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await apiFetch(API.auth, "/auth/register", { method: "POST", body: payload })
    if (data.pending) return { pending: true, user: data.user }
    setToken(data.token)
    setUser(data.user)
    return { pending: false, user: data.user }
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const updated = await apiFetch(API.auth, "/auth/me", { method: "PATCH", body: payload })
    setUser(updated)
    return updated
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, updateProfile, logout }),
    [user, loading, login, register, updateProfile, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
