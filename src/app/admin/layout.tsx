"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, Ticket, Users, Calendar, Settings, LogOut, BookOpen, HelpCircle, Sparkles, CalendarDays } from "lucide-react"
import { Toaster } from "sonner"
import { getAdminSession, signOutAdmin, onAuthStateChange } from "@/lib/adminAuth"

export const dynamic = "force-dynamic"

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
  { href: "/admin/passes", label: "Passes / Prices", icon: Ticket },
  { href: "/admin/artists", label: "Artists", icon: Users },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/settings", label: "Event Settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true)
      return
    }

    let mounted = true

    const checkAdmin = async () => {
      const session = await getAdminSession()
      if (mounted) {
        setIsAdmin(!!session)
        setReady(true)
      }
    }

    checkAdmin()

    const { data: { subscription } } = onAuthStateChange((user, role) => {
      if (mounted) {
        setIsAdmin(user !== null && (role === "admin" || role === "super_admin"))
        if (!user || role !== "admin" && role !== "super_admin") {
          if (pathname !== "/admin/login") {
            router.replace("/admin/login")
          }
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  if (pathname === "/admin/login") return <>{children}</>

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        Checking admin session…
      </div>
    )
  }

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-white/50">Access denied</div>
  }

  return (
    <div className="min-h-screen text-white flex">
      <Toaster theme="dark" position="top-right" richColors />
      <aside className="w-64 shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-orbitron font-black text-sm">GALAXIA</div>
            <div className="text-xs text-white/40 font-space">Admin Panel</div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {nav.map(n => {
            const Icon = n.icon
            const active = pathname === n.href
            return (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-space transition ${active ? "bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-400/20 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                <Icon className="w-4 h-4" /> {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={async () => {
              await signOutAdmin()
              router.replace("/admin/login")
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <div className="text-[11px] text-white/30 font-space mt-3">Supabase Auth session</div>
          <Link href="/" className="text-xs text-cyan-300 hover:text-white mt-2 inline-block">← Back to site</Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden sticky top-0 z-40 bg-[#06123a]/85 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <span className="font-orbitron font-black text-sm">GALAXIA Admin</span>
          <button onClick={async () => { await signOutAdmin(); router.replace("/admin/login") }} className="text-xs text-white/60">Logout</button>
        </div>
        <div className="md:hidden overflow-x-auto border-b border-white/10 bg-black/20">
          <div className="flex gap-1 p-2">
            {nav.map(n => <Link key={n.href} href={n.href} className={`px-3 py-2 rounded-full text-xs whitespace-nowrap ${pathname === n.href ? "bg-white text-[#050816]" : "glass text-white/70"}`}>{n.label}</Link>)}
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}