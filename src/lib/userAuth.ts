"use client"
import { supabaseAnon } from "./supabase"

export type GalaxiaUser = { id: string; email: string; name?: string }

const LS_KEY = "galaxia_user"

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
  if (supabaseAnon) {
    const { data, error } = await supabaseAnon.auth.signUp({ email, password, options: { data: { name } } })
    if (error) throw new Error(error.message)
    const user = data.user ? { id: data.user.id, email: data.user.email || email, name } : null
    if (user) setUser(user)
    return user
  }
  // fallback demo: store in local users list
  const users: any[] = JSON.parse(localStorage.getItem("galaxia_users") || "[]")
  if (users.find(u => u.email === email)) throw new Error("User already exists")
  const u = { id: "u_" + Date.now(), email, password, name }
  users.push(u)
  localStorage.setItem("galaxia_users", JSON.stringify(users))
  const out = { id: u.id, email, name }
  setUser(out)
  return out
}

export async function signIn(email: string, password: string) {
  if (supabaseAnon) {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    const user = data.user ? { id: data.user.id, email: data.user.email || email, name: (data.user.user_metadata as any)?.name } : null
    if (user) setUser(user)
    return user
  }
  const users: any[] = JSON.parse(localStorage.getItem("galaxia_users") || "[]")
  const u = users.find(x => x.email === email && x.password === password)
  if (!u) throw new Error("Invalid email or password")
  const out = { id: u.id, email: u.email, name: u.name }
  setUser(out)
  return out
}

export async function signOut() {
  if (supabaseAnon) {
    await supabaseAnon.auth.signOut()
  }
  setUser(null)
}
