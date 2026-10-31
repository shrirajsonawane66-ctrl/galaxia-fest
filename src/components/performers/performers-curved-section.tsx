"use client";

import * as React from "react";
import Link from "next/link";
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

const OPEN_YEARS = 3;

function YearGrid({ groups }: { groups: [number, Performer[]][] }) {
  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map(([year, list]) => (
        <div key={year}>
          <h3 className="type-h3">{year}</h3>
          <ul className="mt-4 space-y-2.5">
            {list.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/10 pb-2.5 last:border-b-0"
              >
                <span className="text-base font-medium text-[#F4EDE0]">{p.name}</span>
                <span className="type-small shrink-0">{p.role}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

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

  // Names grouped by edition year, newest first (order inside a year is preserved).
  const groups = React.useMemo(() => {
    const map = new Map<number, Performer[]>();
    for (const p of performers) map.set(p.year, [...(map.get(p.year) ?? []), p]);
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [performers]);

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
        <div className="flex w-full max-w-sm flex-col items-start gap-6 md:w-auto">
          <p className="type-lead">
            A look back at the performers who took our stages in past editions.
          </p>
          <Link
            href="/events"
            className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#E5121F] px-7 text-base font-semibold text-white transition-colors hover:bg-[#FF1F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] sm:w-auto"
          >
            See this year&apos;s lineup
          </Link>
        </div>
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

      {/* Lineup index by edition year */}
      {groups.length > 0 ? (
        <div className="mx-auto mt-12 w-full max-w-7xl px-5 sm:px-6 md:mt-16 md:px-10">
          <div className="border-t border-white/10 pt-10">
            <YearGrid groups={groups.slice(0, OPEN_YEARS)} />
            {groups.length > OPEN_YEARS ? (
              <details className="group mt-10 border-t border-white/10 pt-6">
                <summary className="type-small flex min-h-11 cursor-pointer select-none items-center rounded-md py-1 hover:text-[#F4EDE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] sm:min-h-0">
                  Earlier editions
                </summary>
                <div className="mt-8">
                  <YearGrid groups={groups.slice(OPEN_YEARS)} />
                </div>
              </details>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
