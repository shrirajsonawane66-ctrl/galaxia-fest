import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-24 text-center text-cream">
      <div className="glass w-full max-w-lg rounded-3xl border border-white/10 p-8 sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5">
          <Sparkles className="h-6 w-6 text-cyan-300" aria-hidden />
        </div>
        <p className="mt-6 text-xs font-space uppercase tracking-[0.4em] text-white/45">Error 404</p>
        <h1 className="mt-3 font-orbitron text-4xl font-black leading-tight sm:text-5xl">
          Lost in the <span className="text-gradient-galaxy">cosmos</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-cream/60">
          This page drifted out of orbit. Head back to the festival and keep the night going.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="galaxy" className="w-full rounded-full sm:w-auto">
            <Link href="/">
              <ArrowLeft aria-hidden />
              Back to Galaxia
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
            <Link href="/events">View Events</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
