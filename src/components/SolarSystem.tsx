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
          "--glow": artist.glow,
          "--accent": artist.accent,
        } as React.CSSProperties & { "--glow": string; "--accent": string }
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
  sizeScale: number
  minOrbitDiameter: number
  maxOrbitDiameter: number
}

const MIN_PLANET_SIZE = 40
const MOBILE_GUTTER = 12
const TABLET_GUTTER = 24
const CORE_ORBIT_GAP = 16
const INITIAL_LAYOUT: ResponsiveLayout = {
  sizeScale: 0.36,
  minOrbitDiameter: 218,
  maxOrbitDiameter: 260,
}

function getResponsiveLayout(
  stageWidth: number,
  viewportWidth: number,
  viewportHeight: number,
  minOrbit: number,
  maxOrbit: number,
  minPlanet: number,
  maxPlanet: number,
) {
  const smallerViewport = Math.max(1, Math.min(viewportWidth, viewportHeight))
  const gutter = stageWidth < 640 ? MOBILE_GUTTER : TABLET_GUTTER
  const sizeScale = smallerViewport < 480
    ? 0.36
    : Math.min(1, Math.max(0.45, smallerViewport / 1100))
  const coreDiameter = Math.min(200, Math.max(140, viewportWidth * 0.45))
  const smallestRenderedPlanet = Math.max(MIN_PLANET_SIZE, minPlanet * sizeScale)
  const largestRenderedPlanet = Math.max(MIN_PLANET_SIZE, maxPlanet * sizeScale)

  // The outer path is viewport-relative and includes room for the outer disc.
  // The inner path starts beyond the core so mobile records never crowd it.
  const viewportOrbitDiameter = smallerViewport * 0.82
  const availableOrbitDiameter = stageWidth - gutter * 2 - largestRenderedPlanet
  const maxOrbitDiameter = Math.min(
    maxOrbit,
    viewportOrbitDiameter,
    availableOrbitDiameter,
  )
  const minOrbitDiameter = Math.min(
    maxOrbitDiameter,
    coreDiameter + smallestRenderedPlanet + CORE_ORBIT_GAP,
  )

  return { sizeScale, minOrbitDiameter, maxOrbitDiameter }
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
const SYS_IDLE = 10
const SYS_FOLLOW = 0.85
const REDUCED_MAX_SPEED = 120
const GALAXIA_PRIME_AUDIO = "/audio/galaxia-prime.mp3?v=galaxia-prime-9ed66b1a"
const RIPPLE_POOL_SIZE = 6
const RIPPLE_POOL_KEYS = Array.from({ length: RIPPLE_POOL_SIZE }, (_, index) => index)
const AUDIO_RATE_EPSILON = 0.01
const IDLE_SPEED_EPSILON = 0.05

type CorePhysics = {
  angle: number
  speed: number
  target: number
  holding: boolean
  holdStart: number
  systemAngle: number
  rippleAccumulator: number
}

type RipplePoolItem = {
  element: HTMLSpanElement
  animation: Animation
  active: boolean
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
  const ripplePoolRef = useRef<RipplePoolItem[]>([])
  const activeRippleCountRef = useRef(0)
  const rippleCursorRef = useRef(0)
  const hasRenderedIdleRippleRef = useRef(false)
  const lastAudioRateRef = useRef(1)
  const resumeLoopRef = useRef<() => void>(() => undefined)
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
  const { sizeScale, minOrbitDiameter, maxOrbitDiameter } = layout
  const minOrbit = Math.min(...artists.map((a) => a.orbit), 288)
  const maxOrbit = Math.max(...artists.map((a) => a.orbit), 906)
  const minPlanet = Math.min(...artists.map((a) => a.size), MIN_PLANET_SIZE)
  const maxPlanet = Math.max(...artists.map((a) => a.size), 0)
  const rawOrbitSpan = Math.max(1, maxOrbit - minOrbit)
  const getRenderedOrbitDiameter = (orbit: number) => {
    const progress = Math.min(1, Math.max(0, (orbit - minOrbit) / rawOrbitSpan))
    return Math.round(
      minOrbitDiameter + progress * (maxOrbitDiameter - minOrbitDiameter),
    )
  }

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
    const physics = physicsRef.current
    // Create the audio element lazily inside the hold gesture. Instantiating it
    // on mount would request the track before the visitor interacts, which is
    // both wasteful and a guaranteed 404 when the optional file is not shipped.
    return () => {
      physics.holding = false
      physics.target = IDLE
      const track = audioRef.current
      if (!track) return
      track.pause()
      track.removeAttribute("src")
      track.load()
      audioRef.current = null
    }
  }, [])

  const startHold = useCallback(() => {
    const physics = physicsRef.current
    if (physics.holding) return

    // Keep reset + play() in the originating pointer/key event call stack.
    // This runs before React state or effects, which is required by iOS Safari.
    const track = getAudioTrack()
    lastAudioRateRef.current = 1
    if (track) {
      try {
        track.currentTime = 0
      } catch {
        // A not-yet-seekable track still starts safely from its default position.
      }
      track.playbackRate = 1
      try {
        const playRequest = track.play()
        void playRequest.catch(() => {
          // The visual interaction still works if this browser blocks playback.
        })
      } catch {
        // Keep the hold interaction available if a media format is unsupported.
      }
    }

    physics.holding = true
    physics.holdStart = performance.now()
    physics.target = IDLE
    setHolding(true)
    resumeLoopRef.current()
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

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    // play() is reached synchronously before state, haptics, or capture work.
    startHold()

    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(10)
      } catch {
        // Haptics are optional and may be blocked by browser policy.
      }
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some embedded WebViews expose Pointer Events without capture support.
    }
  }, [startHold])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const updateLayout = () => {
      const stageWidth = stage.getBoundingClientRect().width
      const viewport = window.visualViewport
      const viewportWidth = viewport?.width || window.innerWidth
      const viewportHeight = viewport?.height || window.innerHeight
      if (!stageWidth || !viewportWidth || !viewportHeight) return

      const nextLayout = getResponsiveLayout(
        stageWidth,
        viewportWidth,
        viewportHeight,
        minOrbit,
        maxOrbit,
        minPlanet,
        maxPlanet,
      )
      setLayout((current) => (
        current.sizeScale === nextLayout.sizeScale &&
        current.minOrbitDiameter === nextLayout.minOrbitDiameter &&
        current.maxOrbitDiameter === nextLayout.maxOrbitDiameter
          ? current
          : nextLayout
      ))
    }

    updateLayout()

    const observer = typeof ResizeObserver === "function"
      ? new ResizeObserver(updateLayout)
      : null
    observer?.observe(stage)
    window.addEventListener("resize", updateLayout, { passive: true })
    window.addEventListener("orientationchange", updateLayout, { passive: true })
    window.visualViewport?.addEventListener("resize", updateLayout, { passive: true })

    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", updateLayout)
      window.removeEventListener("orientationchange", updateLayout)
      window.visualViewport?.removeEventListener("resize", updateLayout)
    }
  }, [minOrbit, maxOrbit, minPlanet, maxPlanet])

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
        ripplePoolRef.current.forEach((item) => {
          item.active = false
          item.animation.pause()
          item.element.style.visibility = "hidden"
        })
        activeRippleCountRef.current = 0
        rippleCursorRef.current = 0
      }
    }
    syncMotionPreference()
    motionQuery.addEventListener("change", syncMotionPreference)

    const physics = physicsRef.current
    const track = audioRef.current
    const uprightNodes = Array.from(system.querySelectorAll<HTMLElement>(".planet-upright"))
    let isVisible = true
    let animationFrame: number | null = null
    let lastTime = performance.now()

    // Six DOM nodes and six Animation objects are created once, then reused for
    // the lifetime of the component. No pulse allocates or destroys DOM.
    const ripplePool: RipplePoolItem[] = []
    for (const element of Array.from(pulseField.children)) {
      if (!(element instanceof HTMLSpanElement) || typeof element.animate !== "function") continue
      element.style.visibility = "hidden"
      const animation = element.animate(
        [
          { transform: "translate3d(-50%, -50%, 0) scale(1)", opacity: 0.85 },
          { transform: "translate3d(-50%, -50%, 0) scale(2.1)", opacity: 0 },
        ],
        { duration: 1300, easing: "ease-out", fill: "both" },
      )
      const item: RipplePoolItem = { element, animation, active: false }
      animation.pause()
      animation.currentTime = 0
      animation.onfinish = () => {
        if (!item.active || animation.playState !== "finished") return
        item.active = false
        activeRippleCountRef.current = Math.max(0, activeRippleCountRef.current - 1)
        element.style.visibility = "hidden"
      }
      ripplePool.push(item)
    }
    ripplePoolRef.current = ripplePool
    activeRippleCountRef.current = 0
    rippleCursorRef.current = 0
    hasRenderedIdleRippleRef.current = ripplePool.length === 0

    const currentMaxSpeed = () => (
      reducedMotionRef.current ? REDUCED_MAX_SPEED : MAX_SPEED
    )

    const speedFactor = () => {
      const maxSpeed = currentMaxSpeed()
      return Math.min(1, Math.max(0, (physics.speed - IDLE) / (maxSpeed - IDLE)))
    }

    const spawnRipple = (factor: number) => {
      if (!ripplePool.length) return
      const item = ripplePool[rippleCursorRef.current % ripplePool.length]
      rippleCursorRef.current += 1

      // Exact prototype tuning: faster and larger as the core accelerates.
      // The pooled Animation is reused; only its existing KeyframeEffect changes.
      const effect = item.animation.effect as KeyframeEffect | null
      if (!effect) return
      effect.setKeyframes([
        { transform: "translate3d(-50%, -50%, 0) scale(1)", opacity: 0.85 },
        {
          transform: `translate3d(-50%, -50%, 0) scale(${2.1 + factor * 1.3})`,
          opacity: 0,
        },
      ])
      effect.updateTiming({
        duration: `${1.3 - factor * 0.75}s`,
        easing: "ease-out",
        fill: "both",
      })

      if (!item.active) {
        item.active = true
        activeRippleCountRef.current += 1
      }
      item.element.style.visibility = "visible"
      item.animation.currentTime = 0
      item.animation.play()
      if (!physics.holding) hasRenderedIdleRippleRef.current = true
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
      core.style.transform = `translate3d(0, 0, 0) rotate(${physics.angle}deg)`

      const systemSpeed = SYS_IDLE + (physics.speed - IDLE) * SYS_FOLLOW
      physics.systemAngle = (physics.systemAngle + systemSpeed * dt) % 360
      system.style.transform = `translate3d(0, 0, 0) rotate(${physics.systemAngle}deg)`
      // Counter-rotate each node directly. Writing an inherited custom property
      // on the system every frame forced style recalculation across the subtree.
      const counterRotation = -physics.systemAngle
      for (const node of uprightNodes) {
        node.style.transform = `translate3d(0, 0, 0) rotate(${counterRotation}deg)`
      }

      const factor = speedFactor()
      if (track) {
        const nextRate = 1 + factor * 0.5
        if (Math.abs(nextRate - lastAudioRateRef.current) > AUDIO_RATE_EPSILON) {
          track.playbackRate = nextRate
          lastAudioRateRef.current = nextRate
        }
      }

      if (!reducedMotionRef.current) {
        const rippleGap = 0.62 - factor * 0.5
        physics.rippleAccumulator += dt
        if (physics.rippleAccumulator >= rippleGap) {
          spawnRipple(factor)
          physics.rippleAccumulator = 0
        }
      }

      const speedSettled =
        Math.abs(physics.speed - IDLE) <= IDLE_SPEED_EPSILON &&
        Math.abs(physics.target - IDLE) <= IDLE_SPEED_EPSILON
      const idleVisualSettled =
        reducedMotionRef.current ||
        ripplePool.length === 0 ||
        hasRenderedIdleRippleRef.current

      if (
        !physics.holding &&
        speedSettled &&
        activeRippleCountRef.current === 0 &&
        idleVisualSettled
      ) {
        return
      }

      animationFrame = requestAnimationFrame(frame)
    }

    const startLoop = () => {
      if (animationFrame !== null || document.hidden || !isVisible) return
      lastTime = performance.now()
      animationFrame = requestAnimationFrame(frame)
    }

    resumeLoopRef.current = startLoop

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
      if (resumeLoopRef.current === startLoop) {
        resumeLoopRef.current = () => undefined
      }
      ripplePool.forEach((item) => {
        item.animation.onfinish = null
        item.animation.cancel()
        item.element.style.visibility = "hidden"
        item.active = false
      })
      ripplePoolRef.current = []
      activeRippleCountRef.current = 0
      hasRenderedIdleRippleRef.current = false
      lastAudioRateRef.current = 1
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

  const stageHeight = Math.max(420, Math.round(maxOrbitDiameter + 180))

  return (
    <>
      <div
        ref={stageRef}
        className="orbit-stage"
        style={{ height: stageHeight } as React.CSSProperties}
      >
        {/* Six pooled nodes sit behind the core; pulses only restart WAAPI. */}
        <div ref={pulseFieldRef} className={styles.rippleField} aria-hidden>
          {RIPPLE_POOL_KEYS.map((index) => (
            <span key={index} className={styles.ripple} />
          ))}
        </div>

        {/* Central hold-to-play core. Its transform is owned by the one rAF loop. */}
        <div className={styles.coreLayer}>
          <button
            ref={coreRef}
            type="button"
            className={`${styles.coreButton} ${holding ? styles.holding : ""}`}
            aria-label={holding ? "Release to pause Galaxia Prime" : "Hold to play Galaxia Prime"}
            aria-describedby={instructionsId}
            aria-pressed={holding}
            onPointerDown={handlePointerDown}
            onPointerUp={endHold}
            onPointerCancel={endHold}
            onPointerLeave={endHold}
            onLostPointerCapture={endHold}
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
          const orbitS = getRenderedOrbitDiameter(a.orbit)
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
          const orbitS = getRenderedOrbitDiameter(a.orbit)
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
