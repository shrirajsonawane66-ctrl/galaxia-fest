export function EventsSkeleton() {
  return (
    <div className="space-y-12 md:space-y-16" aria-label="Loading events" role="status">
      {["Day 1", "Day 2"].map((day) => (
        <section key={day}>
          <div className="h-10 w-40 max-w-full animate-pulse rounded-lg bg-white/[0.08]" />
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="aspect-[16/9] w-full animate-pulse bg-white/[0.06]" />
                <div className="space-y-3 p-5">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-white/[0.08]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-12 w-full animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-11 w-full animate-pulse rounded-full bg-white/[0.08]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
