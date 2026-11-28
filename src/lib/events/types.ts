import { z } from "zod";
import { istDateTimeLocalToUtc } from "./format";

export type EventDay = 1 | 2;
export type EventStatus = "draft" | "published";
export type EventActionType = "link" | "calendar" | "none";

/**
 * The festival Events system extends the original card schema rather than
 * replacing it. The legacy fields are kept so old records, helpers and routes
 * continue to work; the new fields drive the public countdown cards.
 */
export interface EventRecord {
  id: string;
  slug: string;

  // New festival event fields
  title: string;
  day: EventDay;
  theme: string;
  startsAt: string | null; // UTC ISO string, entered/displayed in Asia/Kolkata
  rules: string[];
  whatsappUrl: string | null;
  formUrl: string | null;
  isPublished: boolean;

  // Existing card fields (kept working)
  heading: string;
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  imageUrl?: string;
  imageAlt?: string;
  eventName: string;
  location: string;
  category: string;
  /** Reference Events-tab marker; the original card ignores it intentionally. */
  dateTbd?: boolean;
  actionLabel?: string;
  actionType: EventActionType;
  actionUrl?: string;
  status: EventStatus;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventInput {
  title: string;
  day: EventDay;
  theme: string;
  startsAt: string | null;
  rules: string[];
  whatsappUrl: string | null;
  formUrl?: string | null;
  isPublished: boolean;
  sortOrder: number;

  // Optional legacy overrides. The store derives them from the fields above
  // when they are absent, which keeps every old route functional.
  heading?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  imageUrl?: string;
  imageAlt?: string;
  eventName?: string;
  location?: string;
  category?: string;
  actionLabel?: string;
  actionType?: EventActionType;
  actionUrl?: string;
  status?: EventStatus;
  featured?: boolean;
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const isoDateTime = z.string().trim().refine(
  (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !Number.isNaN(Date.parse(value)),
  "Use a valid ISO date/time"
);

export const whatsappUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid https URL")
  .refine(
    (value) =>
      value.startsWith("https://chat.whatsapp.com/") || value.startsWith("https://wa.me/"),
    {
      message:
        "WhatsApp link must start with https://chat.whatsapp.com/ or https://wa.me/",
    }
  );

export const registrationUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid https URL")
  .refine((value) => value.startsWith("https://"), {
    message: "Registration link must use https",
  });

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(80, "Keep the title under 80 characters"),
    day: z.union([z.literal(1), z.literal(2)]),
    theme: z.string().trim().max(120, "Keep the theme under 120 characters"),
    startsAt: isoDateTime.nullable(),
    rules: z.array(z.string().trim().max(2000, "Keep each rule under 2000 characters")),
    whatsappUrl: whatsappUrlSchema.nullable(),
    formUrl: registrationUrlSchema.nullable(),
    isPublished: z.boolean(),
    sortOrder: z.number().int().min(0).max(9999),

    heading: z.string().trim().max(80).optional(),
    description: z.string().trim().max(160).optional(),
    date: z.union([isoDate, z.literal("")]).optional(),
    startTime: z.union([time, z.literal("")]).optional(),
    endTime: z.union([time, z.literal("")]).optional(),
    imageUrl: z.string().trim().max(2048).optional(),
    imageAlt: z.string().trim().max(160).optional(),
    eventName: z.string().trim().max(120).optional(),
    location: z.string().trim().max(120).optional(),
    category: z.string().trim().max(40).optional(),
    actionLabel: z.string().trim().max(40).optional(),
    actionType: z.enum(["link", "calendar", "none"]).optional(),
    actionUrl: z.string().trim().max(2048).optional(),
    status: z.enum(["draft", "published"]).optional(),
    featured: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.imageUrl && !value.imageAlt) {
      ctx.addIssue({
        code: "custom",
        path: ["imageAlt"],
        message: "Alt text is required when an image is set",
      });
    }
    if (value.actionType === "link" && !value.actionUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["actionUrl"],
        message: "Action URL is required for link actions",
      });
    }
  });

export type EventInputSchema = z.infer<typeof eventInputSchema>;

/**
 * Older admin clients send the original card shape (eventName/heading/date/
 * startTime/status instead of the new fields). Fill the new fields from those
 * values before validation so the existing write routes keep working while new
 * payloads are still validated strictly.
 */
export function normalizeEventPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;

  const raw = payload as Record<string, unknown>;
  const text = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string).trim() : "";

  const title = text("title") || text("eventName") || text("heading");
  const date = text("date");
  const startTime = text("startTime");
  const rawDay = raw.day;
  const day =
    rawDay === 1 || rawDay === "1"
      ? 1
      : rawDay === 2 || rawDay === "2"
        ? 2
        : date === "2025-12-19"
          ? 1
          : 2;

  const startsAt =
    raw.startsAt === undefined
      ? date && startTime
        ? istDateTimeLocalToUtc(`${date}T${startTime}`)
        : null
      : raw.startsAt;

  const actionUrl = text("actionUrl");
  let whatsappUrl = raw.whatsappUrl;
  if (whatsappUrl === undefined || whatsappUrl === "") {
    whatsappUrl =
      actionUrl.startsWith("https://chat.whatsapp.com/") || actionUrl.startsWith("https://wa.me/")
        ? actionUrl
        : null;
  }

  let formUrl = raw.formUrl;
  if (formUrl === undefined || formUrl === "") {
    formUrl = actionUrl.startsWith("https://ves-admin.learnqoch.com/eventform/") ? actionUrl : null;
  }

  const isPublished =
    typeof raw.isPublished === "boolean" ? raw.isPublished : raw.status === "published";

  return {
    ...raw,
    title,
    day,
    theme: raw.theme === undefined ? "" : raw.theme,
    startsAt,
    rules: Array.isArray(raw.rules) ? raw.rules : [],
    whatsappUrl,
    formUrl,
    isPublished,
    sortOrder:
      typeof raw.sortOrder === "number" && Number.isFinite(raw.sortOrder) ? raw.sortOrder : 0,
    imageAlt:
      typeof raw.imageAlt === "string" && raw.imageAlt
        ? raw.imageAlt
        : raw.imageUrl
          ? `${title} thumbnail`
          : raw.imageAlt,
    status:
      raw.status === "draft" || raw.status === "published"
        ? raw.status
        : isPublished
          ? "published"
          : "draft",
  };
}

/** Convert a stored record back into an editable payload (client-safe). */
export function eventToInput(event: EventRecord): EventInput {
  return {
    title: event.title,
    day: event.day,
    theme: event.theme,
    startsAt: event.startsAt,
    rules: event.rules,
    whatsappUrl: event.whatsappUrl,
    formUrl: event.formUrl,
    isPublished: event.isPublished,
    sortOrder: event.sortOrder,
    heading: event.heading,
    description: event.description,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    imageUrl: event.imageUrl,
    imageAlt: event.imageAlt,
    eventName: event.eventName,
    location: event.location,
    category: event.category,
    actionLabel: event.actionLabel,
    actionType: event.actionType,
    actionUrl: event.actionUrl,
    status: event.status,
    featured: event.featured,
  };
}

/** Empty rule rows are dropped on save, in the UI and again on the server. */
export function cleanedRules(rules: string[]): string[] {
  return rules.map((rule) => rule.trim()).filter(Boolean);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
