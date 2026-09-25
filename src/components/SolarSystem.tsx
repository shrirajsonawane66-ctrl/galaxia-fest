"use client"
import { useState, useEffect, memo, useRef, useCallback, useId } from "react"
import { Disc3, Star, Ticket, Music4, Headphones } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import styles from "@/components/GalaxiaCore.module.css"
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

type ResponsiveLayout = {
  orbitScale: number
  sizeScale: number
  coreScale: number
}

const MIN_PLANET_SIZE = 40
const MOBILE_GUTTER = 12
const TABLET_GUTTER = 24
const INITIAL_LAYOUT: ResponsiveLayout = { orbitScale: 0.3, sizeScale: 0.45, coreScale: 0.36 }

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

  return { orbitScale, sizeScale, coreScale }
}

/**
 * Galaxia Core feel-tuning (kept in one place for easy iteration).
 *
 * Rotation:
 *   target = min(MAX_SPEED, IDLE + heldSeconds² * RAMP_PER_SEC)
 *   speed += (target - speed) * min(1, EASE * dt)
 *
 * Orbit:
 *   systemSpeed = SYS_IDLE + (speed - IDLE) * SYS_FOLLOW
 *
 * Ripples:
 *   gap = 0.62 - speedFactor * 0.5 seconds
 *   duration = 1.3 - speedFactor * 0.75 seconds
 *   max scale = 2.1 + speedFactor * 1.3
 *
 * These values are intentionally not CSS keyframes: the one rAF loop below
 * updates speed first, then core rotation, system rotation, audio rate, and
 * ripples in that order so every visual/audio layer stays synchronized.
 */
const IDLE = 6
const MAX_SPEED = 900
const RAMP_PER_SEC = 180
const EASE = 2.4
const SYS_IDLE = 4
const SYS_FOLLOW = 0.6
const REDUCED_MAX_SPEED = 120
const GALAXIA_PRIME_AUDIO = "/audio/galaxia-prime.mp3"

type CorePhysics = {
  angle: number
  speed: number
  target: number
  holding: boolean
  holdStart: number
  systemAngle: number
  rippleAccumulator: number
}

export default function SolarSystem({ artists }: { artists: Artist[] }) {
  const [open, setOpen] = useState<Artist | null>(null)
  const [holding, setHolding] = useState(false)
  const [layout, setLayout] = useState(INITIAL_LAYOUT)
  const stageRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLButtonElement>(null)
  const systemRef = useRef<HTMLDivElement>(null)
  const pulseFieldRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const reducedMotionRef = useRef(false)
  const physicsRef = useRef<CorePhysics>({
    angle: 0,
    speed: IDLE,
    target: IDLE,
    holding: false,
    holdStart: 0,
    systemAngle: 0,
    rippleAccumulator: 0,
  })
  const instructionsId = useId()
  const { orbitScale, sizeScale, coreScale } = layout
  const maxOrbit = Math.max(...artists.map((a) => a.orbit), 906)
  const maxPlanet = Math.max(...artists.map((a) => a.size), 0)

  const getAudioTrack = useCallback(() => {
    if (typeof Audio === "undefined") return null
    if (!audioRef.current) {
      const track = new Audio(GALAXIA_PRIME_AUDIO)
      track.loop = true
      track.preload = "metadata"
      audioRef.current = track
    }
    return audioRef.current
  }, [])

  useEffect(() => {
    const track = getAudioTrack()
    track?.load()

    return () => {
      physicsRef.current.holding = false
      physicsRef.current.target = IDLE
      pulseFieldRef.current?.replaceChildren()
      if (!track) return
      track.pause()
      track.removeAttribute("src")
      track.load()
      if (audioRef.current === track) audioRef.current = null
    }
  }, [getAudioTrack])

  const startHold = useCallback(() => {
    const physics = physicsRef.current
    if (physics.holding) return

    // Audio starts inside the input event call stack. Do not move this behind
    // state, a timeout, an effect, or an await: browsers require the gesture.
    const track = getAudioTrack()
    physics.holding = true
    physics.holdStart = performance.now()
    physics.target = IDLE
    setHolding(true)

    if (!track) return
    try {
      track.currentTime = 0
      track.playbackRate = 1
      const playRequest = track.play()
      void playRequest.catch(() => {
        // The visual interaction still works if this browser blocks playback.
      })
    } catch {
      // Keep the hold interaction available if a media format is unsupported.
    }
  }, [getAudioTrack])

  const endHold = useCallback(() => {
    const physics = physicsRef.current
    if (!physics.holding) return
    physics.holding = false
    physics.target = IDLE
    setHolding(false)
    audioRef.current?.pause()
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return
    event.preventDefault()
    if (!event.repeat) startHold()
  }, [startHold])

  const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return
    event.preventDefault()
    endHold()
  }, [endHold])

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    event.preventDefault()
    startHold()
  }, [startHold])

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
        current.coreScale === nextLayout.coreScale
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
    const core = coreRef.current
    const system = systemRef.current
    const pulseField = pulseFieldRef.current
    if (!stage || !core || !system || !pulseField) return

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotionPreference = () => {
      reducedMotionRef.current = motionQuery.matches
      if (motionQuery.matches) {
        physicsRef.current.rippleAccumulator = 0
        pulseField.replaceChildren()
      }
    }
    syncMotionPreference()
    motionQuery.addEventListener("change", syncMotionPreference)

    const physics = physicsRef.current
    const track = audioRef.current
    let isVisible = true
    let animationFrame: number | null = null
    let lastTime = performance.now()

    const currentMaxSpeed = () => (
      reducedMotionRef.current ? REDUCED_MAX_SPEED : MAX_SPEED
    )

    const speedFactor = () => {
      const maxSpeed = currentMaxSpeed()
      return Math.min(1, Math.max(0, (physics.speed - IDLE) / (maxSpeed - IDLE)))
    }

    const spawnRipple = (factor: number) => {
      const ripple = document.createElement("div")
      ripple.className = styles.ripple
      // Exact prototype tuning: faster and larger as the core accelerates.
      ripple.style.setProperty("--duration", `${1.3 - factor * 0.75}s`)
      ripple.style.setProperty("--scale", `${2.1 + factor * 1.3}`)
      pulseField.appendChild(ripple)
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true })
    }

    const frame = (now: number) => {
      animationFrame = null
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (physics.holding) {
        const heldSeconds = (now - physics.holdStart) / 1000
        physics.target = Math.min(
          currentMaxSpeed(),
          IDLE + heldSeconds * heldSeconds * RAMP_PER_SEC,
        )
      }

      // Ease on release too: target returns to IDLE, but speed never snaps.
      physics.speed += (physics.target - physics.speed) * Math.min(1, EASE * dt)
      physics.angle = (physics.angle + physics.speed * dt) % 360
      core.style.transform = `rotate(${physics.angle}deg)`

      const systemSpeed = SYS_IDLE + (physics.speed - IDLE) * SYS_FOLLOW
      physics.systemAngle = (physics.systemAngle + systemSpeed * dt) % 360
      system.style.transform = `rotate(${physics.systemAngle}deg)`
      system.style.setProperty("--counter-rotation", `${-physics.systemAngle}deg`)

      const factor = speedFactor()
      if (track) track.playbackRate = 1 + factor * 0.5

      if (!reducedMotionRef.current) {
        const rippleGap = 0.62 - factor * 0.5
        physics.rippleAccumulator += dt
        if (physics.rippleAccumulator >= rippleGap) {
          spawnRipple(factor)
          physics.rippleAccumulator = 0
        }
      }

      animationFrame = requestAnimationFrame(frame)
    }

    const startLoop = () => {
      if (animationFrame !== null || document.hidden || !isVisible) return
      lastTime = performance.now()
      animationFrame = requestAnimationFrame(frame)
    }

    const stopLoop = () => {
      if (animationFrame === null) return
      cancelAnimationFrame(animationFrame)
      animationFrame = null
      lastTime = performance.now()
    }

    const syncVisibility = () => {
      if (document.hidden) {
        endHold()
        stopLoop()
      } else {
        startLoop()
      }
    }

    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
          isVisible = entry.isIntersecting
          if (!isVisible) {
            endHold()
            stopLoop()
          } else {
            startLoop()
          }
        }, { threshold: 0.01 })
      : null

    observer?.observe(stage)
    window.addEventListener("blur", endHold)
    window.addEventListener("pagehide", endHold)
    document.addEventListener("visibilitychange", syncVisibility)
    startLoop()

    return () => {
      stopLoop()
      observer?.disconnect()
      motionQuery.removeEventListener("change", syncMotionPreference)
      window.removeEventListener("blur", endHold)
      window.removeEventListener("pagehide", endHold)
      document.removeEventListener("visibilitychange", syncVisibility)
    }
  }, [artists.length, endHold])

  if (!artists.length) {
    return (
      <div className="text-center py-20 glass rounded-2xl">
        <Music4 className="w-10 h-10 mx-auto text-white/40 mb-3" />
        <p className="text-white/60 font-space">Artists will appear here once added in Admin.</p>
      </div>
    )
  }

  const stageHeight = Math.max(360, Math.round(maxOrbit * orbitScale + 180))
  const coreSize = Math.round(192 * coreScale)

  return (
    <>
      <div
        ref={stageRef}
        className="orbit-stage"
        style={{ height: stageHeight } as React.CSSProperties}
      >
        {/* Ripples sit behind both the core and the rotating performer system. */}
        <div ref={pulseFieldRef} className={styles.rippleField} aria-hidden />

        {/* Central hold-to-play core. Its transform is owned by the one rAF loop. */}
        <div
          className={styles.coreLayer}
          style={{ width: coreSize, height: coreSize }}
        >
          <button
            ref={coreRef}
            type="button"
            className={`${styles.coreButton} ${holding ? styles.holding : ""}`}
            aria-label={holding ? "Release to pause Galaxia Prime" : "Hold to play Galaxia Prime"}
            aria-describedby={instructionsId}
            aria-pressed={holding}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={handleTouchStart}
            onTouchEnd={endHold}
            onTouchCancel={endHold}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onBlur={endHold}
            onContextMenu={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
          >
            <span className={styles.coreInner}>
              <Headphones className={styles.coreIcon} aria-hidden />
              <span className={styles.coreTitle}>GALAXIA</span>
              <span className={styles.coreSubtitle}>HOLD TO PLAY</span>
            </span>
          </button>
          <span id={instructionsId} className={styles.hint} aria-hidden>
            {holding ? "Release to ease back" : "Press and hold the core"}
          </span>
        </div>

        <div
          ref={systemRef}
          className="orbit-system"
          role="group"
          aria-label="Artist records orbiting Galaxia"
          style={{ zIndex: 2 }}
        >
        {/* Rings and records share the independently rotating system layer. */}
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

        {/* The system rotates as one layer; the nested counter-rotation keeps
            every record artwork upright without changing its appearance. */}
        {artists.map((a) => {
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
              <div className="orbit-spin">
                <div className="orbit-planet">
                  <div className="planet-inner">
                    <div className="planet-upright">
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
            </div>
          )
        })}
        </div>
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
