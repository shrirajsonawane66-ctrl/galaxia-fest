import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { samplePerformers } from "./seed";
import { removeStoredPerformerImage } from "./storage";
import {
  toGalleryPerformer,
  type PerformerInput,
  type PerformerRecord,
  type PerformerStatus,
} from "./types";
import type { Performer } from "../performers";

export const PERFORMERS_TAG = "performers";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "performers.json");

type PerformerRow = {
  id: string;
  name: string;
  year: number | null;
  role: string;
  image: string | null;
  status: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fromRow(row: PerformerRow): PerformerRecord {
  return {
    id: row.id,
    name: row.name,
    year: row.year ?? new Date().getFullYear(),
    role: row.role,
    image: row.image ?? "",
    status: row.status === "published" ? "published" : "draft",
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function toRow(input: PerformerInput) {
  return {
    name: input.name,
    year: input.year,
    role: input.role,
    image: input.image,
    status: input.status,
  };
}

function sortForAdmin(performers: PerformerRecord[]): PerformerRecord[] {
  return [...performers].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return a.sortOrder - b.sortOrder;
  });
}

function sortForPublic(performers: PerformerRecord[]): PerformerRecord[] {
  return [...performers].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return b.year - a.year;
  });
}

/* ------------------------------------------------------------------ */
/* Local JSON fallback (development / no Supabase env configured)      */
/* ------------------------------------------------------------------ */

async function readLocal(): Promise<PerformerRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as PerformerRecord[];
    return Array.isArray(parsed) ? parsed : samplePerformers;
  } catch {
    await writeLocal(samplePerformers);
    return samplePerformers;
  }
}

async function writeLocal(performers: PerformerRecord[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(performers, null, 2), "utf8");
  } catch {
    // Read-only filesystem (e.g. Vercel). Supabase must be configured in production.
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function listPublishedPerformers(): Promise<PerformerRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const local = await readLocal();
    return sortForPublic(local.filter((performer) => performer.status === "published"));
  }

  const { data, error } = await supabase
    .from("performers")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("year", { ascending: false });

  if (error) throw new Error(`Could not load performers: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as PerformerRow));
}

export async function listAllPerformers(): Promise<PerformerRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return sortForAdmin(await readLocal());

  const { data, error } = await supabase
    .from("performers")
    .select("*")
    .order("year", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Could not load performers: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as PerformerRow));
}

export async function getPerformerById(id: string): Promise<PerformerRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const local = await readLocal();
    return local.find((performer) => performer.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("performers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load performer: ${error.message}`);
  return data ? fromRow(data as PerformerRow) : null;
}

export async function getPerformersByIds(ids: string[]): Promise<PerformerRecord[]> {
  if (ids.length === 0) return [];

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const local = await readLocal();
    return local.filter((performer) => ids.includes(performer.id));
  }

  const { data, error } = await supabase.from("performers").select("*").in("id", ids);
  if (error) throw new Error(`Could not load performers: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as PerformerRow));
}

async function nextSortOrder(): Promise<number> {
  const all = await listAllPerformers();
  return all.reduce((max, performer) => Math.max(max, performer.sortOrder), 0) + 1;
}

export async function createPerformer(input: PerformerInput): Promise<PerformerRecord> {
  const now = new Date().toISOString();
  const sortOrder = await nextSortOrder();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("performers")
      .insert({ ...toRow(input), sort_order: sortOrder })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromRow(data as PerformerRow);
  }

  const local = await readLocal();
  const performer: PerformerRecord = {
    ...input,
    id: crypto.randomUUID(),
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
  await writeLocal([...local, performer]);
  return performer;
}

export async function updatePerformer(
  id: string,
  input: PerformerInput
): Promise<PerformerRecord> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("performers")
      .update({ ...toRow(input), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Performer not found");
    return fromRow(data as PerformerRow);
  }

  const local = await readLocal();
  const index = local.findIndex((performer) => performer.id === id);
  if (index === -1) throw new Error("Performer not found");
  const next: PerformerRecord = {
    ...local[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  local[index] = next;
  await writeLocal(local);
  return next;
}

export async function deletePerformer(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("performers").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }

  const local = await readLocal();
  await writeLocal(local.filter((performer) => performer.id !== id));
}

export async function deletePerformers(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("performers").delete().in("id", ids);
    if (error) throw new Error(error.message);
    return;
  }

  const local = await readLocal();
  await writeLocal(local.filter((performer) => !ids.includes(performer.id)));
}

export async function setPerformerStatus(
  id: string,
  status: PerformerStatus
): Promise<PerformerRecord> {
  const current = await getPerformerById(id);
  if (!current) throw new Error("Performer not found");
  return updatePerformer(id, {
    name: current.name,
    year: current.year,
    role: current.role,
    image: current.image,
    status,
  });
}

export async function reorderPerformers(ids: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.rpc("reorder_performers", { p_ids: ids });
    if (error) throw new Error(error.message);
    return;
  }

  const local = await readLocal();
  const positions = new Map(ids.map((id, index) => [id, index + 1]));
  for (const performer of local) {
    const nextOrder = positions.get(performer.id);
    if (nextOrder !== undefined) {
      performer.sortOrder = nextOrder;
      performer.updatedAt = new Date().toISOString();
    }
  }
  await writeLocal(local);
}

/**
 * Deletes a stored upload only when no other performer references it. This
 * keeps duplicated rows (which share an image path) from breaking each other.
 */
export async function removeUnusedPerformerImage(image?: string): Promise<void> {
  if (!image) return;
  const all = await listAllPerformers();
  if (all.some((performer) => performer.image === image)) return;
  await removeStoredPerformerImage(image);
}

/* ------------------------------------------------------------------ */
/* Homepage cache — admin writes call revalidateTag(PERFORMERS_TAG)     */
/* ------------------------------------------------------------------ */

export const getCachedPublishedPerformers = unstable_cache(
  async (): Promise<PerformerRecord[]> => listPublishedPerformers(),
  ["performers-published"],
  { tags: [PERFORMERS_TAG], revalidate: 60 }
);

export async function getPublishedGalleryPerformers(): Promise<Performer[]> {
  const records = await getCachedPublishedPerformers();
  return records.map(toGalleryPerformer);
}
