"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loginAdmin } from "@/lib/adminAuth"

export default function AdminLogin() {
  const [user, setUser] = useState("admin")
  const [pass, setPass] = useState("galaxia123")
  const [err, setErr] = useState("")
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginAdmin(user, pass)) router.replace("/admin/dashboard")
    else setErr("Invalid credentials. Try admin / galaxia123")
  }

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-6">
      <div className="noise fixed inset-0 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4"><Sparkles className="w-4 h-4 text-cyan-300" /> <span className="text-xs font-space uppercase tracking-[0.3em]">Galaxia Admin</span></div>
          <h1 className="font-orbitron font-black text-3xl">Organizer <span className="text-gradient-galaxy">Login</span></h1>
          <p className="text-white/50 text-sm mt-2 font-space">Manage passes, prices, artists, bookings</p>
        </div>
        <form onSubmit={submit} className="glass rounded-3xl p-8 space-y-4 border border-white/10">
          <div>
            <label className="text-xs font-space uppercase tracking-widest text-white/50">Username</label>
            <input value={user} onChange={e=>setUser(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-fuchsia-400/50" placeholder="admin" />
          </div>
          <div>
            <label className="text-xs font-space uppercase tracking-widest text-white/50">Password</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-fuchsia-400/50" placeholder="galaxia123" />
          </div>
          {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{err}</div>}
          <Button type="submit" variant="galaxy" className="w-full rounded-full h-11">Login <ArrowRight className="w-4 h-4" /></Button>
          <div className="text-[11px] text-white/30 font-space text-center">Supabase Auth in production — demo uses local check. RLS protects mutations server-side.</div>
        </form>
        <div className="text-center mt-4"><a href="/" className="text-xs text-white/40 hover:text-white">← Back to Galaxia site</a></div>
      </div>
    </div>
  )
}
