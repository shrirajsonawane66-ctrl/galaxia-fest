"use client"
import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Sparkles, Rocket, Play, Star, Users, Building2, Music4, Trophy, Ticket, Crown, Zap, ShieldCheck, ChevronDown, LogOut, User2 } from "lucide-react"
import GalaxyBackground from "@/components/GalaxyBackground"
import SolarSystem from "@/components/SolarSystem"
import AuthModal from "@/components/AuthModal"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { eventSeed, passesSeed, artistsSeed, scheduleSeed, faqsSeed, statsSeed } from "@/lib/data"
import { formatINR, genRef } from "@/lib/utils"
import { getUser, signOut, type GalaxiaUser } from "@/lib/userAuth"
import Link from "next/link"

function Counter({ to, suffix = "", duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const [val, setVal] = useState(0)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(m.matches)
  }, [])
  useEffect(() => {
    if (reduced) { setVal(to); return }
    if (!inView) return
    let start: number | null = null
    const step = (ts: number) => {
      if (start === null) start = ts
      const p = Math.min((ts - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * to))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, to, duration, reduced])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(m.matches)
    const onChange = () => setReduced(m.matches)
    m.addEventListener("change", onChange)
    return () => m.removeEventListener("change", onChange)
  }, [])
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [user, setUser] = useState<GalaxiaUser | null>(null)
  const [selectedPass, setSelectedPass] = useState<string>(passesSeed[1].id)
  const [qty, setQty] = useState(1)
  const [form, setForm] = useState({ name: "", email: "", phone: "", college: "", collegeId: "" })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [successRef, setSuccessRef] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 30)
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  useEffect(() => {
    setUser(getUser())
    const onAuth = () => setUser(getUser())
    window.addEventListener("galaxia-auth-change", onAuth)
    window.addEventListener("storage", onAuth)
    return () => { window.removeEventListener("galaxia-auth-change", onAuth); window.removeEventListener("storage", onAuth) }
  }, [])
  useEffect(() => {
    if (user && !form.email) setForm(f => ({ ...f, email: user.email, name: user.name || f.name }))
  }, [user])

  const activePass = passesSeed.find(p => p.id === selectedPass) || passesSeed[1]
  const remaining = (p: typeof passesSeed[0]) => p.capacity - p.sold_count
  const isSoldOut = (p: typeof passesSeed[0]) => remaining(p) <= 0 || !p.is_active
  const total = activePass.price * qty

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required"
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g,""))) e.phone = "Valid 10-digit phone required"
    if (!form.college.trim()) e.college = "College is required"
    if (qty < 1 || qty > 6) e.qty = "Qty 1–6 only"
    if (isSoldOut(activePass)) e.pass = "This pass is sold out"
    if (qty > remaining(activePass)) e.qty = `Only ${remaining(activePass)} left`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleBook = () => {
    if (!validate()) return
    // Mock razorpay success: generate ref, pretend verification
    const ref = genRef()
    // Store in localStorage for admin demo
    const booking = { ref, pass: activePass.name, qty, total, ...form, at: new Date().toISOString(), status: "paid" }
    const prev = JSON.parse(localStorage.getItem("galaxia_bookings") || "[]")
    localStorage.setItem("galaxia_bookings", JSON.stringify([booking, ...prev]))
    // also update sold count visually (mock)
    const idx = passesSeed.findIndex(p=>p.id===activePass.id)
    if (idx >=0) passesSeed[idx].sold_count += qty
    setSuccessRef(ref)
    setBookingOpen(false)
  }

  return (
    <main className="relative min-h-screen bg-[#050816] text-white overflow-hidden">
      <GalaxyBackground />
      <div className="noise fixed inset-0 z-[1]" />

      {/* NAV */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-6"}`}
      >
        <div className={`mx-auto max-w-7xl px-6 flex items-center justify-between transition-all ${scrolled ? "glass rounded-full py-2 px-4" : ""}`}>
          <a href="#" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 blur-md opacity-70 group-hover:opacity-100 transition" />
              <div className="relative w-9 h-9 rounded-full bg-[#050816] border border-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
            <span className="font-orbitron font-black tracking-wider text-lg" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}>G<span className="text-gradient-galaxy">ALAXIA</span></span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-space text-white/70">
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="#stats" className="hover:text-white transition">Stats</a>
            <a href="#artists" className="hover:text-white transition">Performers</a>
            <a href="#passes" className="hover:text-white transition">Passes</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="hidden lg:inline-flex text-xs font-space uppercase tracking-widest text-white/30 hover:text-white px-2">Admin</Link>
            {user ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-space text-white/60 max-w-[140px] truncate"><User2 className="w-3.5 h-3.5" />{user.email}</span>
                <Link href="/booking/success" className="hidden sm:inline-flex text-xs font-space text-cyan-300 hover:text-white">My Tickets</Link>
                <Button size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs" onClick={async () => { await signOut(); setUser(null) }}><LogOut className="w-3.5 h-3.5" /> Sign Out</Button>
                <Button size="sm" variant="galaxy" onClick={() => setBookingOpen(true)} className="hidden sm:inline-flex">
                  Get Passes <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" className="rounded-full h-8 px-4 text-xs hidden sm:inline-flex" onClick={() => { setAuthMode("signin"); setAuthOpen(true) }}>
                  Sign In
                </Button>
                <Button size="sm" variant="galaxy" className="rounded-full h-8 px-4 text-xs hidden sm:inline-flex" onClick={() => { setAuthMode("signup"); setAuthOpen(true) }}>
                  Sign Up
                </Button>
                {/* mobile: single sign in */}
                <Button size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs sm:hidden" onClick={() => { setAuthMode("signin"); setAuthOpen(true) }}>
                  Sign In
                </Button>
                <Button size="sm" variant="galaxy" onClick={() => setBookingOpen(true)}>
                  Get Passes <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="absolute inset-0 grid-lines opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full border border-white/[0.06]" />
          <div className="absolute w-[850px] h-[850px] md:w-[1200px] md:h-[1200px] rounded-full border border-white/[0.04]" />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500" />
            </span>
            <span className="text-xs font-space uppercase tracking-[0.35em] text-white/80">{eventSeed.date} · {eventSeed.venue}</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45 }} className="font-orbitron font-black uppercase leading-[0.9] tracking-tight" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.65), 0 0 48px rgba(139,92,246,0.25)" }}>
            <span className="block text-[15vw] md:text-[10vw] shimmer-text">{eventSeed.title}</span>
            <span className="block text-lg md:text-2xl mt-4 font-space font-light tracking-[0.5em] text-white/80" style={{ textShadow: "0 1px 16px rgba(0,0,0,0.7)" }}>{eventSeed.subtitle}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-8 max-w-2xl mx-auto text-white/60 text-base md:text-lg leading-relaxed">
            {eventSeed.description} <br />
            <span className="text-white/40 text-sm font-space">Presented by {eventSeed.college_name}</span>
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-[#050816] hover:bg-white/90 font-space font-semibold rounded-full shadow" onClick={() => setBookingOpen(true)}>
              <Rocket className="w-5 h-5 mr-1" /> Reserve My Pass <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => document.getElementById("artists")?.scrollIntoView({ behavior: "smooth" })}>
              <Play className="w-4 h-4 mr-2 fill-white" /> Watch Highlights
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[10px] font-space uppercase tracking-[0.5em] text-white/40">Scroll</span>
            <div className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-1.5">
              <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="w-1 h-2 rounded-full bg-white/70" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative z-10 py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <Reveal className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-gradient-to-r from-fuchsia-500 to-transparent" />
                <span className="text-xs font-space uppercase tracking-[0.4em] text-white/50">01 · About</span>
              </div>
              <h2 className="font-orbitron text-4xl md:text-6xl font-black leading-[1.05] mb-6">A festival <br /><span className="text-gradient-galaxy">{eventSeed.about_title.replace("A festival ","")}</span></h2>
            </Reveal>
            <Reveal delay={0.15} className="lg:col-span-7 space-y-6">
              <p className="text-lg md:text-xl text-white/70 leading-relaxed">{eventSeed.about_text1}</p>
              <p className="text-white/50 leading-relaxed">{eventSeed.about_text2}</p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="glass rounded-xl p-5">
                  <div className="text-xs font-space uppercase tracking-widest text-cyan-300 mb-2">Our Mission</div>
                  <div className="text-sm text-white/70 leading-relaxed">To orbit music, art & tech around a single stage of student energy.</div>
                </div>
                <div className="glass rounded-xl p-5">
                  <div className="text-xs font-space uppercase tracking-widest text-cyan-300 mb-2">Est. 2013</div>
                  <div className="text-sm text-white/70 leading-relaxed">12 editions strong. Built by students, powered by dreams.</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="relative z-10 py-24 md:py-32 px-6">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-96 radial-nebula opacity-60 blur-2xl -z-10" />
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-gradient-to-r from-cyan-400 to-transparent" />
              <span className="text-xs font-space uppercase tracking-[0.4em] text-white/50">02 · By The Numbers</span>
            </div>
            <h2 className="font-orbitron text-4xl md:text-6xl font-black leading-[1.05] mb-12 md:mb-16 max-w-3xl">A universe measured in <span className="text-gradient-galaxy">moments.</span></h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {statsSeed.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <div className="group relative glass rounded-2xl p-6 md:p-8 hover:border-fuchsia-400/40 transition-all overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-fuchsia-500/10 blur-2xl group-hover:bg-fuchsia-500/30 transition" />
                  {s.icon === "star" && <Star className="w-6 h-6 text-cyan-300 mb-6" />}
                  {s.icon === "users" && <Users className="w-6 h-6 text-cyan-300 mb-6" />}
                  {s.icon === "building" && <Building2 className="w-6 h-6 text-cyan-300 mb-6" />}
                  {s.icon === "music" && <Music4 className="w-6 h-6 text-cyan-300 mb-6" />}
                  {s.icon === "trophy" && <Trophy className="w-6 h-6 text-cyan-300 mb-6" />}
                  <div className="font-orbitron text-4xl md:text-5xl font-black text-gradient-galaxy leading-none">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-3 text-xs font-space uppercase tracking-[0.3em] text-white/50">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ARTISTS */}
      <section id="artists" className="relative z-10 py-24 md:py-32 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
              <span className="text-xs font-space uppercase tracking-[0.4em] text-white/50">03 · Cosmic Line-Up</span>
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            </div>
            <h2 className="font-orbitron text-4xl md:text-6xl font-black leading-[1.05] mb-4">Every artist is a <span className="text-gradient-galaxy">record.</span></h2>
            <p className="text-white/60 max-w-xl mx-auto">Six vinyl worlds orbit the Galaxia sun. Tap any record to meet the artist behind it.</p>
          </Reveal>
          <SolarSystem artists={artistsSeed as any} />
        </div>
      </section>

      {/* PASSES */}
      <section id="passes" className="relative z-10 py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent" />
              <span className="text-xs font-space uppercase tracking-[0.4em] text-white/50">04 · Passes</span>
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            </div>
            <h2 className="font-orbitron text-4xl md:text-6xl font-black leading-[1.05]">Choose your <span className="text-gradient-galaxy">orbit.</span></h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto">Three tiers. Same cosmos. Different proximity to the star. Gold feels premium — Silver is a clear step up — Regular still looks stellar.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {passesSeed.map((p, i) => {
              const rem = remaining(p)
              const soldOut = isSoldOut(p)
              const isGold = p.id === "gold"
              const isSilver = p.id === "silver"
              return (
                <Reveal key={p.id} delay={i * 0.1} className="h-full">
                  <div className={`relative flex flex-col h-full rounded-3xl overflow-hidden border transition-all duration-500 ${isGold ? "border-amber-400/30 bg-gradient-to-b from-amber-500/10 via-fuchsia-500/10 to-purple-600/10 shadow-[0_0_60px_rgba(245,158,11,0.2)] md:scale-[1.04] md:-mt-2" : isSilver ? "border-cyan-400/20 bg-white/[0.04]" : "border-white/10 bg-white/[0.03]"} glass hover:border-white/20`}>
                    {isGold && <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />}
                    {isSilver && <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-60" />}
                    <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20" style={{ background: p.accent }} />

                    <div className="relative p-8 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isGold ? "bg-amber-400/20 border-amber-400/30" : isSilver ? "bg-cyan-400/15 border-cyan-400/20" : "bg-white/10 border-white/10"}`}>
                          {isGold ? <Crown className="w-5 h-5 text-amber-300" /> : isSilver ? <Zap className="w-5 h-5 text-cyan-300" /> : <Ticket className="w-5 h-5 text-white/70" />}
                        </div>
                        {isGold && <span className="text-[10px] font-space uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 text-white font-bold">Most Premium</span>}
                        {isSilver && <span className="text-[10px] font-space uppercase tracking-[0.3em] px-3 py-1 rounded-full glass text-cyan-300">Most Popular</span>}
                      </div>

                      <div className="text-xs font-space uppercase tracking-[0.3em] text-white/50 mb-1">{p.description}</div>
                      <h3 className="font-orbitron font-black text-2xl mb-1">{p.name}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`font-orbitron font-black text-3xl ${isGold ? "text-amber-300" : isSilver ? "text-cyan-300" : "text-white"}`}>{formatINR(p.price)}</span>
                        <span className="text-xs text-white/40 font-space">/ 3 days</span>
                      </div>
                      <div className="text-xs font-space text-white/40 mb-6">{rem} left • {p.capacity} total {soldOut && <span className="text-red-400">• SOLD OUT</span>}</div>

                      <ul className="space-y-2.5 mb-8 flex-1">
                        {p.benefits.map(b => (
                          <li key={b} className="flex items-start gap-2.5 text-sm text-white/70">
                            <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${isGold ? "text-amber-300" : isSilver ? "text-cyan-300" : "text-white/50"}`} />
                            {b}
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={isGold ? "default" : isSilver ? "galaxy" : "outline"}
                        className={`w-full rounded-full font-space font-semibold ${isGold ? "bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-amber-300 hover:to-fuchsia-400 text-white border-0 shadow-[0_0_30px_rgba(245,158,11,0.3)]" : ""}`}
                        disabled={soldOut}
                        onClick={() => { setSelectedPass(p.id); setQty(1); setBookingOpen(true) }}
                      >
                        {soldOut ? "Sold Out" : "Book Now"} {!soldOut && <ArrowRight className="w-4 h-4" />}
                      </Button>

                      {!soldOut && <div className="mt-3 text-[10px] text-center font-space uppercase tracking-widest text-white/30">{p.id === "regular" ? "Back rows" : p.id === "silver" ? "Middle rows" : "Front rows"}</div>}
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>

          <div className="text-center mt-8 text-xs font-space text-white/30">Prices editable in Admin → Passes. Existing bookings keep their paid price.</div>
        </div>
      </section>

      {/* SCHEDULE */}
      <section id="schedule" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <span className="text-xs font-space uppercase tracking-[0.4em] text-white/50">05 · Schedule</span>
            <h2 className="font-orbitron text-3xl md:text-5xl font-black mt-3">Three nights <span className="text-gradient-galaxy">live.</span></h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-4">
            {scheduleSeed.map((s, i) => (
              <Reveal key={s.id} delay={i*0.08}>
                <div className="glass rounded-2xl p-6 flex gap-4 hover:border-white/20 transition">
                  <div className="text-xs font-space uppercase tracking-widest text-cyan-300 whitespace-nowrap pt-1">{s.time}</div>
                  <div className="h-10 w-px bg-white/10 hidden sm:block" />
                  <div>
                    <div className="font-orbitron font-bold">{s.title}</div>
                    <div className="text-sm text-white/60">{s.description}</div>
                    <div className="text-xs text-white/40 mt-1 font-space">{s.venue}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <span className="text-xs font-space uppercase tracking-[0.4em] text-white/50">06 · FAQ</span>
            <h2 className="font-orbitron text-3xl md:text-5xl font-black mt-3">Got <span className="text-gradient-galaxy">questions?</span></h2>
          </Reveal>
          <div className="space-y-3">
            {faqsSeed.map(f => (
              <div key={f.id} className="glass rounded-2xl overflow-hidden border border-white/10">
                <button onClick={() => setOpenFaq(openFaq===f.id ? null : f.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.04] transition">
                  <span className="font-space font-medium text-white pr-6">{f.question}</span>
                  <ChevronDown className={`w-5 h-5 text-white/50 shrink-0 transition ${openFaq===f.id ? "rotate-180" : ""}`} />
                </button>
                {openFaq===f.id && <div className="px-5 pb-5 text-sm text-white/60 leading-relaxed border-t border-white/5 pt-4">{f.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="register" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 p-10 md:p-16 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 via-purple-500/10 to-cyan-500/20" />
              <div className="absolute inset-0 radial-nebula opacity-70" />
              <div className="relative">
                <div className="text-xs font-space uppercase tracking-[0.5em] text-cyan-300 mb-4">Countdown Initiated</div>
                <h3 className="font-orbitron text-4xl md:text-6xl font-black leading-tight mb-6">Your seat on the <span className="text-gradient-galaxy">starship</span> awaits.</h3>
                <p className="max-w-xl mx-auto text-white/60 mb-8">Early orbit passes are limited. Reserve yours before the launch window closes. Hosted by {eventSeed.college_name}.</p>
                <Button size="lg" className="bg-white text-[#050816] hover:bg-white/90 font-space font-semibold rounded-full h-14 px-10 text-base" onClick={() => setBookingOpen(true)}>
                  <Rocket className="w-5 h-5 mr-2" /> Reserve My Pass
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="relative z-10 py-10 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-space uppercase tracking-widest text-white/40">
          <div>© 2025 Galaxia · {eventSeed.college_name} · Built among the stars</div>
          <div className="flex items-center gap-6">
            <a href={eventSeed.instagram_url} className="hover:text-white transition">Instagram</a>
            <a href={eventSeed.youtube_url} className="hover:text-white transition">YouTube</a>
            <a href={eventSeed.x_url} className="hover:text-white transition">X</a>
            <Link href="/admin" className="hover:text-white">Admin</Link>
          </div>
        </div>
      </footer>

      {/* BOOKING DIALOG */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-orbitron">Reserve your pass</DialogTitle>
            <div className="text-xs font-space text-white/50">Select tier → quantity → details → pay (test-mode Razorpay). RLS enforced server-side.</div>
          </DialogHeader>

          {/* Tier select */}
          <div className="grid grid-cols-3 gap-2 py-2">
            {passesSeed.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPass(p.id)}
                className={`rounded-2xl p-3 text-left border transition ${selectedPass===p.id ? "bg-white text-[#050816] border-white" : "glass border-white/10 hover:border-white/20 text-white"}`}
              >
                <div className="text-xs font-space uppercase tracking-widest opacity-60">{p.name}</div>
                <div className="font-orbitron font-black text-sm">{formatINR(p.price)}</div>
                <div className="text-[10px] opacity-60">{remaining(p)} left</div>
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3 py-2">
            <span className="text-sm font-space text-white/70">Quantity (1–6)</span>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</Button>
              <span className="w-8 text-center font-orbitron font-bold">{qty}</span>
              <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={()=>setQty(q=>Math.min(6,q+1))}>+</Button>
            </div>
            {errors.qty && <span className="text-xs text-red-400 ml-2">{errors.qty}</span>}
          </div>

          {/* Form */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <input placeholder="Full name *" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/50" />
              {errors.name && <div className="text-xs text-red-400 mt-1">{errors.name}</div>}
            </div>
            <div>
              <input placeholder="Email *" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/50" />
              {errors.email && <div className="text-xs text-red-400 mt-1">{errors.email}</div>}
            </div>
            <div>
              <input placeholder="Phone (10 digits) *" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/50" />
              {errors.phone && <div className="text-xs text-red-400 mt-1">{errors.phone}</div>}
            </div>
            <div>
              <input placeholder="College / Institution *" value={form.college} onChange={e=>setForm({...form, college:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/50" />
              {errors.college && <div className="text-xs text-red-400 mt-1">{errors.college}</div>}
            </div>
            <div className="sm:col-span-2">
              <input placeholder="College ID / Student ID (optional)" value={form.collegeId} onChange={e=>setForm({...form, collegeId:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/50" />
            </div>
          </div>

          {/* Summary */}
          <div className="glass rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-white/60">{activePass.name} × {qty}</span><span className="font-medium">{formatINR(activePass.price)} each</span></div>
            <div className="flex justify-between text-sm font-orbitron font-black text-lg border-t border-white/10 pt-2"><span>Total</span><span className="text-cyan-300">{formatINR(total)}</span></div>
            <div className="text-[11px] font-space text-white/40">Price fetched server-side — test Razorpay order will verify amount. Inventory checked atomically.</div>
            {errors.pass && <div className="text-xs text-red-400">{errors.pass}</div>}
          </div>

          <Button variant="galaxy" size="lg" className="w-full rounded-full h-12" onClick={handleBook}>
            <Ticket className="w-4 h-4" /> Pay {formatINR(total)} — Razorpay Test
          </Button>
          <div className="text-[11px] text-center font-space text-white/30">Use Razorpay test card 4111 1111 1111 1111. No real money charged. On success you’ll get GAL-XXXXXX reference + QR at /booking/success.</div>
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initial={authMode} onSuccess={() => setUser(getUser())} />

      {/* SUCCESS */}
      <Dialog open={!!successRef} onOpenChange={(o)=>!o && setSuccessRef(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center mb-2">
            <Ticket className="w-7 h-7 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="font-orbitron text-center text-xl">Booking Confirmed!</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="glass rounded-xl p-4">
              <div className="text-xs font-space uppercase tracking-widest text-white/50">Booking Reference</div>
              <div className="font-mono font-bold text-lg tracking-[0.2em] text-cyan-300">{successRef}</div>
              <div className="text-xs text-white/40 mt-1">{activePass.name} × {qty} • {formatINR(total)} paid</div>
            </div>
            <div className="text-xs text-white/50">Attendee: {form.name} • {form.email}</div>
            <div className="text-xs text-white/40">Venue: {eventSeed.venue} • {eventSeed.date}</div>
            <div className="flex gap-2 justify-center pt-2">
              <Button size="sm" className="rounded-full bg-white text-[#050816]" onClick={()=>{ setSuccessRef(null); window.location.href="/booking/success?ref="+successRef }}>View Ticket & QR</Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={()=>setSuccessRef(null)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
