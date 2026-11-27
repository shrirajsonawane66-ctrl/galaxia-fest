import { siteConfig } from "@/lib/site-config";
import type { EventDay, EventRecord } from "./types";

export const IST_TIME_ZONE = "Asia/Kolkata";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function formatEventDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST_TIME_ZONE,
  });
}

export function formatTime12h(value: string): string {
  const [hourRaw, minute] = value.split(":").map(Number);
  if (Number.isNaN(hourRaw) || Number.isNaN(minute)) return value;
  const hour = hourRaw % 12 === 0 ? 12 : hourRaw % 12;
  const suffix = hourRaw >= 12 ? "PM" : "AM";
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatEventTime(event: Pick<EventRecord, "startTime" | "endTime">): string {
  const start = formatTime12h(event.startTime);
  return event.endTime ? `${start} – ${formatTime12h(event.endTime)}` : start;
}

/** Exact public format: "Sat, 12 Dec 2026, 10:00 AM IST". */
export function formatStartsAt(startsAt: string | null): string {
  if (!startsAt) return "Date to be announced";
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${formatted} IST`;
}

/** A datetime-local value typed in IST becomes a UTC ISO string for storage. */
export function istDateTimeLocalToUtc(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(`${value}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** A stored UTC ISO string becomes the datetime-local value an admin edits. */
export function utcToIstDateTimeLocal(startsAt: string | null): string {
  if (!startsAt) return "";
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function eventDay(event: Pick<EventRecord, "day" | "date">): EventDay {
  if (event.day === 1 || event.day === 2) return event.day;
  const match = siteConfig.eventDays.find((day) => day.date === event.date);
  if (match?.label === "Day 1") return 1;
  if (match?.label === "Day 3") return 2;
  return 2;
}

export function dayLabel(date: string): string {
  const match = siteConfig.eventDays.find((day) => day.date === date);
  if (match) {
    const [, month, day] = date.split("-").map(Number);
    return `${match.label} (${MONTHS[month - 1]} ${day})`;
  }
  return formatEventDate(date);
}

export function dayKey(date: string): string {
  return date;
}

/** Day → sortOrder → title, as required by the public Events page. */
export function sortEvents(events: EventRecord[]): EventRecord[] {
  return [...events].sort((a, b) => {
    const dayA = eventDay(a);
    const dayB = eventDay(b);
    if (dayA !== dayB) return dayA - dayB;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

export function buildIcs(event: EventRecord): string {
  const [year, month, day] = event.date.split("-").map(Number);
  const [sh, sm] = event.startTime.split(":").map(Number);
  const [eh, em] = (event.endTime || event.startTime).split(":").map(Number);
  const start = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(sh).padStart(2, "0")}${String(sm).padStart(2, "0")}00`;
  const end = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(eh).padStart(2, "0")}${String(em).padStart(2, "0")}00`;
  const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Galaxia i-Fest//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@galaxia-i-fest.in`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Asia/Kolkata:${start}`,
    `DTEND;TZID=Asia/Kolkata:${end}`,
    `SUMMARY:${event.eventName.replace(/[,;]/g, "")}`,
    `LOCATION:${event.location.replace(/[,;]/g, "")}`,
    `DESCRIPTION:${event.description.replace(/[,;]/g, "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
