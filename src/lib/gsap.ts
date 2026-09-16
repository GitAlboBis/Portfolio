"use client";

/**
 * Single GSAP registration point. Import gsap / ScrollTrigger / SplitText / Flip /
 * Observer / CustomEase / useGSAP from HERE everywhere so plugins register exactly
 * once. All plugins are free in GSAP 3.13+ (we ship 3.15).
 *
 * THE JOB ORDER — the two verbs of the sheet are registered here as named
 * CustomEases, mirroring `--ease-rule / --ease-stamp / --ease-sheet` in
 * globals.css 1:1 (change them together). Components never write literal
 * curves: they say `ease: EASE.rule` via src/lib/motion.ts.
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

  // The sheet's verbs — JS mirror of --ease-* in globals.css :root (§C.6).
  CustomEase.create("rule", "0.16,1,0.3,1"); // RULE-IN — rules drawing themselves
  CustomEase.create("stamp", "0.2,0.9,0.25,1.03"); // STAMP — impact, hair of overshoot
  CustomEase.create("sheet", "0.65,0,0.35,1"); // route cover — the paper sheet rising
}

export { gsap, ScrollTrigger, SplitText, Flip, Observer, CustomEase, useGSAP };
