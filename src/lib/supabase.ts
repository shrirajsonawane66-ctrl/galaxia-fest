import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export const supabaseAnon = url && anon ? createClient(url, anon) : null
export const supabaseService = url && service ? createClient(url, service) : null

// Fallback-safe helpers
export function hasSupabase() {
  return !!supabaseAnon
}
