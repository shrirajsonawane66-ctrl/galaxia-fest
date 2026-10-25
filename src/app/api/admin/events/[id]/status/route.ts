import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/events/auth";
import { EVENTS_TAG, setEventStatus } from "@/lib/events/store";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ status: z.enum(["draft", "published"]) });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status must be draft or published." }, { status: 422 });
  }

  try {
    const event = await setEventStatus(id, parsed.data.status);
    revalidatePath("/events");
    revalidateTag(EVENTS_TAG);
    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update status.";
    return NextResponse.json(
      { error: message },
      { status: message === "Event not found" ? 404 : 500 }
    );
  }
}
