import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { festival2026Seeds } from "./seed-2026";
import { reference2026Events } from "./reference-2026";
import { thumbnailForTitle } from "./thumbnails";
import {
  istDateTimeLocalToUtc,
  sortEvents,
  utcToIstDateTimeLocal,
} from "./format";
import {
  cleanedRules,
  eventToInput,
  slugify,
  type EventDay,
  type EventInput,
  type EventRecord,
  type EventStatus,
} from "./types";

export const EVENTS_TAG = "events";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

type NewEventColumns = {
  day: number | null;
  theme: string | null;
  starts_at: string | null;
  rules: string[] | null;
  whatsapp_url: string | null;
  is_published: boolean | null;
};

type EventRow = NewEventColumns & {
  id: string;
  slug: string;
  heading: string | null;
  description: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  image_url: string | null;
  image_alt: string | null;
  event_name: string | null;
  location: string | null;
  category: string | null;
  action_label: string | null;
  action_type: string | null;
  action_url: string | null;
  status: string | null;
  featured: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type LegacyEventRow = NewEventColumns & {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  category: string | null;
  venue: string | null;
  start_at: string | null;
  end_at: string | null;
  countdown_at: string | null;
  show_countdown: boolean | null;
  is_featured: boolean | null;
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

function eventDay(row: { day?: number | null; date?: string | null }): EventDay {
  if (row.day === 1 || row.day === 2) return row.day;
  if (row.date === "2025-12-19") return 1;
  return 2;
}

function startsAtFromLegacy(date: string | null, startTime: string | null): string | null {
  if (!date || !startTime) return null;
  return istDateTimeLocalToUtc(`${date}T${startTime}`);
}

function safeWhatsappUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return value.startsWith("https://chat.whatsapp.com/") || value.startsWith("https://wa.me/")
      ? value
      : null;
  } catch {
    return null;
  }
}

function fromLegacyRow(row: LegacyEventRow): EventRecord {
  const title = row.title || "Untitled event";
  const now = new Date().toISOString();
  const startsAt = row.starts_at ?? row.start_at ?? startsAtFromLegacy(null, null);
  return {
    id: row.id,
    slug: row.slug,
    title,
    day: eventDay(row),
    theme: row.theme ?? "",
    startsAt,
    rules: Array.isArray(row.rules) ? row.rules : [],
    whatsappUrl: safeWhatsappUrl(row.whatsapp_url ?? null),
    isPublished: row.is_published ?? false,
    heading: title,
    description: row.description ?? "",
    date: row.start_at?.slice(0, 10) ?? "",
    startTime: row.start_at?.slice(11, 16) ?? "",
    endTime: row.end_at?.slice(11, 16) || undefined,
    imageUrl: row.image_url ?? row.thumbnail_url ?? undefined,
    imageAlt: undefined,
    eventName: title,
    location: row.venue ?? "TBA",
    category: row.category ?? "General",
    actionLabel: undefined,
    actionType: "none",
    actionUrl: undefined,
    status: row.is_published ? "published" : "draft",
    featured: Boolean(row.is_featured),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? now,
  };
}

function fromRow(row: EventRow): EventRecord {
  const title = row.event_name || row.heading || "Untitled event";
  const now = new Date().toISOString();
  return {
    id: row.id,
    slug: row.slug,
    title,
    day: eventDay(row),
    theme: row.theme ?? "",
    startsAt:
      row.starts_at !== undefined ? row.starts_at : startsAtFromLegacy(row.date, row.start_time),
    rules: Array.isArray(row.rules) ? row.rules : [],
    whatsappUrl: safeWhatsappUrl(row.whatsapp_url ?? null),
    isPublished: row.is_published ?? row.status === "published",
    heading: row.heading ?? title,
    description: row.description ?? "",
    date: row.date ?? "",
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    eventName: title,
    location: row.location ?? "TBA",
    category: row.category ?? "General",
    actionLabel: row.action_label ?? undefined,
    actionType:
      row.action_type === "link" || row.action_type === "calendar"
        ? row.action_type
        : "none",
    actionUrl: row.action_url ?? undefined,
    status: row.status === "published" ? "published" : "draft",
    featured: Boolean(row.featured),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? now,
  };
}

function fromStoredRow(row: StoredEventRow): EventRecord {
  return isLegacyRow(row) ? fromLegacyRow(row) : fromRow(row);
}

function derivedLegacy(input: EventInput): { date: string; startTime: string } {
  const local = utcToIstDateTimeLocal(input.startsAt);
  const [date, startTime] = local ? local.split("T") : ["", ""];
  return {
    date: input.date ?? date,
    startTime: input.startTime ?? startTime,
  };
}

function toRow(input: EventInput) {
  const { date, startTime } = derivedLegacy(input);
  const title = input.title;
  return {
    day: input.day,
    theme: input.theme || null,
    starts_at: input.startsAt,
    rules: cleanedRules(input.rules),
    whatsapp_url: input.whatsappUrl,
    is_published: input.isPublished,
    slug: input.eventName ? slugify(input.eventName) : slugify(title),
    heading: input.heading ?? title,
    description: input.description ?? input.theme ?? "",
    date: date || null,
    start_time: startTime || null,
    end_time: input.endTime || null,
    image_url: input.imageUrl || null,
    image_alt: input.imageAlt ?? `${title} thumbnail`,
    event_name: input.eventName ?? title,
    location: input.location ?? "TBA",
    category: input.category ?? "General",
    action_label: input.actionLabel || null,
    action_type: input.actionType ?? "none",
    action_url: input.actionUrl || null,
    status: input.status ?? (input.isPublished ? "published" : "draft"),
    featured: input.featured ?? false,
    sort_order: input.sortOrder,
  };
}

function toLegacyRow(input: EventInput, slug?: string) {
  const { date, startTime } = derivedLegacy(input);
  const title = input.title;
  return {
    ...(slug ? { slug } : {}),
    day: input.day,
    theme: input.theme || null,
    starts_at: input.startsAt,
    rules: cleanedRules(input.rules),
    whatsapp_url: input.whatsappUrl,
    is_published: input.isPublished,
    title,
    description: input.description ?? input.theme ?? "",
    category: input.category ?? "General",
    venue: input.location ?? "TBA",
    start_at: input.startsAt ?? `${date}T${startTime || "00:00"}:00.000Z`,
    end_at: null,
    countdown_at: null,
    show_countdown: false,
    is_featured: input.featured ?? false,
    image_url: input.imageUrl || null,
    thumbnail_url: input.imageUrl || null,
    sort_order: input.sortOrder,
  };
}

function toRecord(input: EventInput, id: string, slug: string, now: string): EventRecord {
  const { date, startTime } = derivedLegacy(input);
  const title = input.title;
  return {
    id,
    slug,
    title,
    day: input.day,
    theme: input.theme,
    startsAt: input.startsAt,
    rules: cleanedRules(input.rules),
    whatsappUrl: input.whatsappUrl,
    isPublished: input.isPublished,
    heading: input.heading ?? title,
    description: input.description ?? input.theme ?? "",
    date,
    startTime,
    endTime: input.endTime || undefined,
    imageUrl: input.imageUrl || undefined,
    imageAlt: input.imageAlt ?? `${title} thumbnail`,
    eventName: input.eventName ?? title,
    location: input.location ?? "TBA",
    category: input.category ?? "General",
    actionLabel: input.actionLabel,
    actionType: input.actionType ?? "none",
    actionUrl: input.actionUrl,
    status: input.status ?? (input.isPublished ? "published" : "draft"),
    featured: input.featured ?? false,
    sortOrder: input.sortOrder,
    createdAt: now,
    updatedAt: now,
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

/* Local JSON fallback (development / no Supabase env configured) */

async function readLocal(): Promise<EventRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as EventRecord[];
    if (!Array.isArray(parsed)) return localSeedEvents();
    return parsed.map((event) => normalizeLocalEvent(event));
  } catch {
    const events = localSeedEvents();
    await writeLocal(events);
    return events;
  }
}

function localSeedEvents(): EventRecord[] {
  const now = new Date().toISOString();
  const festivalRecords = festival2026Seeds.map((seed, index) => {
    const input: EventInput = {
      title: seed.title,
      day: seed.day,
      theme: seed.theme,
      startsAt: null,
      rules: seed.rules,
      whatsappUrl: seed.whatsappUrl ?? null,
      isPublished: false,
      sortOrder: seed.sortOrder,
      imageUrl: seed.thumbnail,
    };
    return toRecord(
      input,
      `20260000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      `2026-${slugify(seed.title)}`,
      now
    );
  });

  // The reference Events tab adds 21 published cards. Keep them alongside the
  // 23 drafts so the admin list is unchanged and the public page has data even
  // before the seed script is run.
  const referenceRecords = reference2026Events.map((event) => {
    const input: EventInput = {
      title: event.eventName,
      day: event.heading === "Day 1" ? 1 : 2,
      theme: "",
      startsAt: null,
      rules: event.rules,
      whatsappUrl: event.whatsappUrl,
      isPublished: true,
      sortOrder: event.sortOrder,
      heading: event.heading,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      imageUrl: event.imageUrl,
      imageAlt: event.imageAlt,
      eventName: event.eventName,
      location: event.location,
      category: event.category,
      actionType: event.actionType,
      status: "published",
      featured: event.featured,
    };
    return {
      ...toRecord(input, event.id, event.slug, now),
      dateTbd: event.dateTbd,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  });

  return [...festivalRecords, ...referenceRecords];
}

/** Older local files may contain only the original card fields. */
function normalizeLocalEvent(event: EventRecord): EventRecord {
  const title = event.title || event.eventName || event.heading || "Untitled event";
  return {
    ...event,
    title,
    day: event.day === 1 || event.day === 2 ? event.day : event.date === "2025-12-19" ? 1 : 2,
    theme: event.theme ?? "",
    startsAt:
      event.startsAt !== undefined ? event.startsAt : startsAtFromLegacy(event.date, event.startTime),
    rules: Array.isArray(event.rules) ? event.rules : [],
    whatsappUrl: safeWhatsappUrl(event.whatsappUrl ?? null),
    isPublished: event.isPublished ?? event.status === "published",
    dateTbd: event.dateTbd,
    imageUrl: event.imageUrl || thumbnailForTitle(title),
    imageAlt: event.imageAlt || `${title} thumbnail`,
  };
}

async function writeLocal(events: EventRecord[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), "utf8");
  } catch {
    // Read-only filesystem (e.g. Vercel). Supabase must be configured there.
  }
}

/* Public API */

async function loadPublishedEvents(): Promise<EventRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const local = await readLocal();
    return sortEvents(local.filter((event) => event.isPublished));
  }

  // Production may have Supabase configured before the events seed is applied.
  // In that case the table is empty (or the migration is not live yet), so fall
  // back to the bundled reference records instead of showing an empty tab.
  // If any real rows exist, they remain authoritative.
  try {
    const { data, error } = await supabase.from("events").select("*");
    if (error) throw new Error(error.message);
    const events = (data ?? []).map((row) => fromStoredRow(row as StoredEventRow));
    if (events.length > 0) {
      return sortEvents(events.filter((event) => event.isPublished));
    }
  } catch {
    // handled below by the bundled fallback
  }
  return sortEvents(localSeedEvents().filter((event) => event.isPublished));
}

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

async function uniqueSlug(title: string): Promise<string> {
  const root = slugify(title) || "event";
  const existing = await listAllEvents();
  if (!existing.some((event) => event.slug === root)) return root;
  return `${root}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createEvent(input: EventInput): Promise<EventRecord> {
  const slug = await uniqueSlug(input.title);
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const schema = await eventsSchema(supabase);
    const row = schema === "modern" ? { ...toRow(input), slug } : toLegacyRow(input, slug);
    const { data, error } = await supabase
      .from("events")
      .insert(row as Record<string, unknown>)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromStoredRow(data as StoredEventRow);
  }

  const local = await readLocal();
  const event = toRecord(input, crypto.randomUUID(), slug, now);
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
    ...toRecord(input, local[index].id, local[index].slug, local[index].createdAt),
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

export async function setEventStatus(id: string, status: EventStatus): Promise<EventRecord> {
  const current = await getEventById(id);
  if (!current) throw new Error("Event not found");
  return updateEvent(id, {
    ...eventToInput(current),
    status,
    isPublished: status === "published",
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
