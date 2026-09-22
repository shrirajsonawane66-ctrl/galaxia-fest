// Pure CSS starfield + nebula — zero JS, GPU-only (transform/opacity)
export default function GalaxyBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 bg-[#050816] overflow-hidden pointer-events-none"
      style={{ contain: "strict" }}
    >
      {/* Nebula blobs — blurred gradients, animated via transform/opacity only */}
      <div className="absolute inset-0">
        <div className="nebula nebula-1" />
        <div className="nebula nebula-2" />
        <div className="nebula nebula-3" />
      </div>

      {/* Star layers — 3 layers different size/opacity/speed, pure CSS transform */}
      <div className="star-layer star-layer-1" aria-hidden />
      <div className="star-layer star-layer-2" aria-hidden />
      <div className="star-layer star-layer-3" aria-hidden />

      {/* Vignette for depth */}
      <div className="absolute inset-0 vignette" aria-hidden />

      {/* Subtle stage beams at bottom — static, no animation */}
      <div className="absolute bottom-0 inset-x-0 h-[45vh] stage-beams opacity-40" aria-hidden />
    </div>
  )
}
