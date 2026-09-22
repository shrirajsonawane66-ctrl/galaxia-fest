import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial"],
  adjustFontFallback: true,
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial"],
  adjustFontFallback: true,
});
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
  preload: false, // only used for headings; avoid blocking LCP
  fallback: ["system-ui", "Arial"],
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050816",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Galaxia 2025 — Where Music Meets the Cosmos | Western College of Business Management",
  description: "Galaxia is the premier college music festival by Western College of Business Management — a galactic fusion of sound, light, and celebration. Dec 19–21, 2025.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Galaxia 2025 — Where Music Meets the Cosmos",
    description: "A galactic music festival experience at Western College of Business Management.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Galaxia 2025 — Where Music Meets the Cosmos",
    description: "A galactic music festival experience at Western College of Business Management.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable}`}>
      <head>
        {/* Preconnect to image CDNs — saves ~100-300ms DNS+TLS */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        {/* DNS prefetch for Supabase if used */}
        <link rel="dns-prefetch" href="https://*.supabase.co" />
      </head>
      <body className="antialiased bg-[#050816] text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
