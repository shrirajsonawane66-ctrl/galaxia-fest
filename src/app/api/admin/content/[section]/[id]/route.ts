import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/content/auth";
import {
  CONTENT_TAG,
  deleteContent,
  getContentRow,
  updateContent,
} from "@/lib/content/store";
import { contentSchemas, isCollectionSection } from "@/lib/content/types";

export const dynamic = "force-dynamic";

const statusSchema = z.object({ status: z.enum(["draft", "published"]) });

function refresh() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/sponsorship");
  revalidateTag(CONTENT_TAG);
}

function shape(row: { id: string; data: Record<string, unknown>; status: string; sortOrder: number }) {
  return { id: row.id, ...row.data, status: row.status, sortOrder: row.sortOrder };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ section: string; id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }
  const { section, id } = await context.params;
  if (!isCollectionSection(section)) {
    return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = contentSchemas[section].safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const row = await updateContent(section, id, parsed.data as Record<string, unknown>);
    refresh();
    return NextResponse.json({ item: shape(row) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update entry.";
    return NextResponse.json(
      { error: message },
      { status: message === "Entry not found" ? 404 : 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ section: string; id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }
  const { section, id } = await context.params;
  if (!isCollectionSection(section)) {
    return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const current = await getContentRow(section, id);
    if (!current) throw new Error("Entry not found");
    const row = await updateContent(section, id, {
      ...current.data,
      status: parsed.data.status,
      sortOrder: current.sortOrder,
    });
    refresh();
    return NextResponse.json({ item: shape(row) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update status.";
    return NextResponse.json(
      { error: message },
      { status: message === "Entry not found" ? 404 : 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ section: string; id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }
  const { section, id } = await context.params;
  if (!isCollectionSection(section)) {
    return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  }

  try {
    await deleteContent(section, id);
    refresh();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete entry." },
      { status: 500 }
    );
  }
}
