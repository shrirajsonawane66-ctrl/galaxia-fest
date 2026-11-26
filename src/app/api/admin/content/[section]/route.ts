import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/content/auth";
import { CONTENT_TAG, getSettings, listContent, createContent, saveSettings } from "@/lib/content/store";
import {
  CONTENT_SECTIONS,
  contentSchemas,
  isCollectionSection,
  siteSettingsSchema,
  type ContentSection,
} from "@/lib/content/types";

export const dynamic = "force-dynamic";

function isSection(section: string): section is ContentSection {
  return (CONTENT_SECTIONS as readonly string[]).includes(section);
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidateTag(CONTENT_TAG);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ section: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }
  const { section } = await context.params;
  if (!isSection(section)) {
    return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  }

  if (section === "settings") {
    return NextResponse.json({ settings: await getSettings() });
  }

  const items = (await listContent(section)).map((row) => ({
    id: row.id,
    ...row.data,
    status: row.status,
    sortOrder: row.sortOrder,
  }));
  return NextResponse.json({ items });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ section: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }
  const { section } = await context.params;
  if (!isCollectionSection(section)) {
    return NextResponse.json(
      { error: "This section does not support new entries." },
      { status: 405 }
    );
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
    const row = await createContent(section, parsed.data as Record<string, unknown>);
    refresh();
    return NextResponse.json(
      { item: { id: row.id, ...row.data, status: row.status, sortOrder: row.sortOrder } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create entry." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ section: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }
  const { section } = await context.params;
  if (section !== "settings") {
    return NextResponse.json(
      { error: "Use the entry endpoint to update this section." },
      { status: 405 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = siteSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const settings = await saveSettings(parsed.data);
    refresh();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save settings." },
      { status: 500 }
    );
  }
}
