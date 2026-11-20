// @ts-check
/**
 * page.js — (wave 1, lane WORK) where the reader is on the whole page, for a page that is ONE continuous shot: every
 * scene of the page asks the same function for the eye, so when the host mixes two scenes' poses by weight it mixes
 * two equal poses and the eye never jumps.
 *
 *   import { span, pageK } from "./lib/page.js";
 *   const g = span(c, '[data-stage="gallery"]');   // { top, bottom } in document px (null when absent)
 *   const k = pageK(c);                             // 0 at the top of the page .. 1 at the bottom
 *
 * Layout is read at most every 1.5 s of host time and whenever the viewport changes (one getBoundingClientRect per
 * section): never per frame.
 */

/** @type {{ key: string, t: number, max: number, spans: Record<string, { top: number, bottom: number } | null> }} */
const CACHE = { key: "", t: -1e9, max: 1, spans: {} };

/** @param {any} c */
function fresh(c) {
  const key = c.vw + "x" + c.vh, t = c.time || 0;
  if (CACHE.key !== key || t - CACHE.t > 1.5 || t < CACHE.t) {
    CACHE.key = key; CACHE.t = t; CACHE.spans = {};
    CACHE.max = Math.max(1, document.documentElement.scrollHeight - c.vh);
  }
}

/** a section's place in the document (px) @param {any} c @param {string} sel */
export function span(c, sel) {
  fresh(c);
  if (!(sel in CACHE.spans)) {
    const el = document.querySelector(sel);
    if (!el) CACHE.spans[sel] = null;
    else { const r = el.getBoundingClientRect(); CACHE.spans[sel] = { top: r.top + c.scrollY, bottom: r.bottom + c.scrollY }; }
  }
  return CACHE.spans[sel];
}

/** 0 at the top of the page, 1 at the bottom @param {any} c */
export function pageK(c) { fresh(c); return Math.max(0, Math.min(1, c.scrollY / CACHE.max)); }

/** how far the reader is through a section while it holds the screen: 0 when its top reaches the top of the viewport,
 *  1 when its bottom reaches the bottom (clamped) @param {any} c @param {{ top: number, bottom: number } | null} s */
export function through(c, s) {
  if (!s) return 0;
  return Math.max(0, Math.min(1, (c.scrollY - s.top) / Math.max(1, s.bottom - c.vh - s.top)));
}
