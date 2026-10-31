"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signInAdmin } from "@/lib/adminAuth"

export const dynamic = "force-dynamic"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signInAdmin(email, password)
      router.replace("/admin/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      // Generic error message to avoid email enumeration
      setError(message.includes("Admin profile") || message.includes("Insufficient permissions")
        ? "Invalid credentials"
        : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] flex items-center justify-center p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
      <div className="noise fixed inset-0 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <span className="type-small text-[var(--text-strong)]">Galaxia admin</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">Organizer login</h1>
          <p className="type-small mt-2">Manage passes, prices, artists, bookings</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
          <div>
            <label className="text-sm font-space text-[var(--text-muted)]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] sm:min-h-0"
              placeholder="admin@galaxia.com"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="text-sm font-space text-[var(--text-muted)]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] sm:min-h-0"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[#FF3B4B]/20 bg-[#FF3B4B]/10 px-3 py-2 text-[13px] text-[var(--accent)]">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <Button type="submit" variant="galaxy" className="h-11 w-full rounded-lg font-ui tracking-normal" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>Sign in <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
          <p className="text-center text-[13px] text-[var(--text-muted)]">
            Supabase Auth — email/password required
          </p>
        </form>
        <div className="mt-4 text-center">
          <a href="/" className="inline-flex min-h-11 items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-strong)] sm:min-h-0">← Back to Galaxia site</a>
        </div>
      </div>
    </div>
  )
}