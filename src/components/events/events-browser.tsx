"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarX2, Filter } from "lucide-react";
import { EventCard } from "@/components/ui/card-14";
import { buildIcs, dayLabel, formatEventTime, sortEvents } from "@/lib/events/format";
import type { EventRecord } from "@/lib/events/types";
import { cn } from "@/lib/utils";

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00+05:30`);
}

function actionFor(event: EventRecord): (() => void) | undefined {
  if (event.actionType === "link" && event.actionUrl) {
    return () => window.open(event.actionUrl as string, "_blank", "noopener,noreferrer");
  }
  if (event.actionType === "calendar") {
    return () => {
      const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${event.slug}.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };
  }
  return undefined;
}

export function EventsBrowser({ events }: { events: EventRecord[] }) {
  const reduceMotion = useReducedMotion();
  const [day, setDay] = React.useState("all");
  const [category, setCategory] = React.useState("all");

  const days = React.useMemo(() => {
    const unique = Array.from(new Set(events.map((event) => event.date))).sort();
    return unique.map((date) => ({ value: date, label: dayLabel(date) }));
  }, [events]);

  const categories = React.useMemo(
    () => Array.from(new Set(events.map((event) => event.category))).sort(),
    [events]
  );

  const filtered = React.useMemo(() => {
    const list = events.filter(
      (event) =>
        (day === "all" || event.date === day) &&
        (category === "all" || event.category === category)
    );
    return sortEvents(list);
  }, [events, day, category]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter events by day">
          <button
            type="button"
            role="tab"
            aria-selected={day === "all"}
            onClick={() => setDay("all")}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70",
              day === "all"
                ? "border-fest-red bg-fest-red text-white shadow-[0_0_18px_rgba(229,18,31,.35)]"
                : "border-white/15 bg-white/5 text-cream/65 hover:bg-white/10"
            )}
          >
            All
          </button>
          {days.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={day === item.value}
              onClick={() => setDay(item.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70",
                day === item.value
                  ? "border-fest-red bg-fest-red text-white shadow-[0_0_18px_rgba(229,18,31,.35)]"
                  : "border-white/15 bg-white/5 text-cream/65 hover:bg-white/10"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cream/40">
            <Filter className="h-3.5 w-3.5" aria-hidden /> Category
          </span>
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] transition",
              category === "all"
                ? "border-lavender/60 bg-lavender/20 text-cream"
                : "border-white/10 bg-white/5 text-cream/55 hover:bg-white/10"
            )}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] transition",
                category === item
                  ? "border-lavender/60 bg-lavender/20 text-cream"
                  : "border-white/10 bg-white/5 text-cream/55 hover:bg-white/10"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-20 text-center backdrop-blur">
          <CalendarX2 className="h-8 w-8 text-cream/30" aria-hidden />
          <p className="mt-4 text-sm text-cream/60">
            {day !== "all" || category !== "all"
              ? "No events match these filters."
              : "No events announced yet. Check back soon."}
          </p>
          {(day !== "all" || category !== "all") && (
            <button
              type="button"
              onClick={() => {
                setDay("all");
                setCategory("all");
              }}
              className="mt-5 rounded-full border border-white/20 px-4 py-2 text-xs text-cream/80 hover:bg-white/10"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event, index) => {
            const action = actionFor(event);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.5, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }
                }
              >
                <EventCard
                  heading={event.heading}
                  description={event.description}
                  date={toDate(event.date)}
                  imageUrl={event.imageUrl}
                  imageAlt={event.imageAlt}
                  eventName={event.eventName}
                  location={event.location}
                  time={formatEventTime(event)}
                  actionLabel={event.actionType === "none" ? undefined : event.actionLabel}
                  onActionClick={action}
                  featured={event.featured}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
