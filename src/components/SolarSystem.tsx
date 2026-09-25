"use client"
import { useState, useEffect, memo, useRef } from "react"
import { Disc3, Star, Ticket, Music4, Headphones } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type Artist = {
  id: string
  name: string
  genre: string
  role: string
  year: string
  bio: string
  image_url: string
  display_order: number
  size: number
  orbit: number
  duration: number
  startAngle: number
  spin: number
  label: string
  glow: string
  accent: string
}

/**
 * PlanetCD — spinning vinyl/CD
 * Layers (center → edge):
 *  - glow (blur, outside, not spinning)
 *  - disc (rounded-full overflow-hidden, spinning via cd-spin)
 *    - base vinyl (#0a0a0a)
 *    - grooves (repeating-radial-gradient, low opacity)
 *    - photo label (inset 32%, rounded-full overflow-hidden, vinyl-label look)
 *    - center hole (10% diameter, metallic)
 *    - sheen (conic-gradient streak, mix-blend overlay)
 *
 * BUG FIX: previous version used `contain: layout paint` on outer wrapper and
 * `mask-image: radial-gradient` on conic span. `contain: paint` clips the planet
 * at the orbit-pivot bounds → half-circle/wedge. `mask-image` with radial was also
 * unnecessary. Fixed by:
 *  - removing `contain: paint` (keep `contain: layout` only)
 *  - ensuring `border-radius:50%` + `overflow:hidden` on SAME element as the disc
 *  - using only `border-radius` + `overflow:hidden` for circular clipping, no clip-path/mask
 */
const PlanetCD = memo(function PlanetCD({ artist, size, spinning = true }: { artist: Artist; size: number; spinning?: boolean }) {
  return (
    <div
      className="planet-cd"
      style={
        {
          width: size,
          height: size,
          // per-planet glow via CSS variable — themeable
          ["--glow" as any]: artist.glow,
          ["--accent" as any]: artist.accent,
        } as React.CSSProperties
      }
    >
      {/* Glow — outside disc, not clipped, not spinning */}
      <span
        className="planet-cd-glow"
        style={{ background: artist.glow }}
        aria-hidden
      />

      {/* Disc — the spinning part, fully circular via border-radius + overflow:hidden */}
      <div
        className={spinning ? "planet-cd-disc cd-spin" : "planet-cd-disc"}
        style={spinning ? ({ animationDuration: `${artist.spin}s` } as React.CSSProperties) : undefined}
      >
        {/* Base + grooves */}
        <span className="cd-grooves" aria-hidden />
        {/* Subtle inner shadow for depth */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: "inset 0 0 20px rgba(0,0,0,0.85), inset 0 0 4px rgba(255,255,255,0.12)" }}
          aria-hidden
        />

        {/* Photo label — small inner circle (vinyl label look), not donut, to avoid mask wedge */}
        <span className="cd-photo-wrap">
          <Image
            src={artist.image_url}
            alt={artist.name}
            fill
            sizes={`${Math.round(size * 0.36)}px`}
            style={{ objectFit: "cover" }}
            loading="lazy"
            decoding="async"
          />
          {/* soft highlight on photo */}
          <span className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.22), transparent 58%)" }} aria-hidden />
        </span>

        {/* Center spindle hole — 9% diameter */}
        <span className="cd-center-hole" aria-hidden />

        {/* Rainbow sheen — diagonal streak, overlay blend */}
        <span className="cd-sheen" aria-hidden />
      </div>
    </div>
  )
})

const MIN_PLANET_SIZE = 40
const MOBILE_GUTTER = 12
const TABLET_GUTTER = 24
const INITIAL_LAYOUT = { orbitScale: 0.3, sizeScale: 0.45, coreScale: 0.36, durationScale: 0.32 }

function getResponsiveLayout(stageWidth: number, maxOrbit: number, maxPlanet: number) {
  const sizeScale = stageWidth < 640
    ? 0.45
    : Math.min(1, Math.max(0.45, stageWidth / 1200))
  const largestRenderedPlanet = Math.max(MIN_PLANET_SIZE, maxPlanet * sizeScale)
  const gutter = stageWidth < 640 ? MOBILE_GUTTER : TABLET_GUTTER

  // Fit the complete outer system, not just the orbit line. The previous
  // calculation left the planet's radius outside the viewport on phones.
  const orbitScale = Math.min(1, Math.max(
    0.12,
    (stageWidth - gutter * 2 - largestRenderedPlanet) / maxOrbit,
  ))
  const coreScale = stageWidth < 640
    ? Math.min(0.42, Math.max(0.32, stageWidth / 950))
    : sizeScale
  const durationScale = stageWidth < 640
    ? 0.32
    : stageWidth < 1024
      ? 0.5
      : 1

  return { orbitScale, sizeScale, coreScale, durationScale }
}

export default function SolarSystem({ artists }: { artists: Artist[] }) {
  const [open, setOpen] = useState<Artist | null>(null)
  const [layout, setLayout] = useState(INITIAL_LAYOUT)
  const [isNearViewport, setIsNearViewport] = useState(true)
  const stageRef = useRef<HTMLDivElement>(null)
  const maxOrbit = Math.max(...artists.map((a) => a.orbit), 906)
  const maxPlanet = Math.max(...artists.map((a) => a.size), 0)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const updateLayout = () => {
      const stageWidth = stage.getBoundingClientRect().width
      if (!stageWidth) return

      const nextLayout = getResponsiveLayout(stageWidth, maxOrbit, maxPlanet)
      setLayout((current) => (
        current.orbitScale === nextLayout.orbitScale &&
        current.sizeScale === nextLayout.sizeScale &&
        current.coreScale === nextLayout.coreScale &&
        current.durationScale === nextLayout.durationScale
          ? current
          : nextLayout
      ))
    }

    updateLayout()

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(updateLayout)
      observer.observe(stage)
      return () => observer.disconnect()
    }

    window.addEventListener("resize", updateLayout, { passive: true })
    window.visualViewport?.addEventListener("resize", updateLayout, { passive: true })
    return () => {
      window.removeEventListener("resize", updateLayout)
      window.visualViewport?.removeEventListener("resize", updateLayout)
    }
  }, [maxOrbit, maxPlanet])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !("IntersectionObserver" in window)) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsNearViewport(entry.isIntersecting)
    }, { rootMargin: "200px 0px" })

    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  if (!artists.length) {
    return (
      <div className="text-center py-20 glass rounded-2xl">
        <Music4 className="w-10 h-10 mx-auto text-white/40 mb-3" />
        <p className="text-white/60 font-space">Artists will appear here once added in Admin.</p>
      </div>
    )
  }

  const { orbitScale, sizeScale, coreScale, durationScale } = layout
  const stageHeight = Math.max(360, Math.round(maxOrbit * orbitScale + 180))

  return (
    <>
      <div
        ref={stageRef}
        className={`orbit-stage${isNearViewport ? "" : " is-paused"}`}
        style={{ height: stageHeight } as React.CSSProperties}
      >
        {/* Dashed concentric orbits — scaled to fit viewport */}
        {artists.map((a) => {
          const orbitS = Math.round(a.orbit * orbitScale)
          return (
            <div
              key={`orbit-${a.id}`}
              className="absolute top-1/2 left-1/2 rounded-full border border-dashed"
              style={{
                width: orbitS,
                height: orbitS,
                marginLeft: -orbitS / 2,
                marginTop: -orbitS / 2,
                borderColor: "rgba(255,255,255,0.065)",
              }}
              aria-hidden
            />
          )
        })}

        {/* Central core — scaled on mobile to keep proportion */}
        {(() => {
          const coreSize = Math.round(192 * coreScale)
          const pulseSize = Math.round(268 * coreScale)
          return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative" style={{ width: coreSize, height: coreSize } as React.CSSProperties}>
                <div className="core-pulse" style={{ width: pulseSize, height: pulseSize, left: - (pulseSize - coreSize) / 2, top: - (pulseSize - coreSize) / 2 } as React.CSSProperties} aria-hidden />
                <div
                  className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: coreSize,
                    height: coreSize,
                    background: `radial-gradient(circle at 30% 30%, #FFF7ED 0%, #FDE68A 18%, #F59E0B 42%, #EC4899 68%, #7C3AED 100%)`,
                    boxShadow: `0 0 60px rgba(236,72,153,0.45), 0 0 120px rgba(139,92,246,0.30), inset -20px -30px 60px rgba(0,0,0,0.38)`,
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden" as any,
                  }}
                >
                  <div className="text-center">
                    <Headphones className="w-6 h-6 mx-auto text-white/90 mb-1" />
                    <div className="font-orbitron font-black text-sm tracking-widest text-white/95" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}>
                      GALAXIA
                    </div>
                    <div className="text-[9px] font-space uppercase tracking-[0.3em] text-white/70 mt-1">The Core</div>
                  </div>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ width: coreSize + 64, height: coreSize + 64, opacity: 0.7 } as React.CSSProperties} aria-hidden />
              </div>
            </div>
          )
        })()}

        {/* Position, orbit, counter-rotation, and disc spin use separate elements
            so reduced-motion and initial layout never affect centering. */}
        {artists.map((a) => {
          const orbitDuration = Math.max(24, a.duration * durationScale)
          const delay = -(a.startAngle / 360) * orbitDuration
          const orbitS = Math.round(a.orbit * orbitScale)
          const sizeS = Math.max(MIN_PLANET_SIZE, Math.round(a.size * sizeScale))
          return (
            <div
              key={a.id}
              className="orbit-pivot"
              style={{
                width: orbitS,
                height: orbitS,
                "--start-angle": `${a.startAngle}deg`,
                "--counter-angle": `${-a.startAngle}deg`,
              } as React.CSSProperties}
            >
              <div
                className="orbit-spin"
                style={{
                  animationDuration: `${orbitDuration}s`,
                  animationDelay: `${delay}s`,
                } as React.CSSProperties}
              >
                <div className="orbit-planet">
                  <div
                    className="planet-inner"
                    style={{
                      animationDuration: `${orbitDuration}s`,
                      animationDelay: `${delay}s`,
                    } as React.CSSProperties}
                  >
                    <button
                      aria-label={`Open ${a.name} — ${a.genre}`}
                      onClick={() => setOpen(a)}
                      className="planet-btn group relative outline-none focus:ring-2 focus:ring-white/40 rounded-full"
                      style={{ width: sizeS, height: sizeS }}
                    >
                      <PlanetCD artist={a} size={sizeS} spinning />
                      <span className="planet-label absolute left-1/2 -translate-x-1/2 top-full mt-3 whitespace-nowrap z-10 pointer-events-none">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-[10px] font-space uppercase tracking-[0.3em] border border-white/10"
                          style={{
                            color: a.accent,
                            background: "rgba(10,10,28,0.72)",
                            backdropFilter: "blur(10px)",
                            textShadow: "0 1px 8px rgba(0,0,0,0.7)",
                            boxShadow: `0 0 14px ${a.glow}`,
                          }}
                        >
                          <Disc3 className="planet-label-icon w-3 h-3" style={{ animationDuration: "3s" }} />
                          {a.name}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="lg:hidden flex justify-center mt-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-space">
          <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" /> Tap a record
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-white/10">
          {open && (
            <div className="relative">
              <div className="relative h-64 overflow-hidden">
                <Image src={open.image_url} alt={open.name} fill sizes="(max-width: 448px) 100vw, 448px" style={{ objectFit: "cover" }} priority={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/40 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-space uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                  {open.year}
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-xs font-space uppercase tracking-[0.3em] mb-1" style={{ color: open.accent, textShadow: "0 1px 12px rgba(0,0,0,0.8)" }}>
                    {open.genre}
                  </div>
                  <div className="font-orbitron font-black text-xl leading-none text-white" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                    {open.name}
                  </div>
                  <div className="text-xs text-white/70 mt-1 font-space">{open.role}</div>
                </div>
                <div className="absolute top-4 right-12 w-12 h-12">
                  <PlanetCD artist={open} size={48} spinning />
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-white/70 leading-relaxed">{open.bio}</p>
                <div className="flex gap-2">
                  <Button variant="galaxy" size="sm" onClick={() => setOpen(null)}>
                    <Ticket className="w-4 h-4" /> Book Pass
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.open(open.image_url, "_blank")}>
                    <Star className="w-4 h-4" /> View Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
