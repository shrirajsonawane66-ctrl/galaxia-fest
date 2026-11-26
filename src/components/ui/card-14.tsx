"use client";

import * as React from "react";
import Image from "next/image";
import { CalendarDays, MapPin, Clock, ArrowUpRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventCardProps {
  heading: string;
  description: string;
  date: Date;
  dateLabel?: string;
  timeLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
  eventName: string;
  location: string;
  time: string;
  actionLabel?: string;
  onActionClick?: () => void;
  registrationStatus?: "open" | "closed" | "coming_soon";
  registrationUrl?: string;
  participationType?: "individual" | "team";
  rules?: string;
  requirements?: string;
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
  dateLabel,
  timeLabel,
  imageUrl,
  imageAlt,
  eventName,
  location,
  time,
  actionLabel,
  onActionClick,
  registrationStatus,
  registrationUrl,
  participationType,
  rules,
  requirements,
  className,
  featured = false,
}: EventCardProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const shownDate = dateLabel ?? formatCardDate(date);
  const shownTime = timeLabel === undefined ? time : timeLabel;
  let hasRegistrationUrl = false;
  if (registrationUrl) {
    try {
      new URL(registrationUrl);
      hasRegistrationUrl = true;
    } catch {
      hasRegistrationUrl = false;
    }
  }
  const canRegister = registrationStatus === "open" && hasRegistrationUrl;
  const registrationLabel =
    registrationStatus === "open" && hasRegistrationUrl
      ? "Registration open"
      : registrationStatus === "closed"
        ? "Registration closed"
        : "Registration Coming Soon";
  const registrationDetails = [
    rules ? `Rules: ${rules}` : "",
    requirements ? `Requirements: ${requirements}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const shownActionLabel = canRegister ? actionLabel || "Register" : actionLabel;
  const shownOnActionClick =
    canRegister || (Boolean(actionLabel) && Boolean(onActionClick)) ? onActionClick : undefined;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--text-body)] transition-colors hover:border-white/25",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#06123A]">
        {showImage ? (
          <Image
            src={imageUrl as string}
            alt={imageAlt || eventName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0b1b47] via-[#132a6b] to-[#081434]">
            <ImageOff className="h-8 w-8 text-white/20" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050d24] via-[#050d24]/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="type-small rounded-full border border-white/15 bg-[#050d24]/80 px-3 py-1 text-[var(--text-strong)]">
            {heading}
          </span>
          {featured && (
            <span className="rounded-full bg-[#E5121F] px-3 py-1 text-[13px] font-medium text-white">
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="type-small flex flex-wrap items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          {shownDate}
          {shownTime && (
            <>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <Clock className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              {shownTime}
            </>
          )}
          <span
            title={registrationDetails || undefined}
            className="type-small rounded-full border border-white/15 px-2.5 py-0.5 text-[var(--text-muted)]"
          >
            {registrationLabel}
          </span>
          {participationType && (
            <span className="text-[var(--text-muted)]">
              {participationType === "team" ? "Team" : "Individual"}
            </span>
          )}
        </div>

        <div>
          <h3 className="type-h3">
            {eventName}
          </h3>
          <p className="mt-2 line-clamp-3 text-base leading-relaxed text-[var(--text-body)] md:text-[15px]">
            {description}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-[var(--text-muted)]">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
            <span className="truncate">{location}</span>
          </span>
          {shownActionLabel && shownOnActionClick && (
            <button
              type="button"
              onClick={shownOnActionClick}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-[#E5121F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#FF1F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] md:min-h-0"
            >
              {shownActionLabel}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
