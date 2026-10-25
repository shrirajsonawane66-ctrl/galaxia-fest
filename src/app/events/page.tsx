import type { Metadata } from "next";
import NebulaBackground from "@/components/nebula-background";
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
    <div className="relative min-h-screen overflow-hidden text-cream">
      <NebulaBackground />
      <SiteNav />
      <div className="noise pointer-events-none fixed inset-0 z-[1]" />

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-8 md:pt-40">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/75 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-fest-red" />
            Events
          </span>
          <h1 className="mt-6 font-orbitron text-4xl font-black uppercase leading-tight tracking-tight text-cream sm:text-5xl md:text-6xl">
            Event Schedule
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-cream/60 sm:text-base">
            Find what&apos;s happening across all three days.
          </p>
        </div>

        <div className="mt-10">
          <EventsBrowser events={events} />
        </div>
      </main>
    </div>
  );
}
