import { NextResponse } from "next/server";

import { getPublishedGalleryPerformers } from "@/lib/performers/store";

export const revalidate = 60;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function GET() {
  try {
    const performers = await getPublishedGalleryPerformers();
    return NextResponse.json({ performers }, { headers: CACHE_HEADERS });
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
