"use client"

export type GalaxiaUser = { id: string; email: string; name?: string }

const LS_KEY = "galaxia_user"
const USERS_KEY = "galaxia_users"

function getUsers(): any[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") } catch { return [] }
}

function saveUsers(users: any[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getUser(): GalaxiaUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setUser(u: GalaxiaUser | null) {
  if (u) localStorage.setItem(LS_KEY, JSON.stringify(u))
  else localStorage.removeItem(LS_KEY)
  if (typeof window !== "undefined") window.dispatchEvent(new Event("galaxia-auth-change"))
}

export async function signUp(email: string, password: string, name?: string) {
  const users = getUsers()
  if (users.find(u => u.email === email)) throw new Error("User already exists")
  const u = { id: "u_" + Date.now(), email, password, name }
  users.push(u)
  saveUsers(users)
  const out = { id: u.id, email, name }
  setUser(out)
  return out
}

export async function signIn(email: string, password: string) {
  const users = getUsers()
  const u = users.find(x => x.email === email && x.password === password)
  if (!u) throw new Error("Invalid email or password")
  const out = { id: u.id, email: u.email, name: u.name }
  setUser(out)
  return out
}

export async function signOut() {
  setUser(null)
}