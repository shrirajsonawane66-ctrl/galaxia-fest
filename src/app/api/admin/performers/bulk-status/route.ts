import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/performers/auth";
import {
  getPerformersByIds,
  PERFORMERS_TAG,
  setPerformerStatus,
} from "@/lib/performers/store";
import { performerStatusSchema } from "@/lib/performers/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(50, "Update 50 or fewer performers at a time")
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate performer ids"),
  status: performerStatusSchema,
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
    return NextResponse.json(
      { error: "Invalid bulk-status payload.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const records = await getPerformersByIds(parsed.data.ids);
  if (records.length !== parsed.data.ids.length) {
    return NextResponse.json(
      { error: "One or more performers no longer exist." },
      { status: 404 }
    );
  }

  if (
    parsed.data.status === "published" &&
    records.some((performer) => !performer.image)
  ) {
    return NextResponse.json(
      { error: "Add a photo before publishing every selected performer." },
      { status: 422 }
    );
  }

  const updated = [];
  for (const id of parsed.data.ids) {
    updated.push(await setPerformerStatus(id, parsed.data.status));
  }

  revalidatePath("/");
  revalidateTag(PERFORMERS_TAG);
  return NextResponse.json({ performers: updated });
}
