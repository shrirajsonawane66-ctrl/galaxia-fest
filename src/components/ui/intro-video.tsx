"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Phase = "checking" | "gate" | "playing" | "leaving" | "done";

export interface IntroVideoProps {
  /** MP4 (H.264) source, e.g. "/videos/intro.mp4" */
  src: string;
  /** Optional WebM source for smaller files */
  webmSrc?: string;
  /** Image shown before the video loads and behind the tap-to-enter button */
  poster?: string;
  /** sessionStorage key. Change it to force the intro to replay for everyone */
  storageKey?: string;
  /** Play once per session (default true). Set false to play on every load */
  oncePerSession?: boolean;
  /** Always show "Tap to enter" first, so the video plays with sound (default false) */
  requireTap?: boolean;
  /** Show a Skip button (default false, so the video plays in full) */
  allowSkip?: boolean;
  /** Fade-out duration in ms (default 700) */
  fadeMs?: number;
  /** Called after the overlay has fully faded out */
  onFinish?: () => void;
  className?: string;
}

export function IntroVideo({
  src,
  webmSrc,
  poster,
  storageKey = "intro-video-seen",
  oncePerSession = true,
  requireTap = false,
  allowSkip = false,
  fadeMs = 700,
  onFinish,
  className,
}: IntroVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = React.useState<Phase>("checking");
  const [sound, setSound] = React.useState(false);
  const watchdog = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = React.useRef(false);

  /* Decide whether to show the intro */
  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = oncePerSession && sessionStorage.getItem(storageKey) === "1";
    } catch {}
    if (reduced || seen) setPhase("done");
    else setPhase(requireTap ? "gate" : "playing");
  }, [oncePerSession, requireTap, storageKey]);

  /* Lock scroll while the overlay is up */
  React.useEffect(() => {
    if (phase === "checking" || phase === "done") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [phase]);

  const finish = React.useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    if (watchdog.current) clearTimeout(watchdog.current);
    try {
      if (oncePerSession) sessionStorage.setItem(storageKey, "1");
    } catch {}
    setPhase("leaving");
    setTimeout(() => {
      setPhase("done");
      onFinish?.();
    }, fadeMs);
  }, [fadeMs, onFinish, oncePerSession, storageKey]);

  /* Start playback when phase becomes "playing" */
  React.useEffect(() => {
    if (phase !== "playing") return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = !sound;
    v.play().catch(() => {
      // Autoplay blocked: ask for a tap
      setPhase("gate");
    });
    // Failsafe: never get stuck on the intro
    watchdog.current = setTimeout(finish, 20000);
    return () => {
      if (watchdog.current) clearTimeout(watchdog.current);
    };
  }, [phase, sound, finish]);

  const handleEnter = () => {
    setSound(true);
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      v.currentTime = 0;
    }
    setPhase("playing");
  };

  const handleMetadata = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = setTimeout(finish, v.duration * 1000 + 3000);
  };

  if (phase === "done") return null;

  return (
    <div
      role="presentation"
      className={cn(
        "fixed inset-0 z-[100] bg-black transition-opacity ease-out",
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100",
        className
      )}
      style={{ transitionDuration: `${fadeMs}ms` }}
    >
      {phase !== "checking" && (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={poster}
          muted={!sound}
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          onLoadedMetadata={handleMetadata}
          onEnded={finish}
          onError={finish}
        >
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          <source src={src} type="video/mp4" />
        </video>
      )}

      {phase === "gate" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <button
            onClick={handleEnter}
            className="rounded-full border border-white/60 px-8 py-3 text-sm font-medium uppercase tracking-[0.3em] text-white backdrop-blur transition hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Tap to enter
          </button>
        </div>
      )}

      {allowSkip && phase === "playing" && (
        <button
          onClick={finish}
          className="absolute bottom-6 right-6 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white backdrop-blur hover:bg-white/20"
        >
          Skip
        </button>
      )}
    </div>
  );
}
