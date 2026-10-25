import Image from "next/image";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/**
 * Site-wide nebula backdrop.
 *
 * This is intentionally a server component: the slow drift is pure CSS, so the
 * background adds no client JavaScript and no hydration boundary to the root
 * layout. It renders on every route and stays fixed while the page scrolls.
 */
export function NebulaBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#06123a]"
    >
      <div className="nebula-drift absolute inset-[-4%]">
        <Image
          src="/images/bg-nebula.svg"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/15" />

      {/* Fine film grain */}
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}

export default NebulaBackground;
