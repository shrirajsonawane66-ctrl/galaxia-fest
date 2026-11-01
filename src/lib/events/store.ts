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

type LegacyEventRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  start_at: string;
  end_at: string | null;
  countdown_at: string | null;
  show_countdown: boolean | null;
  is_featured: boolean | null;
  is_published: boolean | null;
  image_url: string | null;
  thumbnail_url: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type StoredEventRow = EventRow | LegacyEventRow;

type EventsSchema = "modern" | "legacy";
let cachedSchema: EventsSchema | null = null;

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

function isLegacyRow(row: StoredEventRow): row is LegacyEventRow {
  return "start_at" in row && !("heading" in row);
}

function clockFromTimestamp(value: string | null): string | undefined {
  if (!value) return undefined;
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match ? match[1] : undefined;
}

function fromLegacyRow(row: LegacyEventRow): EventRecord {
  const title = row.title;
  return {
    id: row.id,
    slug: row.slug,
    heading: title,
    description: row.description,
    date: row.start_at.slice(0, 10),
    startTime: clockFromTimestamp(row.start_at) ?? "00:00",
    endTime: clockFromTimestamp(row.end_at),
    imageUrl: row.image_url ?? row.thumbnail_url ?? undefined,
    imageAlt: undefined,
    eventName: title,
    location: row.venue,
    category: row.category,
    actionLabel: undefined,
    actionType: "none",
    actionUrl: undefined,
    status: row.is_published ? "published" : "draft",
    featured: Boolean(row.is_featured),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
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

function fromStoredRow(row: StoredEventRow): EventRecord {
  return isLegacyRow(row) ? fromLegacyRow(row) : fromRow(row);
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

function toLegacyRow(input: EventInput, slug?: string) {
  return {
    ...(slug ? { slug } : {}),
    title: input.eventName || input.heading,
    description: input.description,
    category: input.category,
    venue: input.location,
    start_at: `${input.date}T${input.startTime}:00.000Z`,
    end_at: input.endTime ? `${input.date}T${input.endTime}:00.000Z` : null,
    countdown_at: null,
    show_countdown: false,
    is_featured: input.featured,
    is_published: input.status === "published",
    image_url: input.imageUrl || null,
    thumbnail_url: input.imageUrl || null,
    sort_order: input.sortOrder,
  };
}

async function detectSchema(supabase: SupabaseClient): Promise<EventsSchema> {
  const { error } = await supabase.from("events").select("heading").limit(0);
  if (!error) return "modern";
  if (error.code === "42703" || error.message.includes("does not exist")) {
    return "legacy";
  }
  throw new Error(`Could not inspect events table: ${error.message}`);
}

async function eventsSchema(supabase: SupabaseClient): Promise<EventsSchema> {
  if (cachedSchema) return cachedSchema;
  try {
    cachedSchema = await detectSchema(supabase);
    return cachedSchema;
  } catch (error) {
    cachedSchema = null;
    throw error;
  }
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

  const { data, error } = await supabase.from("events").select("*");

  if (error) throw new Error(`Could not load events: ${error.message}`);
  const events = (data ?? []).map((row) => fromStoredRow(row as StoredEventRow));
  return sortEvents(events.filter((event) => event.status === "published"));
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

  const { data, error } = await supabase.from("events").select("*");

  if (error) throw new Error(`Could not load events: ${error.message}`);
  return sortEvents((data ?? []).map((row) => fromStoredRow(row as StoredEventRow)));
}

export async function getEventById(id: string): Promise<EventRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const local = await readLocal();
    return local.find((event) => event.id === id) ?? null;
  }

  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load event: ${error.message}`);
  return data ? fromStoredRow(data as StoredEventRow) : null;
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
    const schema = await eventsSchema(supabase);
    const row =
      schema === "modern"
        ? { ...toRow(input), slug }
        : toLegacyRow(input, slug);
    const { data, error } = await supabase
      .from("events")
      .insert(row as Record<string, unknown>)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromStoredRow(data as StoredEventRow);
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
    const schema = await eventsSchema(supabase);
    const updatedAt = new Date().toISOString();
    const row =
      schema === "modern"
        ? { ...toRow(input), updated_at: updatedAt }
        : { ...toLegacyRow(input), updated_at: updatedAt };
    const { data, error } = await supabase
      .from("events")
      .update(row as Record<string, unknown>)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Event not found");
    return fromStoredRow(data as StoredEventRow);
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
