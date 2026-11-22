import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Allow login page without session
    if (request.nextUrl.pathname === "/admin/login") {
      if (session) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (profile && (profile.role === "admin" || profile.role === "super_admin")) {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url))
        }
        // Not admin, sign out and redirect to login
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL("/admin/login", request.url))
      }
      return response
    }

    // Protect all other admin routes
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}