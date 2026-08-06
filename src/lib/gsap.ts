"use client";

/**
 * Single GSAP registration point. Import gsap / ScrollTrigger / SplitText / Flip /
 * Observer / CustomEase / useGSAP from HERE everywhere so plugins register exactly
 * once. All plugins are free in GSAP 3.13+ (we ship 3.15).
 *
 * LA MAREA — the site's signature eases are registered here as named CustomEases,
 * mirroring the CSS `--ease-*` tokens in globals.css 1:1 (change them together).
 * Components never write literal curves: they say `ease: EASE.tide` via the token
 * table in src/lib/motion.ts.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Observer, CustomEase, useGSAP);

  // Signature curves — JS mirror of --ease-* in globals.css @theme.
  CustomEase.create("tide", "0.16,1,0.3,1"); // entrances & settles — the default voice
  CustomEase.create("dive", "0.65,0,0.35,1"); // curtains, wipes, state transitions
  CustomEase.create("drift", "0.33,0,0.67,1"); // ambient, continuous drift
  CustomEase.create("crest", "0.34,1.56,0.64,1"); // wave-overshoot micro-emphasis
  // era-residence's horizontal-scroller curve, verbatim (their `horScroll`).
  // The signature of that effect is that the track does NOT track the wheel
  // linearly: it starts slow, accelerates through the middle and brakes into the
  // last panel. Paired with scrub 0.25 — see AboutHorizontal.
  CustomEase.create("horScroll", "0.25,0,0.75,1");
}

export { gsap, ScrollTrigger, SplitText, Flip, Observer, CustomEase, useGSAP };
