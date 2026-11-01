import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { IntroVideo } from "@/components/ui/intro-video";
import NebulaBackground from "@/components/nebula-background";

// Self-hosted latin subsets (copied once from the Google Fonts build, OFL).
// Declaring them locally instead of via `next/font/google` does two things:
//   1. only the two files we actually use ship — the old setup also pulled a
//      18 kB `latin-ext` face and served three font requests on first load;
//   2. `preload: true` emits a real `<link rel="preload">` (it did not for the
//      CSS-variable setup with google fonts), so the files start downloading
//      with the document instead of after the stylesheet has been parsed.
const display = localFont({
  src: "../fonts/bricolage-latin.woff2",
  variable: "--font-display",
  weight: "200 800",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});
const body = localFont({
  src: "../fonts/outfit-latin.woff2",
  variable: "--font-body",
  weight: "100 900",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial"],
  adjustFontFallback: "Arial",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06123a",
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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable}`}
    >
      <head>
        {/* Preconnect to image CDNs — saves ~100-300ms DNS+TLS */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      </head>
      <body className="overflow-x-clip font-sans antialiased">
        <NebulaBackground />
        <IntroVideo
          src="/videos/intro.mp4"
          mobileSrc="/videos/intro-480.mp4"
          poster="/videos/intro-poster.jpg"
          allowSkip
        />
        {children}
      </body>
    </html>
  );
}
