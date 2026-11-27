import type { Metadata } from "next";
import SiteNav from "@/components/site-nav";
import { CoreMembersSection } from "@/components/sections/core-members";

export const metadata: Metadata = {
  title: "Core Members | Galaxia i-Fest",
  description:
    "Meet the Galaxia i-Fest core team — the students leading the 2026 edition behind the scenes and on the ground.",
  alternates: { canonical: "/core-members" },
  openGraph: {
    title: "Core Members | Galaxia i-Fest",
    description:
      "Meet the Galaxia i-Fest core team — the students leading the 2026 edition behind the scenes and on the ground.",
    type: "website",
    url: "/core-members",
  },
  twitter: {
    card: "summary_large_image",
    title: "Core Members | Galaxia i-Fest",
    description:
      "Meet the Galaxia i-Fest core team — the students leading the 2026 edition behind the scenes and on the ground.",
  },
};

export default function CoreMembersPage() {
  return (
    <div className="relative min-h-[100svh] overflow-x-clip text-[var(--text-body)]">
      <SiteNav />
      <div className="noise pointer-events-none fixed inset-0 z-[1]" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-[calc(64px+env(safe-area-inset-top)+24px)] sm:px-6 sm:pb-24 sm:pt-32 md:px-10 md:pb-32 md:pt-40">
        <div className="max-w-4xl">
          <h1 className="type-h1">Core Members</h1>
          <p className="type-lead mt-6">
            The people who keep the festival in orbit, behind the scenes and on the ground.
          </p>
        </div>

        <CoreMembersSection className="mt-12 border-t-0 pt-0 md:mt-16" />
      </main>
    </div>
  );
}
