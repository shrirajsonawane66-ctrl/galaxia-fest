"use client"
import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { signIn, signUp } from "@/lib/userAuth"
import { ArrowRight, Mail, Lock, User } from "lucide-react"

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
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed")
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="h-1 bg-[#E5121F]" />
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl font-bold text-[var(--text-strong)]">
              <Image
                src="/images/logo-trim.png"
                alt="Galaxia i-Fest"
                width={1595}
                height={1131}
                sizes="40px"
                className="h-10 w-auto shrink-0 object-contain"
              />
              <span>{mode === "signin" ? "Welcome back" : "Create account"}</span>
            </DialogTitle>
            <p className="type-small">Galaxia • Western College of Business Management</p>
          </DialogHeader>

          <div className="my-4 flex w-fit gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <button onClick={() => setMode("signin")} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] ${mode === "signin" ? "bg-[#F4EDE0] text-[#050816]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"}`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] ${mode === "signup" ? "bg-[#F4EDE0] text-[#050816]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"}`}>Sign up</button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input placeholder="Full name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="w-full min-h-12 rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] sm:min-h-0" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="email" required placeholder="Email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e => setEmail(e.target.value)} className="w-full min-h-12 rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] sm:min-h-0" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="password" required minLength={6} placeholder="Password (min 6)" name="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full min-h-12 rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] sm:min-h-0" />
            </div>
            {err && <div className="rounded-lg border border-[#FF3B4B]/20 bg-[#FF3B4B]/10 px-3 py-2 text-[13px] text-[var(--accent)]">{err}</div>}
            <Button type="submit" disabled={loading} variant="galaxy" className="h-11 w-full rounded-lg">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="text-center text-[13px] text-[var(--text-muted)]">
              {mode === "signin" ? "Demo: any email/pass works after you sign up. Local storage auth." : "Password stored locally for demo."}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
