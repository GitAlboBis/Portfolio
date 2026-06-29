import { TechCloud } from "@/components/tech-cloud";

/*
  CLEAN-SLATE PAGE (2026-06-29)
  ─────────────────────────────
  A bare scaffold so `bun dev` compiles and both surviving 3D engines are visible
  while the real site is rebuilt from the design directives:

    • #hero section (full viewport) — the fixed WebGPU water "A" (in CanvasHost)
      reads through it. WaterBallHero observes #hero to idle the GPU off-screen.
    • sphere section — the three.js tech-stack constellation (TechCloud).

  No copy, no nav, no real layout — that all gets designed next.
*/
export default function Home() {
  return (
    <main id="main" className="relative">
      {/* Hero viewport — the fixed fluid "A" canvas shows through this empty band. */}
      <section id="hero" aria-hidden className="relative h-dvh" />

      {/* Tech-stack sphere — the second kept engine, on the abyss base. */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-24">
        <TechCloud className="w-full" />
      </section>
    </main>
  );
}
