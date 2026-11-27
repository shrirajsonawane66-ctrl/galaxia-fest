import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://galaxia-fest.vercel.app";
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/core-members`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/sponsorship`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}