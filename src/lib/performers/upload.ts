import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { PERFORMER_UPLOAD_DIR, performerImageUrl } from "./storage";
import { slugify } from "./types";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_BULK_FILES = 20;
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Only JPG, PNG or WebP images are allowed.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Image must be 5MB or smaller.";
  }
  return null;
}

/**
 * Resize the long side to 1200px and store WebP at quality 80. If sharp is
 * unavailable (or cannot decode the file) the original bytes are stored so an
 * upload never fails solely because of the optimiser.
 */
export async function processAndStorePerformerImage(
  file: File,
  nameHint: string
): Promise<string> {
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  try {
    const sharpModule = await import("sharp");
    buffer = await sharpModule
      .default(buffer)
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
    extension = "webp";
  } catch {
    // Store the original when sharp is missing or the image cannot be decoded.
  }

  const safeName = slugify(nameHint) || "performer";
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${safeName}-${unique}.${extension}`;

  await fs.mkdir(PERFORMER_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(PERFORMER_UPLOAD_DIR, filename), buffer);
  return performerImageUrl(filename);
}

/** `my_band-photo.jpg` -> `My Band Photo` (falls back to "Artist"). */
export function titleFromFilename(filename: string): string {
  const base = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const title = base
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  if (title.length < 2) return "Artist";
  return title.slice(0, 60);
}
