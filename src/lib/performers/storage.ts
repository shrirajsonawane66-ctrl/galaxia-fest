import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

export const PERFORMER_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "performers"
);

export function performerImageUrl(filename: string): string {
  return `/uploads/performers/${filename}`;
}

/**
 * Remove a locally uploaded performer image. External URLs and the seeded
 * `/images/performers/...` paths are left alone. A missing file is not an
 * error — the database row is still safe to delete.
 */
export async function removeStoredPerformerImage(image?: string): Promise<void> {
  if (!image || !image.startsWith("/uploads/performers/")) return;

  const filename = path.basename(image);
  if (!filename) return;

  try {
    await fs.unlink(path.join(PERFORMER_UPLOAD_DIR, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
