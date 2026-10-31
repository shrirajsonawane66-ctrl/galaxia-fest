"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared bits of the performers admin UI, kept tiny so both the list page and
 * the lazily loaded editor can use one copy. */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]",
        checked ? "bg-emerald-500" : "bg-white/15"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm text-[var(--text-muted)]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[13px] text-[var(--text-muted)]">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1 block text-[13px] text-red-300">{error}</span>
      )}
    </label>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] md:min-h-0";
