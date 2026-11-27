import type { Metadata } from "next";
import HomePage from "@/components/home-page";
import type { Performer } from "@/lib/performers";
import { getPublishedGalleryPerformers } from "@/lib/performers/store";
import { getCachedPublishedHighlights } from "@/lib/highlights/store";
import type { Highlight } from "@/lib/highlights/types";
import { getPublicContent } from "@/lib/content/store";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Galaxia i-Fest 2026 — Where Music Meets the Cosmos",
  description:
    "Galaxia i-Fest 2026 is the premier college music festival by Western College of Business Management — three nights of sound, light and celebration, 17–19 December 2026.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Galaxia i-Fest 2026 — Where Music Meets the Cosmos",
    description:
      "A galactic music festival experience at Western College of Business Management, 17–19 December 2026.",
    type: "website",
    url: "/",
  },
};

export default async function Page() {
  let performers: Performer[] = [];
  let highlights: Highlight[] = [];

  try {
    performers = await getPublishedGalleryPerformers();
  } catch (error) {
    console.error("Could not load performers for the homepage:", error);
  }

  try {
    highlights = await getCachedPublishedHighlights();
  } catch (error) {
    console.error("Could not load highlights for the homepage:", error);
  }

  const content = await getPublicContent();

  return <HomePage performers={performers} highlights={highlights} content={content} />;
}
