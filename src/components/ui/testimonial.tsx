"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoreMember } from "@/lib/core-members";

const COLLAPSED_BIO_HEIGHT = "5.75rem";
const EXPANDED_BIO_MAX_HEIGHT = "40rem";

export type MemberCardProps = {
  member: CoreMember;
  featured?: boolean;
  className?: string;
  priority?: boolean;
};

export function MemberCard({
  member,
  featured = false,
  className,
  priority = false,
}: MemberCardProps) {
  const [expanded, setExpanded] = useState(false);
  const bioId = useId();
  const { name, role, bio, image, focalPoint = "50% 20%", socials } = member;
  const hasSocials = Boolean(socials?.instagram || socials?.linkedin);

  return (
    <article
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b1430] to-[#060c1f] text-[var(--text-body)] shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]",
        featured
          ? "mx-auto max-w-sm border-[#C4B5FD]/30 shadow-[0_0_55px_-25px_rgba(196,181,253,0.55)]"
          : "mx-auto max-w-80",
        className,
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-white/[0.04]",
          featured ? "h-[340px]" : "h-[300px]",
        )}
      >
        <Image
          src={image}
          alt={`Portrait of ${name}, ${role}`}
          fill
          sizes={
            featured
              ? "(min-width: 640px) 372px, 90vw"
              : "(min-width: 1280px) 302px, (min-width: 1024px) 30vw, (min-width: 640px) 320px, 90vw"
          }
          className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
          style={{ objectPosition: focalPoint }}
          priority={priority}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b1430] via-[#0b1430]/70 to-transparent"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="min-h-[1.75rem] font-display text-xl font-bold leading-tight text-[var(--text-strong)]">
          {name}
        </h3>
        <p className="mt-1.5 min-h-[1.5rem] bg-gradient-to-r from-[#C4B5FD] via-[#F0ABFC] to-[#FF8A94] bg-clip-text text-[13px] font-semibold uppercase tracking-[0.16em] text-transparent">
          {role}
        </p>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div
            id={bioId}
            className="overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none"
            style={{
              maxHeight: expanded ? EXPANDED_BIO_MAX_HEIGHT : COLLAPSED_BIO_HEIGHT,
            }}
          >
            <p
              className={cn(
                "text-sm leading-relaxed text-[var(--text-body)]",
                !expanded && "line-clamp-4",
              )}
            >
              {bio}
            </p>
          </div>

          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={bioId}
            onClick={() => setExpanded((value) => !value)}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-[13px] font-medium text-[var(--text-strong)] transition-colors hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"
          >
            {expanded ? "Show less" : "Read more"}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-4 w-4 transition-transform duration-300 motion-reduce:transition-none",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>

        {hasSocials && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {socials?.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label={`${name} on Instagram`}
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/15 px-3 text-[13px] font-medium text-[var(--text-body)] transition-colors hover:border-white/30 hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"
              >
                Instagram
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            )}
            {socials?.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`${name} on LinkedIn`}
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/15 px-3 text-[13px] font-medium text-[var(--text-body)] transition-colors hover:border-white/30 hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"
              >
                LinkedIn
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
