import { PerformerCard } from "@/components/ui/performer-card";
import { SectionTitle } from "@/components/ui/section-title";
import type { Performer } from "@/lib/performers";

/* ---------- Title block ---------- */
export function TitleBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center px-6 text-center ${className}`}>
      <span className="type-small rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[var(--text-strong)]">
        Past stars
      </span>
      <SectionTitle cream="Galaxia" red="legends." as="h2" className="mt-5" />
      <p className="type-body mt-4 max-w-md">
        The artists who lit up the cosmos in past editions.
      </p>
    </div>
  );
}

/* ---------- Static grid: the no-JS, mobile and reduced-motion experience ---------- */
export function StaticPerformersSection({ performers }: { performers: Performer[] }) {
  return (
    <section
      id="performers"
      aria-label="Past performers"
      className="relative w-full px-6 py-24 md:px-10 md:py-32"
    >
      <TitleBlock />
      <div className="mx-auto mt-12 grid max-w-7xl grid-cols-2 gap-4 md:mt-16 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {performers.map((performer) => (
          <PerformerCard key={performer.id} performer={performer} />
        ))}
      </div>
    </section>
  );
}
