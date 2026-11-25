import { CoreMembersSection } from "@/components/sections/core-members";

/**
 * Standalone preview for the Core Members section. The production homepage
 * renders the same section inside the About block.
 */
export default function Demo() {
  return (
    <main className="min-h-screen bg-[#06123A] text-[var(--text-strong)]">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 md:px-10 md:py-28">
        <CoreMembersSection className="border-t-0 pt-0 md:pt-0" />
      </div>
    </main>
  );
}
