"use client";

import * as React from "react";
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

const filterFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]";

export function EventsBrowser({ events }: { events: EventRecord[] }) {
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
        <div className="flex gap-2 overflow-x-auto pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pr-0" role="tablist" aria-label="Filter events by day">
          <button
            type="button"
            role="tab"
            aria-selected={day === "all"}
            onClick={() => setDay("all")}
            className={cn(
              "min-h-11 min-w-11 shrink-0 justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors md:min-h-0 md:min-w-0",
              filterFocus,
              day === "all"
                ? "border-[#E5121F] bg-[#E5121F] text-white"
                : "border-white/10 bg-white/[0.04] text-[var(--text-body)] hover:border-white/25"
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
                "min-h-11 min-w-11 shrink-0 justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors md:min-h-0 md:min-w-0",
                filterFocus,
                day === item.value
                  ? "border-[#E5121F] bg-[#E5121F] text-white"
                  : "border-white/10 bg-white/[0.04] text-[var(--text-body)] hover:border-white/25"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pr-0">
          <span className="type-small inline-flex shrink-0 items-center gap-1.5">
            <Filter className="h-4 w-4" aria-hidden /> Category
          </span>
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "min-h-11 min-w-11 shrink-0 justify-center rounded-full border px-3 py-1.5 text-sm transition-colors md:min-h-0 md:min-w-0",
              filterFocus,
              category === "all"
                ? "border-[#FF3B4B]/60 bg-[#FF3B4B]/15 text-[var(--text-strong)]"
                : "border-white/10 bg-white/[0.04] text-[var(--text-muted)] hover:border-white/25"
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
                "min-h-11 min-w-11 shrink-0 justify-center rounded-full border px-3 py-1.5 text-sm transition-colors md:min-h-0 md:min-w-0",
                filterFocus,
                category === item
                  ? "border-[#FF3B4B]/60 bg-[#FF3B4B]/15 text-[var(--text-strong)]"
                  : "border-white/10 bg-white/[0.04] text-[var(--text-muted)] hover:border-white/25"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-20 text-center">
          <CalendarX2 className="h-8 w-8 text-[var(--text-muted)]" aria-hidden />
          <p className="type-body mt-4">
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
              className={cn(
                "mt-5 inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 py-2 text-sm text-[var(--text-body)] transition-colors hover:border-white/35 hover:text-[var(--text-strong)] md:min-h-0",
                filterFocus
              )}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {filtered.map((event) => {
            const action = actionFor(event);
            return (
              <EventCard
                key={event.id}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
