// SCRATCH visual gate for the /work runway spotlight + odometer. NOT committed.
//   node _runway.mjs [label]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const label = process.argv[2] || "runway";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });
const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
});
const errors = [];
page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(`${baseUrl}/work`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2800);

const scrollTo = (y) =>
  page.evaluate((yy) => {
    const l = window.__lenis;
    if (l?.scrollTo) l.scrollTo(yy, { immediate: true });
    else window.scrollTo(0, yy);
  }, y);

const probe = () =>
  page.evaluate(() => {
    const li = [...document.querySelectorAll("section ul > li")];
    const wash = li.map((l) => {
      const w = l.querySelector("span"); // first span = wash
      return w ? +getComputedStyle(w).opacity : -1;
    });
    const scale = li.map((l) => {
      const g = l.querySelector("a, :scope > div");
      if (!g) return -1;
      const m = getComputedStyle(g).transform;
      if (m === "none") return 1;
      return +parseFloat(m.split("(")[1]).toFixed(3);
    });
    const strip = document.querySelector("p.t-index span span");
    const stripM = strip ? getComputedStyle(strip).transform : "none";
    const stripY = stripM === "none" ? 0 : Math.round(parseFloat(stripM.split(",")[5] || "0"));
    return { wash: wash.map((v) => +v.toFixed(2)), scale, stripY };
  });

// runway top: section starts after intro (~62vh+). Find section top.
const secTop = await page.evaluate(() => {
  const sec = document.querySelector("section[aria-labelledby='works-title']");
  return sec ? Math.round(sec.getBoundingClientRect().top + window.scrollY) : 0;
});
const VH = 900;

// slide 0 centred
await scrollTo(secTop);
await page.waitForTimeout(900);
const s0 = await probe();
await page.screenshot({ path: resolve(outDir, `${label}-slide0.png`) });

// slide 1 centred (progress = 1/(n-1) of a 5-slide runway => scroll +1*VH... track travels 1 screen per VH)
await scrollTo(secTop + VH);
await page.waitForTimeout(1000);
const s1 = await probe();
await page.screenshot({ path: resolve(outDir, `${label}-slide1.png`) });

// mid between 1 and 2
await scrollTo(secTop + VH * 1.5);
await page.waitForTimeout(900);
const sMid = await probe();

// violent reversal: jump to slide 3 then instantly back to 0; strip must settle at row 0
await scrollTo(secTop + VH * 3);
await page.waitForTimeout(120);
await scrollTo(secTop);
await page.waitForTimeout(1200);
const sBack = await probe();

console.log("slide0:", JSON.stringify(s0));
console.log("slide1:", JSON.stringify(s1));
console.log("mid1.5:", JSON.stringify(sMid));
console.log("afterReversal:", JSON.stringify(sBack));

const ok =
  s0.scale[0] > 0.99 && s0.scale[1] < 0.98 &&
  s1.scale[1] > 0.99 && s1.scale[0] < 0.98 &&
  s0.wash[0] > 0.9 && s0.wash[1] < 0.7 &&
  sBack.stripY === 0 &&
  errors.length === 0;
errors.forEach((e) => console.log("  - " + e));
console.log(ok ? "ALL PASS" : "FAIL", `-> .shots/${label}-*`);
await browser.close();
process.exit(ok ? 0 : 1);
