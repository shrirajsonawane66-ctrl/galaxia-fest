import { z } from "zod";

export type EventStatus = "draft" | "published";
export type EventActionType = "link" | "calendar" | "none";

export interface EventRecord {
  id: string;
  slug: string;
  heading: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  imageUrl?: string;
  imageAlt?: string;
  eventName: string;
  location: string;
  category: string;
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
  actionLabel?: string;
  actionType: EventActionType;
  actionUrl?: string;
  status: EventStatus;
  featured: boolean;
  sortOrder: number;
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const eventInputSchema = z
  .object({
    heading: z.string().trim().min(1, "Heading is required").max(80),
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(160, "Keep the description under 160 characters"),
    date: isoDate,
    startTime: time,
    endTime: z.union([time, z.literal("")]).optional(),
    imageUrl: z.string().trim().max(2048).optional(),
    imageAlt: z.string().trim().max(160).optional(),
    eventName: z.string().trim().min(1, "Event name is required").max(120),
    location: z.string().trim().min(1, "Location is required").max(120),
    category: z.string().trim().min(1, "Category is required").max(40),
    actionLabel: z.string().trim().max(40).optional(),
    actionType: z.enum(["link", "calendar", "none"]),
    actionUrl: z.string().trim().max(2048).optional(),
    status: z.enum(["draft", "published"]),
    featured: z.boolean(),
    sortOrder: z.number().int().min(0).max(9999),
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
    if (value.actionType === "link" && value.actionUrl) {
      try {
        new URL(value.actionUrl);
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["actionUrl"],
          message: "Enter a valid URL",
        });
      }
    }
    if (value.endTime && value.endTime <= value.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time",
      });
    }
  });

export type EventInputSchema = z.infer<typeof eventInputSchema>;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
