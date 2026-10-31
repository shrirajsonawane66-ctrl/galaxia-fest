import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      // Admin-managed events may reference any HTTPS image host.
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
  },

  eslint: {
    // Pre-existing lint debt in legacy admin/booking files. Run `npm run lint`
    // separately; type checking still blocks broken builds.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-slot",
      "qrcode",
    ],
  },

  // Cache static assets aggressively in production; keep dynamic routes fresh.
  // Never apply the immutable header in development: dev chunk URLs are stable
  // (e.g. /_next/static/chunks/app/page.js), so a year-long cache would keep
  // serving modules from an older build and crash with "reading 'call'".
  async headers() {
    const isProduction = process.env.NODE_ENV === "production"

    return [
      {
        // The soundtrack can be replaced in place. Revalidate by ETag instead
        // of allowing an immutable response to preserve the previous MP3.
        source: "/audio/:path*.mp3",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      ...(isProduction
        ? [
            {
              source: "/images/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
            {
              source: "/fonts/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
            {
              source:
                "/(.*)\\.(js|css|woff|woff2|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
