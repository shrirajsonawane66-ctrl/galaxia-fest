import { siteConfig } from "@/lib/site-config";
import type { EventRecord } from "./types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatEventDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
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

export function sortEvents(events: EventRecord[]): EventRecord[] {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
    return a.sortOrder - b.sortOrder;
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
