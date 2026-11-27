import "server-only";

import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Highlight, HighlightInput } from "./types";

export const HIGHLIGHTS_TAG = "highlights";
const getSupabaseAdmin = getSupabaseReadClient;

function getSupabaseReadClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type HighlightRow = {
  id: string;
  artist_name: string;
  edition_year: number | null;
  caption: string | null;
  image_url: string;
  image_path: string;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function fromRow(row: HighlightRow): Highlight {
  return {
    id: row.id,
    artist_name: row.artist_name,
    edition_year: row.edition_year,
    caption: row.caption,
    image_url: row.image_url,
    image_path: row.image_path,
    display_order: row.display_order ?? 0,
    is_active: row.is_active ?? true,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

export async function listPublishedHighlights(): Promise<Highlight[]> {
  const supabase = getSupabaseReadClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load highlights: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as HighlightRow));
}

export async function listAllHighlights(): Promise<Highlight[]> {
  const supabase = getSupabaseReadClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load highlights: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as HighlightRow));
}

export async function createHighlight(input: HighlightInput): Promise<Highlight> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("highlights")
    .insert({
      artist_name: input.artist_name,
      edition_year: input.edition_year,
      caption: input.caption,
      image_url: input.image_url,
      image_path: input.image_path,
      display_order: input.display_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data as HighlightRow);
}

export async function updateHighlight(
  id: string,
  input: Partial<HighlightInput> & { is_active?: boolean; display_order?: number }
): Promise<Highlight> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.artist_name !== undefined) payload.artist_name = input.artist_name;
  if (input.edition_year !== undefined) payload.edition_year = input.edition_year;
  if (input.caption !== undefined) payload.caption = input.caption;
  if (input.image_url !== undefined) payload.image_url = input.image_url;
  if (input.image_path !== undefined) payload.image_path = input.image_path;
  if (input.is_active !== undefined) payload.is_active = input.is_active;
  if (input.display_order !== undefined) payload.display_order = input.display_order;

  const { data, error } = await supabase
    .from("highlights")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data as HighlightRow);
}

export async function deleteHighlight(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase.from("highlights").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reorderHighlights(ids: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await supabase
      .from("highlights")
      .update({ display_order: i + 1, updated_at: new Date().toISOString() })
      .eq("id", ids[i]);
    if (error) throw new Error(error.message);
  }
}

export const getCachedPublishedHighlights = unstable_cache(
  async (): Promise<Highlight[]> => listPublishedHighlights(),
  ["highlights-published"],
  { tags: [HIGHLIGHTS_TAG], revalidate: 60 }
);