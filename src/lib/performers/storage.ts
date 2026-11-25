import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import {
  PERFORMER_IMAGE_BUCKET,
  isPublicStorageUrl,
  removePublicImageByUrl,
} from "@/lib/storage/images";

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
 * Remove an uploaded performer image. Handles both Supabase Storage objects and
 * legacy locally uploaded files. External URLs and the seeded
 * `/images/performers/...` paths are left alone. A missing file is not an
 * error — the database row is still safe to delete.
 */
export async function removeStoredPerformerImage(image?: string): Promise<void> {
  if (!image) return;

  if (isPublicStorageUrl(PERFORMER_IMAGE_BUCKET, image)) {
    try {
      await removePublicImageByUrl(PERFORMER_IMAGE_BUCKET, image);
    } catch {
      // Best-effort cleanup; never block deleting the database row.
    }
    return;
  }

  if (!image.startsWith("/uploads/performers/")) return;

  const filename = path.basename(image);
  if (!filename) return;

  try {
    await fs.unlink(path.join(PERFORMER_UPLOAD_DIR, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
