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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="noise fixed inset-0 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span className="text-xs font-space uppercase tracking-[0.3em]">Galaxia Admin</span>
          </div>
          <h1 className="font-orbitron font-black text-3xl">Organizer <span className="text-gradient-galaxy">Login</span></h1>
          <p className="text-white/50 text-sm mt-2 font-space">Manage passes, prices, artists, bookings</p>
        </div>
        <form onSubmit={submit} className="glass rounded-3xl p-8 space-y-4 border border-white/10">
          <div>
            <label className="text-xs font-space uppercase tracking-widest text-white/50">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-fuchsia-400/50"
              placeholder="admin@galaxia.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-space uppercase tracking-widest text-white/50">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-fuchsia-400/50"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <Button type="submit" variant="galaxy" className="w-full rounded-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
          <p className="text-[11px] text-white/30 font-space text-center">
            Supabase Auth — email/password required
          </p>
        </form>
        <div className="text-center mt-4">
          <a href="/" className="text-xs text-white/40 hover:text-white">← Back to Galaxia site</a>
        </div>
      </div>
    </div>
  )
}