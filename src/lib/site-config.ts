export const siteConfig = {
  name: "Galaxia i-Fest",
  edition: "2026",
  tagline: "WHERE MUSIC MEETS THE COSMOS",
  dateLabel: "17–19 DECEMBER · 2026",
  dateRange: "17–19 December 2026",
  venueShort: "WESTERN COLLEGE OF BUSINESS MANAGEMENT",
  venue: "Western College of Business Management",
  venueAddress: "Western College Campus, Main Ground, Mumbai, Maharashtra",
  description:
    "Three days. Four stages. Fifty thousand souls under one nebula sky. The largest college music festival returns for its most electrifying edition yet.",
  presentedBy: "Presented by Western College of Business Management",
  contactEmail: "hello@galaxiafest.in",
  contactPhone: "+91 98765 43210",
  socials: {
    instagram: "#",
    youtube: "#",
    x: "#",
  },
  links: {
    events: "/events",
    passes: "/#passes",
    admin: "/admin",
  },
  eventDays: [
    { label: "Day 1", date: "2026-12-17" },
    { label: "Day 2", date: "2026-12-18" },
    { label: "Day 3", date: "2026-12-19" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
