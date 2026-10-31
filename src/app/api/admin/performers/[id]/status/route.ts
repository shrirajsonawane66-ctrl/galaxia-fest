import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/performers/auth";
import {
  getPerformerById,
  PERFORMERS_TAG,
  setPerformerStatus,
} from "@/lib/performers/store";
import { performerStatusSchema } from "@/lib/performers/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ status: performerStatusSchema });

export async function PATCH(
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

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Status must be draft or published." },
      { status: 422 }
    );
  }

  if (parsed.data.status === "published" && !existing.image) {
    return NextResponse.json(
      { error: "Add a photo before publishing this performer." },
      { status: 422 }
    );
  }

  try {
    const performer = await setPerformerStatus(id, parsed.data.status);
    revalidatePath("/");
    revalidateTag(PERFORMERS_TAG);
    return NextResponse.json({ performer });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update status.",
      },
      { status: 500 }
    );
  }
}
