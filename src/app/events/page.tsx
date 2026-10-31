import type { Metadata } from "next";
import SiteNav from "@/components/site-nav";
import { EventsBrowser } from "@/components/events/events-browser";
import { listPublishedEvents } from "@/lib/events/store";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Events | Galaxia i-Fest",
  description:
    "Explore the full Galaxia i-Fest event schedule across three days — music, dance, gaming, tech and workshops.",
  openGraph: {
    title: "Events | Galaxia i-Fest",
    description:
      "Explore the full Galaxia i-Fest event schedule across three days — music, dance, gaming, tech and workshops.",
    type: "website",
    url: "/events",
  },
  twitter: {
    card: "summary_large_image",
    title: "Events | Galaxia i-Fest",
    description:
      "Explore the full Galaxia i-Fest event schedule across three days — music, dance, gaming, tech and workshops.",
  },
};

export default async function EventsPage() {
  const events = await listPublishedEvents();

  return (
    <div className="relative min-h-[100svh] overflow-x-clip text-[var(--text-body)]">
      <SiteNav />
      <div className="noise pointer-events-none fixed inset-0 z-[1]" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-[calc(64px+env(safe-area-inset-top)+24px)] sm:px-6 sm:pb-24 sm:pt-32 md:px-10 md:pb-32 md:pt-40">
        <div className="max-w-4xl">
          <h1 className="type-h1">Event schedule</h1>
          <p className="type-lead mt-6">
            Find what&apos;s happening across all three days.
          </p>
        </div>

        <div className="mt-12 md:mt-16">
          <EventsBrowser events={events} />
        </div>
      </main>
    </div>
  );
}
