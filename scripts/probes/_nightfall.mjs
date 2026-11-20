// SCRATCH visual gate for the Nightfall stack (home day→night handoff). NOT committed.
//   node _nightfall.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });
const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const passes = [
  { name: "nf-desktop", width: 1440, height: 900, dpr: 1, shots: true },
  { name: "nf-tall", width: 1920, height: 1080, dpr: 1 },
  // viewport TALLER than the Tech card: the geometric covered-gate must flag
  // full occlusion well before scrub progress 1 (band edge past card top)
  { name: "nf-portrait", width: 1280, height: 2000, dpr: 1 },
  { name: "nf-mobile", width: 390, height: 844, dpr: 2, mobile: true, shots: true },
  { name: "nf-reduced", width: 1440, height: 900, dpr: 1, reduce: true },
];

const browser = await chromium.launch();
let fail = 0;
for (const p of passes) {
  const ctx = await browser.newContext({
    viewport: { width: p.width, height: p.height },
    isMobile: !!p.mobile,
    deviceScaleFactor: p.dpr,
    reducedMotion: p.reduce ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3200);

  if (p.reduce) {
    // flat: no overlap (cover margin 0), no pin, no veil — tech then night in plain flow
    const flat = await page.evaluate(() => {
      const cover = document.getElementById("nightfall");
      const card = document.querySelector(".nightfall-card");
      return {
        margin: cover ? getComputedStyle(cover).marginTop : "?",
        position: card ? getComputedStyle(card).position : "?",
        veil: !!document.querySelector(".nightfall-veil") &&
          getComputedStyle(document.querySelector(".nightfall-veil")).display,
      };
    });
    const ok = flat.margin === "0px" && flat.position === "static" && flat.veil === "none" && errors.length === 0;
    if (!ok) fail++;
    console.log(`[${p.name}] ${ok ? "PASS" : "FAIL"} — margin=${flat.margin} pos=${flat.position} veil=${flat.veil} · errors: ${errors.length}`);
    for (const e of errors) console.log("   - " + e.slice(0, 160));
    await ctx.close();
    continue;
  }

  // scroll so the night edge sits mid-viewport (cover half done)
  await page.evaluate(() => {
    const cover = document.getElementById("nightfall");
    if (cover) window.scrollTo(0, cover.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5);
  });
  await page.waitForTimeout(1400);
  const mid = await page.evaluate(() => {
    const card = document.querySelector(".nightfall-card");
    const veil = document.querySelector(".nightfall-veil");
    const cover = document.getElementById("nightfall");
    const m = new DOMMatrixReadOnly(getComputedStyle(card).transform === "none" ? undefined : getComputedStyle(card).transform);
    return {
      scale: m.a,
      veil: parseFloat(getComputedStyle(veil).opacity),
      coverTop: Math.round(cover.getBoundingClientRect().top),
      cardVisible: card.getBoundingClientRect().bottom > 0,
      cardBottom: Math.round(card.getBoundingClientRect().bottom),
      vh: window.innerHeight,
      pos: getComputedStyle(card).position, // sticky ⇒ [data-nf-ready] armed
      covered: card.hasAttribute("data-scene-covered"), // must be false mid-handoff
    };
  });
  if (p.shots) await page.screenshot({ path: resolve(outDir, `${p.name}-mid.png`) });

  // geometric occlusion (only meaningful when the pinned card is shorter than
  // the viewport, i.e. cardTop > 0): park the band edge just past the card's
  // top — the card is fully hidden while progress is still well under 1, and
  // [data-scene-covered] must already be set (icon cloud asleep).
  let occl = { skipped: true, ok: true };
  const pinnedTop = await page.evaluate(
    () => document.querySelector(".nightfall-card").getBoundingClientRect().top,
  );
  if (pinnedTop > 60) {
    await page.evaluate(() => {
      const cover = document.getElementById("nightfall");
      const cardTop = document.querySelector(".nightfall-card").getBoundingClientRect().top;
      window.scrollBy(0, cover.getBoundingClientRect().top - (cardTop - 30));
    });
    await page.waitForTimeout(1400);
    occl = await page.evaluate(() => {
      const card = document.querySelector(".nightfall-card");
      const coverTop = Math.round(document.getElementById("nightfall").getBoundingClientRect().top);
      const covered = card.hasAttribute("data-scene-covered");
      return { skipped: false, coverTop, covered, ok: covered && coverTop > 60 };
    });
  }

  // full cover: night top at viewport top
  await page.evaluate(() => {
    const cover = document.getElementById("nightfall");
    if (cover) window.scrollTo(0, cover.getBoundingClientRect().top + window.scrollY - 1);
  });
  await page.waitForTimeout(1400);
  const end = await page.evaluate(() => {
    const card = document.querySelector(".nightfall-card");
    const m = new DOMMatrixReadOnly(getComputedStyle(card).transform === "none" ? undefined : getComputedStyle(card).transform);
    const veil = document.querySelector(".nightfall-veil");
    return { scale: m.a, veil: parseFloat(getComputedStyle(veil).opacity) };
  });
  if (p.shots) await page.screenshot({ path: resolve(outDir, `${p.name}-covered.png`) });

  // to the very bottom: footer must be reachable, contact intact, and the card
  // must carry [data-scene-covered] so the icon cloud's rAF loop sleeps.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1800);
  const bottom = await page.evaluate(() => {
    const f = document.querySelector("footer");
    const r = f?.getBoundingClientRect();
    const card = document.querySelector(".nightfall-card");
    return {
      footer: r ? Math.round(window.innerHeight - r.bottom) : -9999,
      covered: !!card && card.hasAttribute("data-scene-covered"),
    };
  });
  if (p.shots) await page.screenshot({ path: resolve(outDir, `${p.name}-bottom.png`) });

  // mid-cover: card pinned (bottom ≈ viewport bottom, sticky armed), receding
  // (scale<1, veil>0), NOT yet flagged covered; end: veil at the new 0.55 max.
  const pinOk = Math.abs(mid.cardBottom - mid.vh) < 8;
  const ok =
    errors.length === 0 &&
    mid.cardVisible && pinOk && mid.pos === "sticky" && !mid.covered &&
    mid.scale < 0.995 && mid.veil > 0.1 &&
    occl.ok &&
    end.scale <= 0.96 && end.veil > 0.5 &&
    Math.abs(bottom.footer) < 6 && bottom.covered;
  if (!ok) fail++;
  console.log(
    `[${p.name}] ${ok ? "PASS" : "FAIL"} — mid: scale=${mid.scale.toFixed(3)} veil=${mid.veil.toFixed(2)} cardBottom=${mid.cardBottom}/${mid.vh} pos=${mid.pos} covered=${mid.covered} coverTop=${mid.coverTop} · occl: ${occl.skipped ? "n/a (card ≥ viewport)" : `covered=${occl.covered}@coverTop=${occl.coverTop}`} · end: scale=${end.scale.toFixed(3)} veil=${end.veil.toFixed(2)} · footer Δ=${bottom.footer} covered=${bottom.covered} · errors: ${errors.length}`,
  );
  for (const e of errors) console.log("   - " + e.slice(0, 160));
  await ctx.close();
}
await browser.close();
console.log(fail === 0 ? "ALL PASS" : `${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
