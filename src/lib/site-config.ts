export const siteConfig = {
  name: "Galaxia i-Fest",
  edition: "2025",
  tagline: "WHERE MUSIC MEETS THE COSMOS",
  dateLabel: "DEC 19–20 · 2025",
  dateRange: "Dec 19–20, 2025",
  venueShort: "WESTERN COLLEGE OF BUSINESS MANAGEMENT",
  venue: "Western College of Business Management",
  venueAddress: "Western College Campus, Main Ground, Mumbai, Maharashtra",
  description:
    "Two days. Four stages. Fifty thousand souls under one nebula sky. The largest college music festival returns for its most electrifying edition yet.",
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
    { label: "Day 1", date: "2025-12-19" },
    { label: "Day 2", date: "2025-12-20" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
