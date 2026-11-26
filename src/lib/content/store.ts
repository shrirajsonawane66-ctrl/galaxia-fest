import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { defaultSettings, seedContentRows } from "./seed";
import {
  CONTENT_SECTIONS,
  type Announcement,
  type CollectionSection,
  type ContentSection,
  type ContentStatus,
  type Faq,
  type PublicContent,
  type PublicTicket,
  type ScheduleEntry,
  type SiteSettings,
  type SocialLink,
  type Sponsor,
  type TicketCategory,
} from "./types";

export const CONTENT_TAG = "content";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "content.json");

type LocalRow = {
  id: string;
  section: ContentSection;
  data: Record<string, unknown>;
  status: ContentStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ContentRow = {
  id: string;
  section: string;
  data: Record<string, unknown>;
  status: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

async function getSupabaseClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || (!serviceKey && !anonKey)) return null;
  if (serviceKey) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  try {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    return await createServerClient();
  } catch {
    return createClient(url, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}

async function readLocal(): Promise<LocalRow[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as LocalRow[];
    if (!Array.isArray(parsed)) throw new Error("Invalid content store");
    return parsed;
  } catch {
    await writeLocal(seedContentRows);
    return seedContentRows;
  }
}

async function writeLocal(rows: LocalRow[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch {
    return;
  }
}

function fromRow(row: ContentRow): LocalRow {
  const section = (CONTENT_SECTIONS as readonly string[]).includes(row.section)
    ? (row.section as ContentSection)
    : "settings";
  return {
    id: row.id,
    section,
    data: row.data ?? {},
    status: row.status === "published" ? "published" : "draft",
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function toRow(row: LocalRow) {
  return {
    id: row.id,
    section: row.section,
    data: row.data,
    status: row.status,
    sort_order: row.sortOrder,
  };
}

async function readAll(): Promise<LocalRow[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) return readLocal();
  const { data, error } = await supabase.from("site_content").select("*");
  if (error) throw new Error(`Could not load site content: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as ContentRow));
}

function published<T extends { id: string }>(rows: LocalRow[], section: ContentSection): T[] {
  return rows
    .filter((row) => row.section === section && row.status === "published")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({ id: row.id, ...row.data }) as T);
}

function settingsFrom(rows: LocalRow[]): SiteSettings {
  const row = rows.find((item) => item.section === "settings");
  return { ...defaultSettings, ...(row?.data as Partial<SiteSettings>) };
}

async function loadPublicContent(): Promise<PublicContent> {
  const rows = await readAll();
  const settings = settingsFrom(rows);
  const tickets = published<TicketCategory>(rows, "tickets").map(
    ({ price, ...ticket }): PublicTicket =>
      settings.showPrices ? { ...ticket, price } : ticket
  );

  return {
    settings,
    schedule: published<ScheduleEntry>(rows, "schedule"),
    sponsors: published<Sponsor>(rows, "sponsors"),
    faqs: published<Faq>(rows, "faqs"),
    socials: published<SocialLink>(rows, "socials"),
    announcements: published<Announcement>(rows, "announcements"),
    tickets,
  };
}

export const getPublicContent = unstable_cache(
  loadPublicContent,
  ["site-content-public"],
  { tags: [CONTENT_TAG], revalidate: 60 }
);

export async function getSettings(): Promise<SiteSettings> {
  return settingsFrom(await readAll());
}

export async function listContent(section: ContentSection): Promise<LocalRow[]> {
  const rows = await readAll();
  return rows
    .filter((row) => row.section === section)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getContentRow(
  section: ContentSection,
  id: string
): Promise<LocalRow | null> {
  const rows = await readAll();
  return rows.find((row) => row.section === section && row.id === id) ?? null;
}

export async function saveSettings(input: SiteSettings): Promise<SiteSettings> {
  const now = new Date().toISOString();
  const row: LocalRow = {
    id: "settings",
    section: "settings",
    data: { ...input },
    status: "published",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
  const supabase = await getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("site_content").upsert({
      id: row.id,
      section: row.section,
      data: row.data,
      status: row.status,
      sort_order: row.sortOrder,
    });
    if (error) throw new Error(error.message);
    return input;
  }
  const local = await readLocal();
  const index = local.findIndex((item) => item.id === "settings");
  if (index === -1) local.push(row);
  else local[index] = row;
  await writeLocal(local);
  return input;
}

export async function createContent(
  section: CollectionSection,
  input: Record<string, unknown>
): Promise<LocalRow> {
  const now = new Date().toISOString();
  const row: LocalRow = {
    id: crypto.randomUUID(),
    section,
    data: { ...input },
    status: input.status === "published" ? "published" : "draft",
    sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : 0,
    createdAt: now,
    updatedAt: now,
  };
  delete (row.data as Record<string, unknown>).status;
  delete (row.data as Record<string, unknown>).sortOrder;

  const supabase = await getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("site_content")
      .insert(toRow(row))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromRow(data as ContentRow);
  }
  const local = await readLocal();
  await writeLocal([...local, row]);
  return row;
}

export async function updateContent(
  section: CollectionSection,
  id: string,
  input: Record<string, unknown>
): Promise<LocalRow> {
  const current = await getContentRow(section, id);
  if (!current) throw new Error("Entry not found");
  const next: LocalRow = {
    ...current,
    data: { ...input },
    status: input.status === "published" ? "published" : "draft",
    sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : current.sortOrder,
    updatedAt: new Date().toISOString(),
  };
  delete (next.data as Record<string, unknown>).status;
  delete (next.data as Record<string, unknown>).sortOrder;

  const supabase = await getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("site_content")
      .update(toRow(next))
      .eq("id", id)
      .eq("section", section)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Entry not found");
    return fromRow(data as ContentRow);
  }
  const local = await readLocal();
  const index = local.findIndex((item) => item.id === id && item.section === section);
  if (index === -1) throw new Error("Entry not found");
  local[index] = next;
  await writeLocal(local);
  return next;
}

export async function deleteContent(section: CollectionSection, id: string): Promise<void> {
  const supabase = await getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("site_content")
      .delete()
      .eq("id", id)
      .eq("section", section);
    if (error) throw new Error(error.message);
    return;
  }
  const local = await readLocal();
  await writeLocal(local.filter((row) => !(row.id === id && row.section === section)));
}
