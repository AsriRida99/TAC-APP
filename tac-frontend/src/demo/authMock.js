
const USERS_KEY = "tac_demo_users"

export const DEMO_ACCOUNT = { email: "admin@tac.demo", password: "admin123" }

function now() {
  return new Date().toISOString()
}

function seed() {
  return [
    {
      id: 1,
      nom: "Administrateur démo",
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
      role: "admin",
      statut: "actif",
      organisation: "Fondation des Sciences du Patrimoine",
      motif: "",
      avatar: null,
      created_at: now(),
      last_login: null,
      decided_at: null,
      decided_by: null,
    },
  ]
}

let memoryUsers = null

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
  }
  if (!memoryUsers) memoryUsers = seed()
  return memoryUsers
}

function saveUsers(users) {
  memoryUsers = users
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
  }
}

function pub(u) {
  const { password: _password, ...rest } = u
  return rest
}

function fail(detail, status) {
  const err = new Error(detail)
  err.status = status
  throw err
}

function currentUser(users, token) {
  const u = users.find((x) => String(x.id) === String(token))
  if (!u || u.statut !== "actif") fail("Session expirée, reconnectez-vous", 401)
  return u
}

export async function mockAuth(path, { method = "GET", body } = {}, token) {
  const users = loadUsers()
  const email = (body?.email || "").trim().toLowerCase()

  if (method === "POST" && path === "/auth/login") {
    const u = users.find((x) => x.email === email && x.password === body?.password)
    if (!u) fail("Email ou mot de passe incorrect", 401)
    if (u.statut === "en attente") fail("Votre compte est en attente de validation par un administrateur", 403)
    if (u.statut !== "actif") fail("Ce compte n'est pas actif", 403)
    u.last_login = now()
    saveUsers(users)
    return { token: String(u.id), user: pub(u) }
  }

  if (method === "POST" && path === "/auth/register") {
    if (!body?.nom?.trim() || !email) fail("Nom et email obligatoires", 422)
    if ((body.password || "").length < 6) fail("Le mot de passe doit contenir au moins 6 caractères", 422)
    if (users.some((x) => x.email === email)) fail("Un compte existe déjà avec cet email", 409)
    const u = {
      id: Math.max(0, ...users.map((x) => x.id)) + 1,
      nom: body.nom.trim(),
      email,
      password: body.password,
      role: "curateur",
      statut: "en attente",
      organisation: body.organisation || "",
      motif: body.motif || "",
      avatar: body.avatar || null,
      created_at: now(),
      last_login: null,
      decided_at: null,
      decided_by: null,
    }
    saveUsers([...users, u])
    return { pending: true, user: pub(u) }
  }

  if (path === "/auth/me") {
    const me = currentUser(users, token)
    if (method === "GET") return pub(me)
    if (method === "PATCH") {
      for (const key of ["nom", "organisation", "avatar"]) if (body && key in body) me[key] = body[key]
      if (body?.password) me.password = body.password
      saveUsers(users)
      return pub(me)
    }
  }

  if (path.startsWith("/admin/users")) {
    const me = currentUser(users, token)
    if (me.role !== "admin") fail("Réservé aux administrateurs", 403)
    if (method === "GET" && path === "/admin/users") return { users: users.map(pub) }

    const id = Number(path.split("/").pop())
    const target = users.find((x) => x.id === id)
    if (!target) fail("Utilisateur introuvable", 404)

    if (method === "PATCH") {
      if (body?.role) target.role = body.role
      if (body?.statut && body.statut !== target.statut) {
        target.statut = body.statut
        target.decided_at = now()
        target.decided_by = me.nom
      }
      saveUsers(users)
      return pub(target)
    }
    if (method === "DELETE") {
      if (target.id === me.id) fail("Vous ne pouvez pas supprimer votre propre compte", 400)
      saveUsers(users.filter((x) => x.id !== id))
      return { ok: true }
    }
  }

  fail(`Route démo inconnue : ${method} ${path}`, 404)
}
