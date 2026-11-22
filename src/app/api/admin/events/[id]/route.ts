import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/events/auth";
import { deleteEvent, EVENTS_TAG, getEventById, updateEvent } from "@/lib/events/store";
import { eventInputSchema } from "@/lib/events/types";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const { id } = await context.params;
  const existing = await getEventById(id);
  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = eventInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const event = await updateEvent(id, parsed.data);
    revalidatePath("/events");
    revalidateTag(EVENTS_TAG);
    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update event." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const { id } = await context.params;
  const existing = await getEventById(id);
  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  try {
    await deleteEvent(id);
    revalidatePath("/events");
    revalidateTag(EVENTS_TAG);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete event." },
      { status: 500 }
    );
  }
}
