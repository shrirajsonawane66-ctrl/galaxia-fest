"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { signIn, signUp } from "@/lib/userAuth"
import { Sparkles, ArrowRight, Mail, Lock, User } from "lucide-react"

export default function AuthModal({ open, onOpenChange, initial = "signin" as "signin" | "signup", onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: "signin" | "signup"; onSuccess?: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">(initial)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    setLoading(true)
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Name required")
        await signUp(email.trim(), password, name.trim())
      } else {
        await signIn(email.trim(), password)
      }
      onOpenChange(false)
      onSuccess?.()
      setName(""); setEmail(""); setPassword("")
    } catch (e: any) {
      setErr(e.message || "Failed")
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400" />
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="font-orbitron flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></span>
              {mode === "signin" ? "Welcome back" : "Create account"}
            </DialogTitle>
            <p className="text-xs font-space text-white/50">Galaxia • Western College of Business Management</p>
          </DialogHeader>

          <div className="flex gap-2 my-4 p-1 rounded-full bg-white/5 border border-white/10 w-fit">
            <button onClick={() => setMode("signin")} className={`px-4 py-1.5 rounded-full text-xs font-space font-semibold transition ${mode === "signin" ? "bg-white text-[#050816]" : "text-white/60 hover:text-white"}`}>Sign In</button>
            <button onClick={() => setMode("signup")} className={`px-4 py-1.5 rounded-full text-xs font-space font-semibold transition ${mode === "signup" ? "bg-white text-[#050816]" : "text-white/60 hover:text-white"}`}>Sign Up</button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/50" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/50" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="password" required placeholder="Password (min 6)" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/50" />
            </div>
            {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{err}</div>}
            <Button type="submit" disabled={loading} variant="galaxy" className="w-full rounded-full h-11">
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="text-[11px] text-center font-space text-white/30">
              {mode === "signin" ? "Demo: any email/pass works after you sign up. Supabase Auth when configured." : "Password stored locally for demo — use Supabase in production."}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
