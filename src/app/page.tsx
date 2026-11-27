import HomePage from "@/components/home-page";
import type { Performer } from "@/lib/performers";
import { getPublishedGalleryPerformers } from "@/lib/performers/store";
import { getCachedPublishedHighlights } from "@/lib/highlights/store";
import type { Highlight } from "@/lib/highlights/types";
import { getPublicContent } from "@/lib/content/store";

export const revalidate = 60;

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
