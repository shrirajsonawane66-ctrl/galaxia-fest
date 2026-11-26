import { z } from "zod";

export const CONTENT_SECTIONS = [
  "settings",
  "schedule",
  "sponsors",
  "faqs",
  "socials",
  "announcements",
  "tickets",
] as const;

export type ContentSection = (typeof CONTENT_SECTIONS)[number];
export type CollectionSection = Exclude<ContentSection, "settings">;
export type ContentStatus = "draft" | "published";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const status = z.enum(["draft", "published"]);

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const urlOrEmpty = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || isUrl(value), "Enter a valid URL");

const assetUrlOrEmpty = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value === "" ||
      isUrl(value) ||
      (value.startsWith("/") && !value.startsWith("//")),
    "Enter a valid URL"
  );

export const siteSettingsSchema = z.object({
  title: z.string().trim().min(1, "Event title is required").max(120),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(1200),
  theme: z.string().trim().max(160),
  aboutTitle: z.string().trim().max(160),
  aboutText1: z.string().trim().max(2000),
  aboutText2: z.string().trim().max(2000),
  collegeName: z.string().trim().max(160),
  dateLabel: z.string().trim().max(120),
  venueName: z.string().trim().max(160),
  venueAddress: z.string().trim().max(500),
  mapsUrl: urlOrEmpty,
  contactName: z.string().trim().max(120),
  contactPhone: z.string().trim().max(40),
  contactEmail: z.string().trim().max(160),
  bookingInstructions: z.string().trim().max(2000),
  bookingUrl: urlOrEmpty,
  showPrices: z.boolean(),
});

export const scheduleEntrySchema = z.object({
  name: z.string().trim().min(1, "Event name is required").max(160),
  date: isoDate,
  startTime: time,
  endTime: z.union([time, z.literal("")]),
  venue: z.string().trim().max(160),
  description: z.string().trim().max(1000),
  status: status.default("draft"),
  sortOrder: z.number().int().min(0).max(9999),
});

export const sponsorSchema = z.object({
  name: z.string().trim().min(1, "Sponsor name is required").max(160),
  logoUrl: assetUrlOrEmpty,
  category: z.string().trim().max(80),
  websiteUrl: urlOrEmpty,
  description: z.string().trim().max(1000),
  status: status.default("draft"),
  sortOrder: z.number().int().min(0).max(9999),
});

export const faqSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(300),
  answer: z.string().trim().min(1, "Answer is required").max(2000),
  status: status.default("draft"),
  sortOrder: z.number().int().min(0).max(9999),
});

export const socialLinkSchema = z.object({
  platform: z.enum(["instagram", "facebook", "youtube", "linkedin", "other"]),
  label: z.string().trim().max(80),
  url: urlOrEmpty,
  status: status.default("draft"),
  sortOrder: z.number().int().min(0).max(9999),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  message: z.string().trim().min(1, "Message is required").max(1000),
  linkUrl: urlOrEmpty,
  status: status.default("draft"),
  sortOrder: z.number().int().min(0).max(9999),
});

export const ticketCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(120),
  description: z.string().trim().max(500),
  price: z.number().min(0, "Price cannot be negative"),
  benefits: z.array(z.string().trim().max(200)).max(12),
  capacity: z.number().int().min(0),
  soldCount: z.number().int().min(0),
  active: z.boolean(),
  status: status.default("draft"),
  sortOrder: z.number().int().min(0).max(9999),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type ScheduleEntry = z.infer<typeof scheduleEntrySchema> & { id: string };
export type Sponsor = z.infer<typeof sponsorSchema> & { id: string };
export type Faq = z.infer<typeof faqSchema> & { id: string };
export type SocialLink = z.infer<typeof socialLinkSchema> & { id: string };
export type Announcement = z.infer<typeof announcementSchema> & { id: string };
export type TicketCategory = z.infer<typeof ticketCategorySchema> & { id: string };

export type PublicTicket = Omit<TicketCategory, "price"> & { price?: number };

export interface PublicContent {
  settings: SiteSettings;
  schedule: ScheduleEntry[];
  sponsors: Sponsor[];
  faqs: Faq[];
  socials: SocialLink[];
  announcements: Announcement[];
  tickets: PublicTicket[];
}

export const contentSchemas = {
  schedule: scheduleEntrySchema,
  sponsors: sponsorSchema,
  faqs: faqSchema,
  socials: socialLinkSchema,
  announcements: announcementSchema,
  tickets: ticketCategorySchema,
};

export function isCollectionSection(value: string): value is CollectionSection {
  return (CONTENT_SECTIONS as readonly string[]).includes(value) && value !== "settings";
}
