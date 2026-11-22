"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* One row of images streams right to left around the inside of a cylinder.
 * The centre faces you flat, the ends bend toward you, and the ends fade
 * into the page. Every tile is cut into vertical SLICES strips (flat facets
 * of the cylinder); the tile (preserve-3d) is what moves, so strips never
 * drift apart. Transform-only animation on the compositor; the fade is a
 * static mask. JS only: a ResizeObserver that sizes the loop, and a handler
 * that hands a tile its next image each time it wraps, out of sight. */

// Default strips per tile. Fewer starts to show corners along the edges.
const DEFAULT_SLICES = 16;

// Camera distance from the screen, as a multiple of the cylinder's radius.
const CAMERA = 1.6;

/**
 * Cylinder radius, as a share of the hero's width, that puts the frame's
 * edge `bend` radians round the arc as seen through the camera.
 */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

// A tile is never wider than this share of the hero, so a phone still
// shows its neighbours instead of one tile edge to edge.
const MAX_WIDTH = 55;

function measure(
  width: number,
  height: number,
  tile: number,
  aspect: number,
  gap: number,
  bend: number,
) {
  const h = Math.min(
    (tile / 100) * height,
    ((MAX_WIDTH / 100) * width) / aspect,
  );
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0))
    return { columns: 2, sweep: 0, unit: 0, limit: 0 };
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  // Capped so a hero squeezed to a sliver can't mount thousands of tiles.
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)));
  const round = (n: number) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return {
    columns,
    sweep,
    unit: round(unit),
    limit: round(Math.min(sweep, limit)),
  };
}

export type TiltedGridImage = {
  src: string;
  /** Only used if you drop the decorative treatment; the band is aria-hidden. */
  alt?: string;
};

export type TiltedGridHeroProps = {
  /** Images run along the row in order; short lists simply repeat. */
  images: TiltedGridImage[];
  /** Seconds for the row to advance by one tile. @default 4 */
  speed?: number;
  /** Tile height, as a percentage of the hero's height. @default 26 */
  tileHeight?: number;
  /** Tile width divided by tile height. @default 16 / 9 */
  aspectRatio?: number;
  /** Space between tiles, as a percentage of a tile's height. @default 6 */
  gap?: number;
  /** Vertical centre of the row, as a percentage of the hero's height. @default 56 */
  axis?: number;
  /** How far the row has bent round by the frame's edge, in degrees (5-85). @default 80 */
  curve?: number;
  /** Width of the fade at each end, as a percentage of the hero's width. @default 12 */
  fade?: number;
  /** Strips each tile is cut into. Fewer = lighter on weak devices. @default 16 */
  slices?: number;
  /** Freezes the row in place (e.g. while off-screen). @default false */
  paused?: boolean;
  /** CSS object-position for every image, to keep faces in frame. @default "center 25%" */
  objectPosition?: string;
  /** Content rendered above the band. */
  children?: React.ReactNode;
  className?: string;
};

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  slices = DEFAULT_SLICES,
  paused = false,
  objectPosition = "center 25%",
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const orbit = `tgh-o-${id}`;
  const tile = `tgh-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;

  // Null until the observer has measured the hero. The band stays hidden
  // until then, so a first paint laid out for the wrong size never shows.
  const [layout, setLayout] = React.useState<ReturnType<typeof measure> | null>(
    null,
  );

  // The image each tile shows, as a position in the run of images. It only
  // changes when the tile wraps, which is out of sight.
  const [shown, setShown] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend);
      setLayout((prev) =>
        prev?.columns === next.columns &&
        prev.sweep === next.sweep &&
        prev.unit === next.unit
          ? prev
          : next,
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileHeight, aspectRatio, gap, bend]);

  // Fetch every image up front; a tile picks up its next one just before it
  // comes back into view, too late to start loading it then.
  React.useEffect(() => {
    for (const { src } of images) new Image().src = src;
  }, [images]);

  const { columns, sweep, unit, limit } =
    layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend);

  // Every length is a multiple of the tile's height, which follows the
  // hero's height until MAX_WIDTH caps it on narrow screens.
  const u = (n: number) =>
    `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(
      MAX_WIDTH / aspectRatio
    ).toFixed(4)}cqw))`;

  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  // Out to the axis, round it, back in: a box sits on the cylinder at the
  // angle rotateY gives it.
  const turn = (deg: number) =>
    `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;

  // Beyond `limit` a tile is wholly off-screen, so it is hidden there.
  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
  // No `prefers-reduced-motion` pause: on Windows machines with "Animation
  // effects" off the media query is always true, which froze the band for
  // everyone there. It still pauses off-screen (the `paused` prop) and the
  // motion is a slow, decorative drift on an aria-hidden band.
  const css =
    `@keyframes ${orbit}{` +
    `from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}` +
    `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}` +
    `${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}`;

  const share = aspectRatio / slices;
  const duration = columns * speed;
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${
    100 - fade
  }%,transparent)`;

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
      style={{ containerType: "size", ...props.style }}
    >
      <style>{css}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: layout ? 1 : 0,
          // A shared vanishing point on the row's centre line.
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {Array.from({ length: columns }, (_, t) => {
          // Tile `columns - 1` starts nearest the exit and tile 0 furthest
          // back, so this numbers tiles in the order they come on.
          const first = columns - 1 - t;
          const img = images[(shown[t] ?? first) % Math.max(images.length, 1)];
          return (
            <div
              key={t}
              className={cn(tile, "absolute")}
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                transformStyle: "preserve-3d",
                // Tile t starts t tiles along the loop. Longhands instead of
                // the `animation` shorthand: the shorthand resets play-state
                // and makes React warn whenever play-state changes.
                animationName: orbit,
                animationDuration: `${duration}s`,
                animationTimingFunction: "linear",
                animationDelay: `${-t * speed}s`,
                animationIterationCount: "infinite",
                animationPlayState: paused ? "paused" : "running",
              }}
              onAnimationIteration={(e) => {
                // elapsedTime counts whole loops, missed events included.
                const lap = Math.round(e.elapsedTime / duration);
                setShown((prev) => {
                  const next = lap * columns + first;
                  return prev[t] === next ? prev : { ...prev, [t]: next };
                });
              }}
            >
              {Array.from({ length: slices }, (_, k) => (
                <div
                  key={k}
                  className={cn(
                    "absolute top-0 overflow-hidden bg-[#0a1f5c]",
                    k === 0 && "rounded-l-lg",
                    k === slices - 1 && "rounded-r-lg",
                  )}
                  style={{
                    // Every strip starts at the tile's centre and is turned
                    // round the axis to its own place on the arc.
                    left: u((aspectRatio - share) / 2),
                    // A pixel wider than its share so neighbouring facets
                    // overlap and no hairline opens between them.
                    width:
                      k === slices - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn(
                      (aspectRatio / 2 - (k + 0.5) * share) * unit,
                    ),
                  }}
                >
                  {img ? (
                    <img
                      src={img.src}
                      alt={k === 0 ? (img.alt ?? "") : ""}
                      draggable={false}
                      decoding="async"
                      className="absolute top-0 max-w-none object-cover"
                      style={{
                        left: u(-k * share),
                        width: u(aspectRatio),
                        height: u(1),
                        objectPosition,
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {children}
    </div>
  );
}

export default TiltedGridHero;
