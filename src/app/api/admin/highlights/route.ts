import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/performers/auth";
import {
  createHighlight,
  listAllHighlights,
  HIGHLIGHTS_TAG,
} from "@/lib/highlights/store";

export const dynamic = "force-dynamic";

const currentYear = new Date().getFullYear();

const schema = z.object({
  artist_name: z.string().trim().min(1).max(80),
  edition_year: z.number().int().min(2000).max(currentYear + 1).nullable().optional(),
  caption: z.string().trim().max(120).nullable().optional(),
  image_url: z.string().url(),
  image_path: z.string().min(1),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  try {
    const highlights = await listAllHighlights();
    return NextResponse.json({ highlights });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load highlights." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const highlight = await createHighlight({
      artist_name: parsed.data.artist_name,
      edition_year: parsed.data.edition_year ?? null,
      caption: parsed.data.caption ?? null,
      image_url: parsed.data.image_url,
      image_path: parsed.data.image_path,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
    });
    revalidatePath("/");
    revalidateTag(HIGHLIGHTS_TAG);
    return NextResponse.json({ highlight }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create highlight." },
      { status: 500 }
    );
  }
}