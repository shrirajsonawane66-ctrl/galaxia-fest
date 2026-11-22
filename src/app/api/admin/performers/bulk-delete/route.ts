import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/performers/auth";
import {
  deletePerformers,
  getPerformersByIds,
  PERFORMERS_TAG,
  removeUnusedPerformerImage,
} from "@/lib/performers/store";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(50, "Delete 50 or fewer performers at a time")
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate performer ids"),
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
      { error: "Invalid bulk-delete payload.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const records = await getPerformersByIds(parsed.data.ids);
    await deletePerformers(parsed.data.ids);

    const images = Array.from(
      new Set(records.map((performer) => performer.image).filter(Boolean))
    );
    for (const image of images) {
      await removeUnusedPerformerImage(image);
    }

    revalidatePath("/");
    revalidateTag(PERFORMERS_TAG);
    return NextResponse.json({ deleted: records.length });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete performers.",
      },
      { status: 500 }
    );
  }
}
