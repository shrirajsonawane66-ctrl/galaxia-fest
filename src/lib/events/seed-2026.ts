import rawSeeds from "../../../scripts/events-2026.json";

export type FestivalEventSeed = {
  day: 1 | 2;
  sortOrder: number;
  title: string;
  theme: string;
  thumbnail: string;
  rules: string[];
  whatsappUrl?: string | null;
  formUrl?: string | null;
};

/**
 * The 23 official Galaxia i-Fest 2026 events, transcribed from the corrected
 * rule documents in `core/` and `scripts/events-2026.json`.
 *
 * All rows are drafts with no dates or invented details. WhatsApp links are
 * included where provided; the admin fills in dates and publishes when ready.
 */
export const festival2026Seeds: FestivalEventSeed[] = rawSeeds as FestivalEventSeed[];

export const FESTIVAL_SEED_IDS = festival2026Seeds.map(
  (_, index) => `20260000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`
);
