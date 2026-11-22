import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/events/auth";
import { createEvent, EVENTS_TAG, listAllEvents } from "@/lib/events/store";
import { eventInputSchema } from "@/lib/events/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const events = await listAllEvents();
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
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
    const event = await createEvent(parsed.data);
    revalidatePath("/events");
    revalidateTag(EVENTS_TAG);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create event." },
      { status: 500 }
    );
  }
}
