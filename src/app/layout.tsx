import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Outfit } from "next/font/google";
import "./globals.css";
import { IntroVideo } from "@/components/ui/intro-video";
import NebulaBackground from "@/components/nebula-background";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  // Variable font: one file covers every weight the type scale uses.
  display: "swap",
  // Not preloaded: the wordmark above the fold is an image, so the display face
  // is only needed further down the page and should not compete with the LCP
  // image for the first round trip.
  preload: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  adjustFontFallback: true,
});
const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  // Variable font: one file covers 400–700 instead of four static instances.
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial"],
  adjustFontFallback: true,
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
