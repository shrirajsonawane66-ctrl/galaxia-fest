import { NextResponse } from "next/server";
import { listPublishedEvents } from "@/lib/events/store";

export const revalidate = 60;

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

  return NextResponse.json({ events: filtered });
}
