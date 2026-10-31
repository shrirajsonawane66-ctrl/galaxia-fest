import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sampleEvents } from "./seed";
import { sortEvents } from "./format";
import { slugify, type EventInput, type EventRecord, type EventStatus } from "./types";

export const EVENTS_TAG = "events";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

type EventRow = {
  id: string;
  slug: string;
  heading: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  image_url: string | null;
  image_alt: string | null;
  event_name: string;
  location: string;
  category: string;
  action_label: string | null;
  action_type: string | null;
  action_url: string | null;
  status: string | null;
  featured: boolean | null;
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

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function fromRow(row: EventRow): EventRecord {
  return {
    id: row.id,
    slug: row.slug,
    heading: row.heading,
    description: row.description,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    eventName: row.event_name,
    location: row.location,
    category: row.category,
    actionLabel: row.action_label ?? undefined,
    actionType:
      row.action_type === "link" || row.action_type === "calendar"
        ? row.action_type
        : "none",
    actionUrl: row.action_url ?? undefined,
    status: row.status === "published" ? "published" : "draft",
    featured: Boolean(row.featured),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function toRow(input: EventInput) {
  return {
    heading: input.heading,
    description: input.description,
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime || null,
    image_url: input.imageUrl || null,
    image_alt: input.imageAlt || null,
    event_name: input.eventName,
    location: input.location,
    category: input.category,
    action_label: input.actionLabel || null,
    action_type: input.actionType,
    action_url: input.actionUrl || null,
    status: input.status,
    featured: input.featured,
    sort_order: input.sortOrder,
  };
}

/* ------------------------------------------------------------------ */
/* Local JSON fallback (development / no Supabase env configured)      */
/* ------------------------------------------------------------------ */

async function readLocal(): Promise<EventRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as EventRecord[];
    return Array.isArray(parsed) ? parsed : sampleEvents;
  } catch {
    await writeLocal(sampleEvents);
    return sampleEvents;
  }
}

async function writeLocal(events: EventRecord[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), "utf8");
  } catch {
    // Read-only filesystem (e.g. Vercel). Supabase must be configured in production.
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

async function loadPublishedEvents(): Promise<EventRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const local = await readLocal();
    return sortEvents(local.filter((event) => event.status === "published"));
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Could not load events: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as EventRow));
}

/**
 * Cached read for the public site and public API. Every admin mutation calls
 * revalidateTag(EVENTS_TAG), so edits still appear immediately; the 60s window
 * only bounds staleness if a write bypasses the API routes.
 */
export const listPublishedEvents = unstable_cache(
  loadPublishedEvents,
  ["published-events"],
  { tags: [EVENTS_TAG], revalidate: 60 }
);

export async function listAllEvents(): Promise<EventRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return sortEvents(await readLocal());

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Could not load events: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as EventRow));
}

export async function getEventById(id: string): Promise<EventRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const local = await readLocal();
    return local.find((event) => event.id === id) ?? null;
  }

  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load event: ${error.message}`);
  return data ? fromRow(data as EventRow) : null;
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "event";
  const existing = await listAllEvents();
  if (!existing.some((event) => event.slug === root)) return root;
  return `${root}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createEvent(input: EventInput): Promise<EventRecord> {
  const slug = await uniqueSlug(input.eventName);
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("events")
      .insert({ ...toRow(input), slug })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromRow(data as EventRow);
  }

  const local = await readLocal();
  const event: EventRecord = {
    ...input,
    id: crypto.randomUUID(),
    slug,
    createdAt: now,
    updatedAt: now,
  };
  await writeLocal([...local, event]);
  return event;
}

export async function updateEvent(id: string, input: EventInput): Promise<EventRecord> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("events")
      .update({ ...toRow(input), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Event not found");
    return fromRow(data as EventRow);
  }

  const local = await readLocal();
  const index = local.findIndex((event) => event.id === id);
  if (index === -1) throw new Error("Event not found");
  const next: EventRecord = {
    ...local[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  local[index] = next;
  await writeLocal(local);
  return next;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }

  const local = await readLocal();
  await writeLocal(local.filter((event) => event.id !== id));
}

export async function setEventStatus(
  id: string,
  status: EventStatus
): Promise<EventRecord> {
  const current = await getEventById(id);
  if (!current) throw new Error("Event not found");
  return updateEvent(id, {
    heading: current.heading,
    description: current.description,
    date: current.date,
    startTime: current.startTime,
    endTime: current.endTime,
    imageUrl: current.imageUrl,
    imageAlt: current.imageAlt,
    eventName: current.eventName,
    location: current.location,
    category: current.category,
    actionLabel: current.actionLabel,
    actionType: current.actionType,
    actionUrl: current.actionUrl,
    status,
    featured: current.featured,
    sortOrder: current.sortOrder,
  });
}

export async function reorderEvents(
  orders: Array<{ id: string; sortOrder: number }>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const results = await Promise.all(
      orders.map((order) =>
        supabase
          .from("events")
          .update({ sort_order: order.sortOrder, updated_at: new Date().toISOString() })
          .eq("id", order.id)
      )
    );
    const failure = results.find((result) => result.error);
    if (failure?.error) throw new Error(failure.error.message);
    return;
  }

  const local = await readLocal();
  for (const order of orders) {
    const event = local.find((item) => item.id === order.id);
    if (event) {
      event.sortOrder = order.sortOrder;
      event.updatedAt = new Date().toISOString();
    }
  }
  await writeLocal(local);
}
