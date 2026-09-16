"use client";

/*
  ╔════════════════════════════════════════════════════════════════════════╗
  ║  TEMPORARY GATE ROUTE — WP-3 — DELETE IN WP-9                          ║
  ║  /dev/bench: the test bench on its own, so the engine can be verified  ║
  ║  (fluid moving inside the ruled box, live readouts, LIVE stamp, the    ║
  ║  no-WebGPU / reduced-motion stills, dispose on route change) before    ║
  ║  WP-4 mounts <TestBench/> in the first viewport of the home sheet.     ║
  ║  No copy is invented here: every string comes from dict.ts.            ║
  ╚════════════════════════════════════════════════════════════════════════╝
*/
import Link from "next/link";
import { useDict } from "@/content/dict";
import { TestBench } from "@/components/bench/TestBench";

export default function DevBenchPage() {
  const t = useDict();
  return (
    <main id="main" className="sheet pb-[var(--section-gap)] pt-[var(--section-gap)]">
      <TestBench />
      {/* dispose check: leaving the route must unmount CanvasHost (device destroyed) */}
      <p className="mt-10">
        <Link href="/about" className="link f-meta">
          {t.about.captions.owner}
        </Link>
      </p>
      {/* Verification runway (WP-3 gate, deleted with this route in WP-9): two
          viewports of empty sheet so the bench box can actually be scrolled OUT
          of view — that is how the IntersectionObserver idle gate of
          WaterBallHero is proven, and how the resume is proven after it. Empty
          and aria-hidden: no invented copy on a printed page. */}
      <div aria-hidden className="h-[200vh]" />
    </main>
  );
}
