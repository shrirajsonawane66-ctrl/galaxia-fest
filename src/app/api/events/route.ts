import { NextResponse } from "next/server";
import { listPublishedEvents } from "@/lib/events/store";

// The underlying read is cached by tag (see lib/events/store.ts), so this route
// can be cached at the edge as well. Admin writes revalidate the tag.
export const revalidate = 60;

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day");
  const category = searchParams.get("category");

  const events = await listPublishedEvents();
  const filtered = events.filter(
    (event) =>
      (!day || event.date === day) &&
      (!category || event.category.toLowerCase() === category.toLowerCase())
  );

  return NextResponse.json({ events: filtered }, { headers: CACHE_HEADERS });
}
