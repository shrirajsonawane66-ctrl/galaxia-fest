import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/events/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG or WebP images are allowed." },
      { status: 422 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 2MB or smaller." }, { status: 422 });
  }

  const extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", "events");

  try {
    await fs.mkdir(directory, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(directory, filename), buffer);
    return NextResponse.json({ url: `/uploads/events/${filename}` });
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
