"use client";

import * as React from "react";
import Image from "next/image";
import { CalendarDays, ChevronDown, ImageOff, MessageCircle } from "lucide-react";
import { formatStartsAt } from "@/lib/events/format";
import { thumbnailForTitle } from "@/lib/events/thumbnails";
import type { EventRecord } from "@/lib/events/types";
import { cn } from "@/lib/utils";

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

const COUNTDOWN_LABELS = ["Days", "Hours", "Minutes", "Seconds"] as const;

function Countdown({ startsAt }: { startsAt: string }) {
  // Keep SSR and first client render identical. The real clock starts after
  // hydration, then the interval is always cleared on unmount.
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const target = new Date(startsAt).getTime();
  if (Number.isNaN(target)) return null;

  if (now !== null) {
    const remaining = target - now;
    if (remaining <= 0) {
      const label = now - target < THREE_HOURS_MS ? "Started" : "Completed";
      return (
        <p className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-[var(--text-strong)]">
          {label}
        </p>
      );
    }
  }

  const secondsTotal = now === null ? 0 : Math.floor((target - now) / 1000);
  const parts = [
    Math.floor(secondsTotal / 86400),
    Math.floor((secondsTotal % 86400) / 3600),
    Math.floor((secondsTotal % 3600) / 60),
    secondsTotal % 60,
  ];

  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Countdown to event start">
      {COUNTDOWN_LABELS.map((label, index) => (
        <div
          key={label}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-1 py-2 text-center"
        >
          <div className="font-display text-xl font-bold tabular-nums text-[var(--text-strong)] md:text-2xl">
            {now === null ? "--" : String(parts[index]).padStart(2, "0")}
          </div>
          <div className="type-small text-[11px]">{label}</div>
        </div>
      ))}
    </div>
  );
}

export function FestivalEventCard({
  event,
  className,
}: {
  event: EventRecord;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const imageUrl = event.imageUrl || thumbnailForTitle(event.title);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const dayText = event.day === 1 ? "Day 1" : "Day 2";

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--text-body)]",
        className
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#06123A]">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={event.imageAlt || `${event.title} thumbnail`}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#0b1b47]">
            <ImageOff className="h-8 w-8 text-white/30" aria-hidden />
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-[#050d24]/90 px-3 py-1 type-small text-[var(--text-strong)]">
          {dayText}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div>
          <h3 className="type-h3">{event.title}</h3>
          {event.theme && <p className="type-small mt-1">{event.theme}</p>}
        </div>

        <p className="type-small flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
          <span>{formatStartsAt(event.startsAt)}</span>
        </p>

        {event.startsAt ? (
          <Countdown startsAt={event.startsAt} />
        ) : (
          <p className="inline-flex min-h-9 items-center text-sm text-[var(--text-muted)]">
            Date to be announced
          </p>
        )}

        {event.rules.length > 0 && (
          <details className="group rounded-xl border border-white/10 bg-white/[0.03]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 text-sm font-medium text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0]">
              Rules
              <ChevronDown
                className="h-4 w-4 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <ul className="list-disc space-y-1.5 border-t border-white/10 px-4 py-3 pl-8 text-sm leading-relaxed text-[var(--text-body)]">
              {event.rules.map((rule, index) => (
                <li key={`${index}-${rule}`}>{rule}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-auto border-t border-white/10 pt-4">
          {event.whatsappUrl ? (
            <a
              href={event.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#052e16] transition-colors hover:bg-[#1ebe5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Join WhatsApp Group
            </a>
          ) : (
            <p className="type-small">WhatsApp group link coming soon.</p>
          )}
        </div>
      </div>
    </article>
  );
}
