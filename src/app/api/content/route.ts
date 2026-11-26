import { NextResponse } from "next/server";
import { getPublicContent } from "@/lib/content/store";

export const revalidate = 60;

export async function GET() {
  const content = await getPublicContent();
  return NextResponse.json(
    { content },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } }
  );
}
