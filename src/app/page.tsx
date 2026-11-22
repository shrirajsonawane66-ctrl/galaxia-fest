import HomePage from "@/components/home-page";
import type { Performer } from "@/lib/performers";
import { getPublishedGalleryPerformers } from "@/lib/performers/store";

export const revalidate = 60;

export default async function Page() {
  let performers: Performer[] = [];

  try {
    performers = await getPublishedGalleryPerformers();
  } catch (error) {
    // Keep the rest of the homepage usable if the performers table has not
    // been migrated yet; the gallery falls back to its empty state.
    console.error("Could not load performers for the homepage:", error);
  }

  return <HomePage performers={performers} />;
}
