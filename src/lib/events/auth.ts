import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminGate =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 | 503; message: string };

export async function requireAdmin(): Promise<AdminGate> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true, userId: "dev-admin" };
    }
    return {
      ok: false,
      status: 503,
      message: "Admin auth is not configured. Set Supabase environment variables.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, message: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return { ok: false, status: 403, message: "Admin access required." };
  }

  return { ok: true, userId: user.id };
}
