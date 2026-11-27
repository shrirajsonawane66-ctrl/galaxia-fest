import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/performers/auth";
import {
  createPerformer,
  listAllPerformers,
  PERFORMERS_TAG,
} from "@/lib/performers/store";
import {
  MAX_BULK_FILES,
  processAndStorePerformerImage,
  titleFromFilename,
  validateImageFile,
} from "@/lib/performers/upload";
import type { PerformerRecord } from "@/lib/performers/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form." }, { status: 400 });
  }

  const files = form
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }
  if (files.length > MAX_BULK_FILES) {
    return NextResponse.json(
      { error: `Upload ${MAX_BULK_FILES} photos or fewer at a time.` },
      { status: 422 }
    );
  }

  const existing = await listAllPerformers();
  const year = Math.max(
    new Date().getFullYear(),
    ...existing.map((performer) => performer.year)
  );

  const created: PerformerRecord[] = [];
  const errors: { file: string; error: string }[] = [];

  for (const file of files) {
    const invalid = validateImageFile(file);
    if (invalid) {
      errors.push({ file: file.name, error: invalid });
      continue;
    }

    try {
      const image = await processAndStorePerformerImage(
        file,
        file.name.replace(/\.[^.]+$/, "")
      );
      const performer = await createPerformer({
        name: titleFromFilename(file.name),
        year,
        role: "Artist",
        image,
        status: "draft",
      });
      created.push(performer);
    } catch (error) {
      errors.push({
        file: file.name,
        error: error instanceof Error ? error.message : "Upload failed.",
      });
    }
  }

  if (created.length > 0) {
    revalidatePath("/");
    revalidateTag(PERFORMERS_TAG);
  }

  return NextResponse.json(
    { performers: created, errors },
    { status: created.length > 0 ? 201 : 422 }
  );
}
