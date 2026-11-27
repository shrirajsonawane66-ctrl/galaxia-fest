"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  TiltedGridHero,
  type TiltedGridImage,
} from "@/components/ui/tilted-grid-hero";
import {
  HERO_PROPS,
  SLICES_DESKTOP,
  SLICES_LIGHT,
  optimizedSrc,
} from "@/lib/performers-hero";
import type { Performer } from "@/lib/performers";

export function PerformersCurvedSection({
  performers,
  className,
}: {
  performers: Performer[];
  className?: string;
}) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [near, setNear] = React.useState(false); // mount the band only when close to the viewport
  const [visible, setVisible] = React.useState(false); // animate only while on screen
  const [ready, setReady] = React.useState(false); // first photos decoded
  const [slices, setSlices] = React.useState(SLICES_DESKTOP);

  const images = React.useMemo<TiltedGridImage[]>(
    () =>
      performers
        .filter((p) => p.image)
        .map((p) => ({ src: optimizedSrc(p.image), alt: p.name })),
    [performers],
  );

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          nearIO.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    const liveIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.05,
    });
    nearIO.observe(el);
    liveIO.observe(el);
    return () => {
      nearIO.disconnect();
      liveIO.disconnect();
    };
  }, []);

  // Fewer strips on small screens and weak devices.
  React.useEffect(() => {
    const small = window.matchMedia("(max-width: 767px)").matches;
    const weak = (navigator.hardwareConcurrency ?? 8) < 4;
    setSlices(small || weak ? SLICES_LIGHT : SLICES_DESKTOP);
  }, []);

  // Decode the first photos before showing the band, so it never pops in.
  React.useEffect(() => {
    if (!near || images.length === 0) return;
    let cancelled = false;
    Promise.all(
      images.slice(0, 6).map(({ src }) => {
        const img = new Image();
        img.src = src;
        return img.decode().catch(() => undefined);
      }),
    ).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [near, images]);

  return (
    <section
      id="performers"
      ref={sectionRef}
      aria-labelledby="performers-title"
      className={cn("relative w-full py-16 sm:py-20 md:py-32", className)}
    >
      {/* Header: left-aligned, two columns on desktop */}
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-16 md:px-10">
        <h2 id="performers-title" className="type-h2 max-w-3xl text-balance">
          Artists who have lit up Galaxia
        </h2>
      </div>

      {/* Curved photo band: full width, nothing on top of it */}
      {images.length > 0 ? (
        <div className="relative mt-12 h-[420px] w-full md:mt-16 md:h-[560px]">
          {near && ready ? (
            <TiltedGridHero
              images={images}
              {...HERO_PROPS}
              slices={slices}
              paused={!visible}
              className="absolute inset-0 h-full w-full"
            />
          ) : null}
        </div>
      ) : (
        <p className="type-lead mx-auto mt-12 w-full max-w-7xl px-5 sm:px-6 md:mt-16 md:px-10">
          Past performers will be announced soon.
        </p>
      )}

    </section>
  );
}
