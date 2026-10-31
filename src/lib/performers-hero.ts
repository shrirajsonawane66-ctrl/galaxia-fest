export const HERO_PROPS = {
  speed: 5,            // seconds per tile (slower = smoother, calmer)
  tileHeight: 54,      // % of the band height
  aspectRatio: 3 / 4,  // portrait tiles, suits performer photos
  gap: 8,
  axis: 50,            // row is vertically centred in its own box
  curve: 78,
  fade: 14,
  objectPosition: "center 25%", // keeps faces in frame
} as const;

// Strips per tile: fewer on phones and weak devices to stay smooth.
export const SLICES_DESKTOP = 16;
export const SLICES_LIGHT = 10;

// Photo guidance shown in the admin panel.
export const PHOTO_HINT =
  "Portrait photo, 3:4 ratio (e.g. 900 x 1200), face in the upper half, JPG/PNG/WebP up to 5MB.";

// Next.js image optimizer URL for local images (tiles are small, so 640px is plenty).
export function optimizedSrc(src: string) {
  return src.startsWith("/")
    ? `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`
    : src;
}
