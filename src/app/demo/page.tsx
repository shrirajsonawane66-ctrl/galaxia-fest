import { Component as NavyGlowBackground } from "@/components/ui/background-snippets";

export default function Demo() {
  return (
    <NavyGlowBackground>
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-24 text-center text-white">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Deep blue, perfectly lit
        </h1>
        <p className="mt-4 text-white/70">
          A grainy navy gradient with periwinkle and royal-blue glows.
        </p>
      </main>
    </NavyGlowBackground>
  );
}
