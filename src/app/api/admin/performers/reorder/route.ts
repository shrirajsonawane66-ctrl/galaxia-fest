import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/performers/auth";
import { PERFORMERS_TAG, reorderPerformers } from "@/lib/performers/store";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(500)
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
      { error: "Invalid reorder payload.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    await reorderPerformers(parsed.data.ids);
    revalidatePath("/");
    revalidateTag(PERFORMERS_TAG);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not reorder performers.",
      },
      { status: 500 }
    );
  }
}
