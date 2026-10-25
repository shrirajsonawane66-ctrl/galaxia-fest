"use client";

import * as React from "react";
import Image from "next/image";
import { CalendarDays, MapPin, Clock, ArrowUpRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventCardProps {
  heading: string;
  description: string;
  date: Date;
  imageUrl?: string;
  imageAlt?: string;
  eventName: string;
  location: string;
  time: string;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
  featured?: boolean;
}

function formatCardDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function EventCard({
  heading,
  description,
  date,
  imageUrl,
  imageAlt,
  eventName,
  location,
  time,
  actionLabel,
  onActionClick,
  className,
  featured = false,
}: EventCardProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-cream backdrop-blur-md transition duration-300 hover:border-white/20 hover:bg-white/[0.07]",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-navy">
        {showImage ? (
          <Image
            src={imageUrl as string}
            alt={imageAlt || eventName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0b1b47] via-[#132a6b] to-[#081434]">
            <ImageOff className="h-8 w-8 text-white/20" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050d24] via-[#050d24]/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/80 backdrop-blur">
            {heading}
          </span>
          {featured && (
            <span className="rounded-full border border-red-glow/40 bg-fest-red/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_16px_rgba(229,18,31,.4)]">
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-cream/55">
          <CalendarDays className="h-3.5 w-3.5 text-lavender" aria-hidden />
          {formatCardDate(date)}
          <span className="h-1 w-1 rounded-full bg-cream/30" />
          <Clock className="h-3.5 w-3.5 text-lavender" aria-hidden />
          {time}
        </div>

        <div>
          <h3 className="font-orbitron text-lg font-bold leading-tight text-cream">
            {eventName}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-cream/65">
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-cream/60">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
            <span className="truncate">{location}</span>
          </span>
          {actionLabel && onActionClick && (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fest-red px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_0_18px_rgba(229,18,31,.35)] transition hover:bg-red-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
            >
              {actionLabel}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
