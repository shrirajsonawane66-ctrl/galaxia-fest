import NebulaBackground from "@/components/nebula-background";
import SiteNav from "@/components/site-nav";

export default function EventsLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden text-cream">
      <NebulaBackground />
      <SiteNav />
      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-8 md:pt-40">
        <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="mt-6 h-12 w-2/3 animate-pulse rounded-xl bg-white/10" />
        <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-white/5" />
        <div className="mt-10 flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[360px] animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
