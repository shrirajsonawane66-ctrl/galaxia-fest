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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-[var(--text-body)]">
      <h1 className="type-h2 text-[var(--text-strong)]">Could not load events</h1>
      <p className="type-body mt-3 max-w-md">
        Something went wrong while fetching the schedule. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#E5121F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF1F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"
      >
        <RotateCcw className="h-4 w-4" aria-hidden /> Retry
      </button>
    </div>
  );
}
