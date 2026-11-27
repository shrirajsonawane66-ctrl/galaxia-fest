"use client"

import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export type AdminUser = {
  id: string
  email: string
  role: string
}

function getSupabase() {
  return createClient()
}

export async function signInAdmin(email: string, password: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data.user) {
    throw new Error("No user returned")
  }

  // Check admin_profiles for this user
  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    throw new Error("Access denied. Admin profile not found.")
  }

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    await supabase.auth.signOut()
    throw new Error("Access denied. Insufficient permissions.")
  }

  return {
    user: data.user,
    role: profile.role,
  }
}

export async function signOutAdmin() {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getAdminSession() {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (error || !profile) return null

  return {
    user: session.user,
    role: profile.role,
  }
}

export function onAuthStateChange(callback: (user: User | null, role: string | null) => void) {
  const supabase = getSupabase()
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session) {
      callback(null, null)
      return
    }

    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    callback(session.user, profile?.role ?? null)
  })
}