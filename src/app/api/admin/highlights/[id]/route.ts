import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/performers/auth";
import { updateHighlight, deleteHighlight, HIGHLIGHTS_TAG } from "@/lib/highlights/store";

export const dynamic = "force-dynamic";

const currentYear = new Date().getFullYear();

const schema = z.object({
  artist_name: z.string().trim().min(1).max(80).optional(),
  edition_year: z.number().int().min(2000).max(currentYear + 1).nullable().optional(),
  caption: z.string().trim().max(120).nullable().optional(),
  image_url: z.string().url().optional(),
  image_path: z.string().min(1).optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const { id } = await params;

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
    const highlight = await updateHighlight(id, parsed.data);
    revalidatePath("/");
    revalidateTag(HIGHLIGHTS_TAG);
    return NextResponse.json({ highlight });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update highlight." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const { id } = await params;

  try {
    await deleteHighlight(id);
    revalidatePath("/");
    revalidateTag(HIGHLIGHTS_TAG);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete highlight." },
      { status: 500 }
    );
  }
}