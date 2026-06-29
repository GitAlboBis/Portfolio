"use client";

/**
 * Single GSAP registration point. Import gsap / ScrollTrigger / SplitText / useGSAP
 * from HERE everywhere so plugins register exactly once. SplitText and ScrollTrigger
 * are free in GSAP 3.13+ (we ship 3.15) — no club membership needed.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
