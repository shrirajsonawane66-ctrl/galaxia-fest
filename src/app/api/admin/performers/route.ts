import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/performers/auth";
import {
  createPerformer,
  listAllPerformers,
  PERFORMERS_TAG,
} from "@/lib/performers/store";
import {
  performerInputSchema,
  performerStatusSchema,
} from "@/lib/performers/types";

export const dynamic = "force-dynamic";

const currentYear = new Date().getFullYear();

const querySchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(currentYear + 1)
    .optional(),
  role: z.string().trim().min(1).max(40).optional(),
  status: performerStatusSchema.optional(),
  q: z.string().trim().max(60).optional(),
});

export async function GET(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    year: searchParams.get("year") || undefined,
    role: searchParams.get("role") || undefined,
    status: searchParams.get("status") || undefined,
    q: searchParams.get("q") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filters.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    let performers = await listAllPerformers();
    const { year, role, status, q } = parsed.data;

    if (year !== undefined) {
      performers = performers.filter((performer) => performer.year === year);
    }
    if (role) {
      performers = performers.filter(
        (performer) => performer.role.toLowerCase() === role.toLowerCase()
      );
    }
    if (status) {
      performers = performers.filter((performer) => performer.status === status);
    }
    if (q) {
      const needle = q.toLowerCase();
      performers = performers.filter((performer) =>
        performer.name.toLowerCase().includes(needle)
      );
    }

    return NextResponse.json({ performers });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load performers.",
      },
      { status: 500 }
    );
  }
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

  const parsed = performerInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const performer = await createPerformer(parsed.data);
    revalidatePath("/");
    revalidateTag(PERFORMERS_TAG);
    return NextResponse.json({ performer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create performer.",
      },
      { status: 500 }
    );
  }
}
