"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import type { Performer } from "@/lib/performers";

/**
 * Shared by the public gallery and the admin live preview. Keeping this in one
 * file guarantees the admin preview is the same card the homepage renders.
 */
export function PerformerCard({ performer }: { performer: Performer }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [performer.image]);

  const initials = performer.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const showPlaceholder = failed || !performer.image;

  return (
    <div className="group relative h-[200px] w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0a1f5c] sm:h-[300px] md:h-[400px]">
      {showPlaceholder ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#0a1f5c] to-[#06123a]">
          <span className="font-display text-5xl text-[var(--text-strong)] md:text-7xl">{initials}</span>
        </div>
      ) : (
        <Image
          src={performer.image}
          alt={performer.name}
          fill
          sizes="(max-width: 768px) 50vw, 22vw"
          onError={() => setFailed(true)}
          className="object-cover object-top opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06123A]/95 via-[#06123A]/55 to-transparent p-3 md:p-4">
        <p className="type-h3">{performer.name}</p>
        <p className="type-small mt-1">
          {performer.role} · {performer.year}
        </p>
      </div>
    </div>
  );
}

export const ImageCard = PerformerCard;
