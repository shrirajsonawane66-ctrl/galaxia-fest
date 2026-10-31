"use client"
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { ArrowRight, Rocket, Play, Star, Users, Building2, Music4, Trophy, Ticket, Crown, Zap, ShieldCheck, ChevronDown } from "lucide-react"
import SiteNav from "@/components/site-nav"
import { PerformersCurvedSection } from "@/components/performers/performers-curved-section"
import { Button } from "@/components/ui/button"
import { SectionTitle } from "@/components/ui/section-title"
import { eventSeed, passesSeed, scheduleSeed, faqsSeed, statsSeed } from "@/lib/data"
import type { Performer } from "@/lib/performers"
import { siteConfig } from "@/lib/site-config"
import { formatINR } from "@/lib/utils"
import Link from "next/link"

const BookingDialog = dynamic(() => import("@/components/booking-dialog"), {
  ssr: false,
})

// Pin the locale so the server and browser format the same digits.
const numberFormatter = new Intl.NumberFormat("en-IN")

const remaining = (p: (typeof passesSeed)[number]) => p.capacity - p.sold_count
const isSoldOut = (p: (typeof passesSeed)[number]) =>
  remaining(p) <= 0 || !p.is_active

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"

function Counter({ to, suffix = "", duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [inView, setInView] = useState(false)
  const [val, setVal] = useState(0)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(m.matches)
  }, [])
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setInView(true)
        observer.disconnect()
      },
      { rootMargin: "-80px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
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
  return <span ref={ref}>{numberFormatter.format(val)}{suffix}</span>
}

/**
 * Scroll reveal without framer-motion: an IntersectionObserver toggles two
 * utility classes, so the animation is CSS-only and costs no client bundle.
 * Falls back to "already visible" when IntersectionObserver is unavailable.
 */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      { rootMargin: "-60px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export default function HomePage({ performers }: { performers: Performer[] }) {
  // The booking + success dialogs (and their Radix/framer-motion code) are only
  // downloaded the first time a visitor opens the booking flow.
  const [bookingMounted, setBookingMounted] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedPass, setSelectedPass] = useState<string>(passesSeed[1].id)
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const openBooking = (passId?: string) => {
    if (passId) setSelectedPass(passId)
    setBookingMounted(true)
    setBookingOpen(true)
  }

  return (
    <main className="relative min-h-[100svh] overflow-x-clip text-[var(--text-body)]">
      <SiteNav onGetPasses={() => openBooking()} />
      <div className="noise fixed inset-0 z-[1]" />

      {/* HERO */}
      <section className="hero-compact relative z-10 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-[calc(64px+env(safe-area-inset-top)+24px)] sm:px-6 md:min-h-screen md:flex-row md:px-10 md:pb-28 md:pt-32">
        {/* Feathered centre darkening: keeps the navy/periwinkle edges intact while
            giving the cream-and-red logo a calmer field to sit against. */}
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(ellipse_58%_48%_at_50%_45%,rgba(2,6,20,0.18)_0%,rgba(2,6,20,0.10)_45%,rgba(2,6,20,0.03)_68%,transparent_82%)]" />
        <div className="hero-compact-stack relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center md:gap-0">
          <p
            className="hero-reveal type-small mx-auto max-w-[30ch] text-[13px] leading-snug tracking-[0.08em] text-[var(--text-body)] md:text-sm"
            style={{ animationDelay: "0.25s" }}
          >
            {siteConfig.tagline}
          </p>

          <div
            className="hero-logo-reveal w-full md:mt-2"
          >
            <div className="hero-compact-logo mx-auto w-[min(80vw,420px)] sm:w-[42vw] sm:max-w-[320px] lg:w-[36vw] lg:max-w-[380px]">
              <h1 className="w-full">
                <picture className="block w-full">
                  <source
                    type="image/avif"
                    srcSet="/brand/galaxia-logo-480.avif 480w, /brand/galaxia-logo-640.avif 640w, /brand/galaxia-logo-760.avif 760w, /brand/galaxia-logo-1140.avif 1140w"
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 42vw, 80vw"
                  />
                  <source
                    type="image/webp"
                    srcSet="/brand/galaxia-logo-480.webp 480w, /brand/galaxia-logo-640.webp 640w, /brand/galaxia-logo-760.webp 760w, /brand/galaxia-logo-1140.webp 1140w"
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 42vw, 80vw"
                  />
                  <img
                    src="/brand/galaxia-logo.png"
                    alt="Galaxia i-Fest"
                    width={1600}
                    height={1136}
                    fetchPriority="high"
                    decoding="sync"
                    className="h-auto w-full"
                  />
                </picture>
              </h1>
            </div>
          </div>

          <p
            className="hero-compact-lead hero-lead hero-reveal type-lead mx-auto max-w-[34ch] sm:max-w-[40rem] md:mt-2"
            style={{ animationDelay: "0.6s" }}
          >
            {siteConfig.description}
          </p>

          <p
            className="hero-reveal type-small md:mt-3"
            style={{ animationDelay: "0.75s" }}
          >
            {siteConfig.presentedBy}
          </p>

          <div
            className="hero-reveal flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row md:mt-8"
            style={{ animationDelay: "0.85s" }}
          >
            <Button
              size="lg"
              className={cnButton("w-full max-w-xs bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:w-auto sm:max-w-none")}
              onClick={() => openBooking()}
            >
              <Rocket className="h-5 w-5" /> Reserve my pass <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={cnButton("w-full max-w-xs border border-[#F4EDE0]/40 bg-transparent text-[#F4EDE0] hover:bg-white/10 sm:w-auto sm:max-w-none")}
              onClick={() => document.getElementById("performers")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Play className="h-4 w-4 fill-current" /> Enter the core
            </Button>
          </div>

          <div className="absolute -bottom-16 left-1/2 hidden -translate-x-1/2 sm:block">
            <div
              className="hero-reveal flex flex-col items-center gap-2 opacity-70"
              style={{ animationDelay: "1.1s" }}
            >
              <div className="flex h-9 w-5 items-start justify-center rounded-full border border-[#F4EDE0]/25 p-1.5">
                <div className="h-1.5 w-1 rounded-full bg-[#F4EDE0]/70" />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ABOUT */}
      <section id="about" className="relative z-10 px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <SectionTitle
                cream="A festival"
                red={eventSeed.about_title.replace("A festival ", "")}
                className="max-w-4xl"
              />
            </Reveal>
            <Reveal delay={0.15} className="space-y-6 lg:col-span-7">
              <p className="type-lead">{eventSeed.about_text1}</p>
              <p className="type-body">{eventSeed.about_text2}</p>
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <div className="type-small mb-2 text-[var(--text-strong)]">Our mission</div>
                  <div className="text-base leading-relaxed text-[var(--text-body)] md:text-[15px]">To orbit music, art & tech around a single stage of student energy.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <div className="type-small mb-2 text-[var(--text-strong)]">Est. 2013</div>
                  <div className="text-base leading-relaxed text-[var(--text-body)] md:text-[15px]">12 editions strong. Built by students, powered by dreams.</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="relative z-10 px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-7xl">
          <SectionTitle cream="A universe measured in" red="moments." className="max-w-4xl" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:mt-16 md:grid-cols-3 md:gap-6 xl:grid-cols-5">
            {statsSeed.map((s, index) => (
              <div
                key={s.label}
                className={`flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-white/25 sm:p-6 md:p-8 ${
                  index === statsSeed.length - 1 ? "col-span-2 md:col-span-1" : ""
                }`}
              >
                {s.icon === "star" && <Star className="mb-4 h-6 w-6 text-[var(--accent)] sm:mb-6" />}
                {s.icon === "users" && <Users className="mb-4 h-6 w-6 text-[var(--accent)] sm:mb-6" />}
                {s.icon === "building" && <Building2 className="mb-4 h-6 w-6 text-[var(--accent)] sm:mb-6" />}
                {s.icon === "music" && <Music4 className="mb-4 h-6 w-6 text-[var(--accent)] sm:mb-6" />}
                {s.icon === "trophy" && <Trophy className="mb-4 h-6 w-6 text-[var(--accent)] sm:mb-6" />}
                <div className="type-stat">
                  <Counter to={s.value} />
                  <span className="text-[var(--accent)]">{s.suffix}</span>
                </div>
                <div className="type-small mt-3">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAST PERFORMERS */}
      <PerformersCurvedSection performers={performers} className="z-10" />

      {/* PASSES */}
      <section id="passes" className="relative z-10 px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-7xl">
          <SectionTitle cream="Choose your" red="orbit." className="max-w-4xl" />
          <p className="type-lead mt-4">Three tiers. Same cosmos. Different proximity to the star. Gold feels premium — Silver is a clear step up — Regular still looks stellar.</p>

          <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:mt-12 sm:gap-6 md:mt-16 md:grid-cols-3 md:gap-8">
            {passesSeed.map((p) => {
              const rem = remaining(p)
              const soldOut = isSoldOut(p)
              const isGold = p.id === "gold"
              const isSilver = p.id === "silver"
              return (
                <Reveal key={p.id} className="h-full">
                  <div className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white/[0.04] p-5 transition-colors hover:border-white/25 sm:p-6 md:p-8 ${isGold ? "border-white/20" : "border-white/10"}`}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                        {isGold ? <Crown className="h-5 w-5 text-[var(--accent)]" /> : isSilver ? <Zap className="h-5 w-5 text-[var(--accent)]" /> : <Ticket className="h-5 w-5 text-[var(--text-muted)]" />}
                      </div>
                      {isGold && <span className="rounded-full bg-[#E5121F] px-3 py-1 text-[13px] font-medium text-white">Most premium</span>}
                      {isSilver && <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[13px] font-medium text-[var(--text-strong)]">Most popular</span>}
                    </div>

                    <div className="type-small mb-1">{p.description}</div>
                    <h3 className="type-h3 mb-1">{p.name}</h3>
                    <div className="mb-2 flex flex-wrap items-baseline gap-2">
                      <span className="type-stat">{formatINR(p.price)}</span>
                      <span className="type-small">/ 3 days</span>
                    </div>
                    <div className="type-small mb-6">
                      {rem} left • {p.capacity} total {soldOut && <span className="text-[var(--accent)]">• Sold out</span>}
                    </div>

                    <ul className="mb-8 flex-1 space-y-2.5">
                      {p.benefits.map(b => (
                        <li key={b} className="flex items-start gap-2.5 text-base leading-relaxed text-[var(--text-body)] md:text-[15px]">
                          <ShieldCheck className={`mt-0.5 h-4 w-4 shrink-0 ${isGold || isSilver ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                          {b}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={isGold || isSilver ? "galaxy" : "outline"}
                      className="h-11 w-full rounded-full md:h-10"
                      disabled={soldOut}
                      onClick={() => openBooking(p.id)}
                    >
                      {soldOut ? "Sold out" : "Book now"} {!soldOut && <ArrowRight className="h-4 w-4" />}
                    </Button>

                    {!soldOut && <div className="type-small mt-3 text-center">{p.id === "regular" ? "Back rows" : p.id === "silver" ? "Middle rows" : "Front rows"}</div>}
                  </div>
                </Reveal>
              )
            })}
          </div>

          <div className="type-small mt-8 text-center">Prices editable in Admin → Passes. Existing bookings keep their paid price.</div>
        </div>
      </section>

      {/* SCHEDULE */}
      <section id="schedule" className="relative z-10 px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-5xl">
          <SectionTitle cream="Three nights" red="live." className="max-w-4xl" />
          <div className="mt-10 grid gap-4 sm:mt-12 md:mt-16 md:grid-cols-2">
            {scheduleSeed.map((s) => (
              <Reveal key={s.id}>
                <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/25 sm:flex-row sm:gap-4 sm:p-6">
                  <div className="type-small whitespace-nowrap text-[var(--accent)] sm:pt-1">{s.time}</div>
                  <div className="hidden h-10 w-px bg-white/10 sm:block" />
                  <div>
                    <div className="type-h3">{s.title}</div>
                    <div className="type-body mt-1 sm:text-[15px]">{s.description}</div>
                    <div className="type-small mt-1">{s.venue}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <SectionTitle cream="Got" red="questions?" className="max-w-4xl" />
          <div className="mt-10 space-y-3 sm:mt-12 md:mt-16">
            {faqsSeed.map(f => (
              <div key={f.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <button
                  onClick={() => setOpenFaq(openFaq===f.id ? null : f.id)}
                  aria-expanded={openFaq===f.id}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-white/[0.03] ${focusRing}`}
                >
                  <span className="pr-6 font-sans text-base font-medium text-[var(--text-strong)]">{f.question}</span>
                  <span className="-mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full md:mr-0 md:h-5 md:w-5">
                    <ChevronDown className={`h-5 w-5 text-[var(--text-muted)] transition-transform ${openFaq===f.id ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {openFaq===f.id && <div className="type-body border-t border-white/10 px-5 pb-5 pt-4 text-base sm:text-[15px]">{f.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="register" className="relative z-10 px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-10 md:p-16">
              <SectionTitle cream="Your seat on the" red="starship awaits." className="max-w-4xl" />
              <p className="type-lead mt-4">Early orbit passes are limited. Reserve yours before the launch window closes. Hosted by {eventSeed.college_name}.</p>
              <Button size="lg" className="mt-8 w-full rounded-full bg-[#E5121F] px-7 text-white hover:bg-[#FF1F2D] sm:w-auto" onClick={() => openBooking()}>
                <Rocket className="h-5 w-5" /> Reserve my pass
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-10 sm:px-6 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 md:flex-row md:gap-4">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-trim-128.png"
              srcSet="/images/logo-trim-128.png 1x, /images/logo-trim-192.png 2x"
              alt="Galaxia i-Fest"
              width={320}
              height={227}
              loading="lazy"
              decoding="async"
              className="h-10 w-auto shrink-0 object-contain"
            />
            <span className="type-small">© 2025 Galaxia · {eventSeed.college_name} · Built among the stars</span>
          </div>
          <nav aria-label="Social" className="flex flex-wrap items-center justify-center gap-2 sm:gap-6">
            <a href={eventSeed.instagram_url} className="type-small inline-flex min-h-11 min-w-11 items-center justify-center px-2 transition-colors hover:text-[var(--text-strong)] sm:min-h-0 sm:min-w-0 sm:px-0">Instagram</a>
            <a href={eventSeed.youtube_url} className="type-small inline-flex min-h-11 min-w-11 items-center justify-center px-2 transition-colors hover:text-[var(--text-strong)] sm:min-h-0 sm:min-w-0 sm:px-0">YouTube</a>
            <a href={eventSeed.x_url} className="type-small inline-flex min-h-11 min-w-11 items-center justify-center px-2 transition-colors hover:text-[var(--text-strong)] sm:min-h-0 sm:min-w-0 sm:px-0">X</a>
            <Link href="/admin" prefetch={false} className="type-small inline-flex min-h-11 min-w-11 items-center justify-center px-2 transition-colors hover:text-[var(--text-strong)] sm:min-h-0 sm:min-w-0 sm:px-0">Admin</Link>
          </nav>
        </div>
      </footer>

      {bookingMounted && (
        <BookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          initialPass={selectedPass}
          onSelectPass={setSelectedPass}
        />
      )}
    </main>
  )
}

/* Small helper so the hero buttons share the same focus treatment. */
function cnButton(className: string) {
  return `rounded-full ${focusRing} ${className}`
}
