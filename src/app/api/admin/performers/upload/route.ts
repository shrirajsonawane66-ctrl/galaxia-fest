import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/performers/auth";
import { PERFORMERS_TAG } from "@/lib/performers/store";
import {
  processAndStorePerformerImage,
  validateImageFile,
} from "@/lib/performers/upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const form = await request.formData();
  const file = form.get("file");
  const name = form.get("name");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const invalid = validateImageFile(file);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 422 });
  }

  try {
    const url = await processAndStorePerformerImage(
      file,
      typeof name === "string" && name.trim() ? name : file.name
    );
    revalidatePath("/");
    revalidateTag(PERFORMERS_TAG);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save the upload. On Vercel the filesystem is read-only — use Supabase Storage or an external image URL.",
      },
      { status: 500 }
    );
  }
}
