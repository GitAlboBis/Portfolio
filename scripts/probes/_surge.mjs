// SCRATCH visual gate for the TideSurge on the home Contact headline. NOT committed.
// Passes include 1920x1080 + 1600x1200 (tall viewports where an unclamped scrub
// end would freeze mid-surge — regression guard for the clamp() fix): at absolute
// max scroll every char must be settled (identity transform, opacity 1).
//   node _surge.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });

const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const passes = [
  { name: "surge-desktop", width: 1440, height: 900, dpr: 1, shots: true },
  { name: "surge-tall-1080", width: 1920, height: 1080, dpr: 1 },
  { name: "surge-tall-1200", width: 1600, height: 1200, dpr: 1 },
  { name: "surge-mobile", width: 390, height: 844, dpr: 2, mobile: true, shots: true },
  { name: "surge-desktop-reduced", width: 1440, height: 900, dpr: 1, reduce: true, shots: true },
];

const browser = await chromium.launch();
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
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3200); // preloader

  // approach the band with real wheel steps so the scrub plays…
  await page.evaluate(() => {
    const el = document.getElementById("contact");
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight);
  });
  await page.waitForTimeout(1200);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(420);
    if (p.shots && i >= 1) await page.screenshot({ path: resolve(outDir, `${p.name}-t${i}.png`) });
  }
  // …then force absolute max scroll and wait out the scrub lag
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2600);
  if (p.shots) await page.screenshot({ path: resolve(outDir, `${p.name}-settled.png`) });

  // settle check: every split char at identity/opaque (reduced pass: no chars → text intact)
  const settle = await page.evaluate(() => {
    const h2 = document.querySelector("#contact h2");
    if (!h2) return { ok: false, why: "no h2" };
    const chars = h2.querySelectorAll("div div");
    if (chars.length === 0) return { ok: h2.textContent.trim().length > 0, why: "unsplit (reduced?)" };
    let bad = 0;
    let worst = "";
    chars.forEach((c) => {
      const cs = getComputedStyle(c);
      const t = cs.transform;
      const o = parseFloat(cs.opacity);
      const settled = (t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)") && o > 0.999;
      if (!settled) { bad++; worst = `${t} o=${o}`; }
    });
    return { ok: bad === 0, why: bad ? `${bad}/${chars.length} unsettled, e.g. ${worst}` : `all ${chars.length} settled` };
  });
  console.log(`[${p.name}] settle: ${settle.ok ? "PASS" : "FAIL"} (${settle.why}) · console errors: ${errors.length}`);
  for (const e of errors) console.log("   - " + e.slice(0, 160));
  await ctx.close();
}
await browser.close();
console.log("done -> .shots/surge-*");
