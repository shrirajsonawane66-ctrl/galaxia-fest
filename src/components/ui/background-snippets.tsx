import * as React from "react";
import { cn } from "@/lib/utils";

/* Fine film-grain noise, inlined so no asset is needed */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/* Colors sampled from the reference image */
const layers = {
  // 1. Base: vertical navy body
  base: "linear-gradient(180deg,#0a1c3e 0%,#142954 20%,#142954 50%,#0e2145 62%,#10234c 85%,#0a1c3f 100%)",
  // 2. Top-left haze
  topLeft:
    "radial-gradient(ellipse 40% 22% at 0% 0%, #1b2e63 0%, transparent 100%)",
  // 3. Top-right dark wedge
  topRight:
    "radial-gradient(ellipse 55% 38% at 100% 8%, #07122b 0%, rgba(7,18,43,0.6) 50%, transparent 100%)",
  // 4. Left periwinkle glow (peak #6d71e6 at the left edge, ~45% height)
  leftGlow:
    "radial-gradient(ellipse 55% 17% at 0% 45%, #6d71e6 0%, #5b63cb 35%, #304187 70%, transparent 100%)",
  // 5. Bottom-right royal blue glow (peak #3654c2, ~78% height)
  rightGlow:
    "radial-gradient(ellipse 30% 22% at 100% 78%, #3654c2 0%, #21387d 45%, rgba(30,53,119,0.5) 70%, transparent 100%)",
  // 6. Bottom-left shade
  bottomLeft:
    "radial-gradient(ellipse 45% 18% at 0% 100%, #07142e 0%, transparent 100%)",
};

type NavyGlowBackgroundProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Grain strength, 0 to 1 (default 0.3) */
  grain?: number;
};

export const Component = ({
  className,
  grain = 0.3,
  children,
  ...props
}: NavyGlowBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative isolate min-h-screen w-full overflow-hidden bg-[#142954]",
        className
      )}
      {...props}
    >
      {/* Decorative background stack */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {Object.entries(layers).map(([name, background]) => (
          <div key={name} className="absolute inset-0" style={{ background }} />
        ))}

        {/* Film grain */}
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{ backgroundImage: GRAIN, opacity: grain }}
        />
      </div>

      {children}
    </div>
  );
};
