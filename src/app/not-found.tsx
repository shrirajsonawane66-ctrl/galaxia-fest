import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-24 text-center text-[var(--text-body)]">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-8 sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Sparkles className="h-6 w-6 text-[var(--accent)]" aria-hidden />
        </div>
        <p className="type-small mt-6">Error 404</p>
        <h1 className="type-h2 mt-3">Lost in the cosmos</h1>
        <p className="type-body mx-auto mt-4 max-w-sm">
          This page drifted out of orbit. Head back to the festival and keep the night going.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="galaxy" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft aria-hidden />
              Back to Galaxia
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
            <Link href="/events">View events</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
