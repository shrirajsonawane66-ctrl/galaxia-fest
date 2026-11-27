import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/performers/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  revalidatePath("/");
  revalidateTag("highlights");
  return NextResponse.json({ ok: true });
}