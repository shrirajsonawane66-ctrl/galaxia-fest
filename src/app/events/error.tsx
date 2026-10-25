"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center text-cream">
      <h1 className="font-orbitron text-2xl font-bold">Could not load events</h1>
      <p className="mt-3 max-w-md text-sm text-cream/60">
        Something went wrong while fetching the schedule. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-fest-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-glow"
      >
        <RotateCcw className="h-4 w-4" aria-hidden /> Retry
      </button>
    </div>
  );
}
