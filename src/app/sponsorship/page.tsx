import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Mail, Phone, Users } from "lucide-react";
import SiteNav from "@/components/site-nav";
import { getPublicContent } from "@/lib/content/store";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sponsorship | Galaxia i-Fest",
  description:
    "Meet the partners powering Galaxia i-Fest 2026 and find out how to become a sponsor.",
  openGraph: {
    title: "Sponsorship | Galaxia i-Fest",
    description:
      "Meet the partners powering Galaxia i-Fest 2026 and find out how to become a sponsor.",
    type: "website",
    url: "/sponsorship",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sponsorship | Galaxia i-Fest",
    description:
      "Meet the partners powering Galaxia i-Fest 2026 and find out how to become a sponsor.",
  },
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
      <CalendarDays className="h-7 w-7 text-[var(--text-muted)]" aria-hidden />
      <p className="type-body mt-3">{message}</p>
    </div>
  );
}

export default async function SponsorshipPage() {
  const { settings, sponsors } = await getPublicContent();
  const contactEmail = settings.contactEmail.trim();

  return (
    <div className="relative min-h-[100svh] overflow-x-clip text-[var(--text-body)]">
      <SiteNav />
      <div className="noise pointer-events-none fixed inset-0 z-[1]" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-[calc(64px+env(safe-area-inset-top)+24px)] sm:px-6 sm:pb-24 sm:pt-32 md:px-10 md:pb-32 md:pt-40">
        <div className="max-w-4xl">
          <p className="type-small text-[var(--accent)]">
            {settings.dateLabel || "Galaxia i-Fest 2026"}
          </p>
          <h1 className="type-h1 mt-4">Sponsorship</h1>
          <p className="type-lead mt-6">
            Meet the partners powering Galaxia i-Fest 2026. Sponsor details are published here as
            soon as they are confirmed.
          </p>
        </div>

        <section className="mt-12 md:mt-16" aria-labelledby="sponsors-heading">
          <h2 id="sponsors-heading" className="type-h2">
            Our partners
          </h2>
          {sponsors.length === 0 ? (
            <div className="mt-8">
              <EmptyState message="Sponsorship Details Coming Soon" />
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
              {sponsors.map((sponsor) => (
                <article
                  key={sponsor.id}
                  className="flex h-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center"
                >
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="h-16 w-auto max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 font-display text-lg text-[var(--text-strong)]">
                      {sponsor.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="type-body text-[var(--text-strong)]">{sponsor.name}</div>
                  {sponsor.category && (
                    <span className="type-small rounded-full border border-white/10 px-3 py-1">
                      {sponsor.category}
                    </span>
                  )}
                  {sponsor.description && (
                    <p className="type-body text-[14px]">{sponsor.description}</p>
                  )}
                  {sponsor.websiteUrl && (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`type-small mt-auto inline-flex min-h-11 items-center gap-1 text-[var(--accent)] sm:min-h-0 ${focusRing}`}
                    >
                      Website <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 md:mt-16" aria-labelledby="become-sponsor-heading">
          <h2 id="become-sponsor-heading" className="type-h2">
            Become a sponsor
          </h2>
          <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 md:gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <p className="type-body">
                Partner with Galaxia i-Fest and help bring three days of music, art, technology and
                sport to campus.
              </p>
              {settings.collegeName && (
                <p className="type-small mt-4">Presented by {settings.collegeName}</p>
              )}
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <div className="type-small text-[var(--text-strong)]">Sponsorship enquiries</div>
              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}?subject=Galaxia%20i-Fest%20sponsorship%20enquiry`}
                  className={`type-body inline-flex min-h-11 items-center gap-2 text-[var(--accent)] ${focusRing}`}
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden /> {contactEmail}
                </a>
              ) : (
                <p className="type-body">Contact details will be published here when confirmed.</p>
              )}
              {settings.contactName && (
                <div className="type-body flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
                  {settings.contactName}
                </div>
              )}
              {settings.contactPhone && (
                <div className="type-body flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
                  {settings.contactPhone}
                </div>
              )}
            </div>
          </div>
        </section>

        <Link
          href="/events"
          className={`type-small mt-12 inline-flex min-h-11 items-center gap-2 text-[var(--accent)] md:mt-16 ${focusRing}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to events
        </Link>
      </main>
    </div>
  );
}
