import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/events/auth";
import { EVENTS_TAG, reorderEvents } from "@/lib/events/store";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orders: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0).max(9999),
      })
    )
    .min(1),
});

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

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reorder payload." }, { status: 422 });
  }

  try {
    await reorderEvents(parsed.data.orders);
    revalidatePath("/events");
    revalidateTag(EVENTS_TAG);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reorder events." },
      { status: 500 }
    );
  }
}
