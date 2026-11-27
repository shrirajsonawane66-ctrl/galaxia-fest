import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/performers/auth";
import {
  deletePerformer,
  getPerformerById,
  PERFORMERS_TAG,
  removeUnusedPerformerImage,
  updatePerformer,
} from "@/lib/performers/store";
import { performerInputSchema } from "@/lib/performers/types";

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
  const existing = await getPerformerById(id);
  if (!existing) {
    return NextResponse.json({ error: "Performer not found." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = performerInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const performer = await updatePerformer(id, parsed.data);
    if (existing.image && existing.image !== performer.image) {
      await removeUnusedPerformerImage(existing.image);
    }
    revalidatePath("/");
    revalidateTag(PERFORMERS_TAG);
    return NextResponse.json({ performer });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update performer.",
      },
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
  const existing = await getPerformerById(id);
  if (!existing) {
    return NextResponse.json({ error: "Performer not found." }, { status: 404 });
  }

  try {
    await deletePerformer(id);
    await removeUnusedPerformerImage(existing.image);
    revalidatePath("/");
    revalidateTag(PERFORMERS_TAG);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete performer.",
      },
      { status: 500 }
    );
  }
}
