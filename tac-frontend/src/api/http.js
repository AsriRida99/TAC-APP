import { API, DEMO_AUTH } from "../config"
import { mockAuth } from "../demo/authMock"

const TOKEN_KEY = "tac_token"

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function apiFetch(baseUrl, path, { method = "GET", body, headers = {} } = {}) {
  const token = getToken()
  if (DEMO_AUTH && baseUrl === API.auth) {
    try {
      return await mockAuth(path, { method, body }, token)
    } catch (err) {
      throw new ApiError(err.message, err.status ?? 500)
    }
  }
  let res
  try {
    res = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(`Service injoignable (${baseUrl})`, 0)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : `Erreur ${res.status}`
    throw new ApiError(detail, res.status)
  }
  return data
}
