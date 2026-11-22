"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, Ticket, Users, Calendar, Settings, LogOut, BookOpen, HelpCircle, CalendarDays, Star, Menu } from "lucide-react"
import { Toaster } from "sonner"
import { getAdminSession, signOutAdmin, onAuthStateChange } from "@/lib/adminAuth"
import { Sheet, SheetContent, SheetCloseButton, SheetTrigger } from "@/components/ui/sheet"

export const dynamic = "force-dynamic"

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
  { href: "/admin/passes", label: "Passes / Prices", icon: Ticket },
  { href: "/admin/artists", label: "Artists", icon: Users },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/performers", label: "Performers", icon: Star },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/settings", label: "Event Settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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

  // Close the admin sheet whenever a nav item is followed.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  if (pathname === "/admin/login") return <>{children}</>

  if (!ready) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center text-[var(--text-muted)]">
        Checking admin session…
      </div>
    )
  }

  if (!isAdmin) {
    return <div className="min-h-[100svh] flex items-center justify-center text-[var(--text-muted)]">Access denied</div>
  }

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <div className="flex min-h-[100svh] text-[var(--text-body)]">
        <Toaster theme="dark" position="top-right" richColors />
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#06123A]/90 sticky top-0 h-[100dvh] overflow-y-auto lg:flex lg:flex-col">
          <div className="p-6 border-b border-white/10 flex items-center gap-2.5">
            <Image
              src="/images/logo-trim.png"
              alt="Galaxia i-Fest"
              width={1595}
              height={1131}
              sizes="40px"
              className="h-10 w-auto shrink-0 object-contain"
            />
            <div>
              <div className="font-sans font-semibold text-sm text-[var(--text-strong)]">GALAXIA</div>
              <div className="text-sm text-[var(--text-muted)] font-space">Admin panel</div>
            </div>
          </div>
          <nav className="p-3 space-y-1 flex-1">
            {nav.map(n => {
              const Icon = n.icon
              const active = pathname === n.href
              return (
                <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-space transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] ${active ? "bg-white/10 border border-white/15 text-[var(--text-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-white/5"}`}>
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
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
            <div className="text-[13px] text-[var(--text-muted)] font-space mt-3">Supabase Auth session</div>
            <Link href="/" className="text-sm text-[var(--accent)] hover:text-[var(--text-strong)] mt-2 inline-block">← Back to site</Link>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Compact top bar below lg; the sidebar takes over from lg up. */}
          <div className="sticky top-0 z-40 flex h-[calc(64px+env(safe-area-inset-top))] items-center justify-between gap-3 border-b border-white/10 bg-[#06123A]/95 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
            <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2">
              <Image
                src="/images/logo-trim.png"
                alt="Galaxia i-Fest"
                width={1595}
                height={1131}
                sizes="40px"
                className="h-8 w-auto shrink-0 object-contain"
              />
              <span className="truncate font-sans font-semibold text-sm text-[var(--text-strong)]">Admin</span>
            </Link>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#F4EDE0] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            </SheetTrigger>
          </div>
          <div className="flex-1 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-6 lg:p-8">{children}</div>
        </div>
      </div>

      <SheetContent title="Admin menu">
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
            <Image
              src="/images/logo-trim.png"
              alt="Galaxia i-Fest"
              width={1595}
              height={1131}
              className="h-8 w-auto"
            />
            <span className="font-sans font-semibold text-sm text-[var(--text-strong)]">Admin</span>
          </Link>
          <SheetCloseButton />
        </div>
        <nav aria-label="Admin" className="flex flex-col border-t border-white/10 px-5">
          {nav.map((n) => {
            const Icon = n.icon
            const active = pathname === n.href
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 items-center gap-3 border-b border-white/10 py-2 text-base transition-colors ${active ? "text-[var(--text-strong)]" : "text-[var(--text-body)] hover:text-[var(--text-strong)]"}`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden /> {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto space-y-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-12 w-full items-center justify-center rounded-lg border border-white/15 text-sm text-[var(--accent)]"
          >
            ← Back to site
          </Link>
          <button
            onClick={async () => {
              setMenuOpen(false)
              await signOutAdmin()
              router.replace("/admin/login")
            }}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/15 text-sm text-[var(--text-body)]"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}