import { MemberCard } from "@/components/ui/testimonial";
import {
  featuredCoreMembers,
  remainingCoreMembers,
} from "@/lib/core-members";
import { cn } from "@/lib/utils";

export type CoreMembersSectionProps = {
  className?: string;
};

export function CoreMembersSection({ className }: CoreMembersSectionProps) {
  return (
    <section
      id="core-members"
      aria-labelledby="core-members-heading"
      className={cn("border-t border-white/10 pt-12 md:pt-16", className)}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl">
          <h2
            id="core-members-heading"
            className="font-blackletter text-4xl leading-[1.05] text-[var(--text-strong)] sm:text-5xl md:text-6xl"
          >
            Galaxia Core Members
          </h2>
          <p className="type-lead mt-4">
            The people who keep the festival in orbit, behind the scenes and on the ground.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl items-start gap-6 sm:grid-cols-2 md:mt-12">
          {featuredCoreMembers.map((member) => (
            <MemberCard key={member.slug} member={member} featured />
          ))}
        </div>

        <div className="mt-6 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {remainingCoreMembers.map((member) => (
            <MemberCard key={member.slug} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
