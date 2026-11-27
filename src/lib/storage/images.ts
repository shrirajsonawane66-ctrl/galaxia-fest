import "server-only";

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

export const PERFORMER_IMAGE_BUCKET = "performer-images";
export const EVENT_IMAGE_BUCKET = "event-thumbnails";

export type ImageBucket =
  | typeof PERFORMER_IMAGE_BUCKET
  | typeof EVENT_IMAGE_BUCKET;

/**
 * Server-side client used for Storage writes. Prefer the service-role key when
 * it is configured. Otherwise fall back to the signed-in admin's session — the
 * bucket policies allow authenticated admins to write, so this also works when
 * only the public Supabase keys are available.
 *
 * Returns null when Supabase is not configured (local development without env),
 * in which case callers fall back to the local filesystem.
 */
async function getStorageClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return supabase;
  } catch {
    return null;
  }
}

/**
 * Uploads bytes to a public Supabase Storage bucket and returns the public URL.
 * Returns null when Supabase is not configured, which signals the caller to use
 * the local filesystem fallback (development only).
 */
export async function uploadPublicImage(
  bucket: ImageBucket,
  storagePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  const supabase = await getStorageClient();
  if (!supabase) return null;

  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

/** True when `url` points at an object in the given public bucket. */
export function isPublicStorageUrl(bucket: ImageBucket, url: string): boolean {
  return url.includes(`/storage/v1/object/public/${bucket}/`);
}

/** Best-effort delete of an object referenced by a public Storage URL. */
export async function removePublicImageByUrl(
  bucket: ImageBucket,
  url: string
): Promise<void> {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;

  const objectPath = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
  if (!objectPath) return;

  const supabase = await getStorageClient();
  if (!supabase) return;

  const { error } = await supabase.storage.from(bucket).remove([objectPath]);
  if (error) throw new Error(`Image delete failed: ${error.message}`);
}
