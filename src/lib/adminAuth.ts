"use client"
export function isAdminLogged() {
  if (typeof window === "undefined") return false
  return localStorage.getItem("galaxia_admin") === "1"
}
export function loginAdmin(user: string, pass: string) {
  // Demo credentials: admin / galaxia123 . In production, use Supabase Auth.
  if (user === "admin" && pass === "galaxia123") {
    localStorage.setItem("galaxia_admin", "1")
    return true
  }
  return false
}
export function logoutAdmin() {
  localStorage.removeItem("galaxia_admin")
}
