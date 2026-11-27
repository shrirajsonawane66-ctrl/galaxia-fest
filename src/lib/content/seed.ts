import { passesSeed, eventSeed } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";
import type { ContentSection, SiteSettings } from "./types";

const now = "2026-01-01T00:00:00.000Z";

export const defaultSettings: SiteSettings = {
  title: "Galaxia i-Fest",
  tagline: siteConfig.tagline,
  description: siteConfig.description,
  theme: "Where Music Meets the Cosmos",
  aboutTitle: eventSeed.about_title,
  aboutText1: eventSeed.about_text1,
  aboutText2: eventSeed.about_text2,
  collegeName: eventSeed.college_name,
  dateLabel: "17–19 December 2026",
  venueName: "",
  venueAddress: "",
  mapsUrl: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  bookingInstructions: "",
  bookingUrl: "",
  showPrices: false,
};

type SeedRow = {
  id: string;
  section: ContentSection;
  data: Record<string, unknown>;
  status: "draft" | "published";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const ticketRows: SeedRow[] = passesSeed.map((pass, index) => ({
  id: `00000000-0000-4000-9000-${String(index + 1).padStart(12, "0")}`,
  section: "tickets",
  data: {
    name: pass.name,
    description: pass.description,
    price: pass.price,
    benefits: pass.benefits,
    capacity: pass.capacity,
    soldCount: pass.sold_count,
    active: pass.is_active,
  },
  status: "draft",
  sortOrder: pass.display_order,
  createdAt: now,
  updatedAt: now,
}));

export const seedContentRows: SeedRow[] = [
  {
    id: "settings",
    section: "settings",
    data: defaultSettings as unknown as Record<string, unknown>,
    status: "published",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  },
  ...ticketRows,
];
