import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/site-nav";
import { listCommits } from "@/lib/changelog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Changelog | Galaxia i-Fest",
  description: "Every commit that shaped the Galaxia i-Fest website.",
  openGraph: {
    title: "Changelog | Galaxia i-Fest",
    description: "Every commit that shaped the Galaxia i-Fest website.",
    type: "website",
    url: "/changelog",
  },
};

function formatDate(value: string): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default async function ChangelogPage() {
  const commits = await listCommits();
  const deployed = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

  return (
    <div className="relative min-h-[100svh] overflow-x-clip text-[var(--text-body)]">
      <SiteNav />
      <div className="noise pointer-events-none fixed inset-0 z-[1]" />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-16 pt-[calc(64px+env(safe-area-inset-top)+24px)] sm:px-6 sm:pb-24 sm:pt-32 md:px-10 md:pb-32 md:pt-40">
        <h1 className="type-h1">Changelog</h1>
        <p className="type-lead mt-6">
          Every commit that shaped this site, newest first.
        </p>
        {deployed && (
          <p className="type-small mt-4">
            Currently deployed: <span className="font-mono">{deployed}</span>
          </p>
        )}

        {commits.length === 0 ? (
          <p className="type-body mt-12">
            Commits could not be loaded right now.{" "}
            <a
              href="https://github.com/shrirajsonawane66-ctrl/galaxia-fest/commits/main"
              className="underline underline-offset-4"
            >
              View them on GitHub
            </a>
            .
          </p>
        ) : (
          <ul className="mt-12 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            {commits.map((commit) => (
              <li key={commit.sha}>
                <a
                  href={commit.url}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs text-[var(--text-strong)]">
                      {commit.shortSha}
                    </span>
                    <span className="type-body min-w-0 break-words">{commit.message}</span>
                  </span>
                  <span className="type-small shrink-0 sm:text-right">
                    {commit.author} · {formatDate(commit.date)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <p className="type-small mt-8">
          <Link href="/" className="underline underline-offset-4">
            Back to the festival
          </Link>
        </p>
      </main>
    </div>
  );
}
