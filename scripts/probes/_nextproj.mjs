// SCRATCH visual gate for the NextProject handoff band. NOT committed.
//   node _nextproj.mjs [label]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const label = process.argv[2] || "nextproj";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const outDir = resolve(process.cwd(), ".shots");
await mkdir(outDir, { recursive: true });
const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

// slug -> expected next slug (confirmed cycle)
const cycle = {
  badante24h: "doit-voice-ai-agent",
  "doit-voice-ai-agent": "agricultural-supply-chain",
  "agricultural-supply-chain": "badante24h",
};

const browser = await chromium.launch();
let fail = 0;
for (const [slug, expected] of Object.entries(cycle)) {
  for (const reduce of slug === "badante24h" ? [false, true] : [false]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: reduce ? "reduce" : "no-preference",
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
    });
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

    await page.goto(`${baseUrl}/work/${slug}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);

    // scroll so the band is mid-viewport (scrub mid-flight), then to its rest
    const info = await page.evaluate(() => {
      const band = document.querySelector("[data-next-num]")?.closest("section");
      if (!band) return null;
      const top = band.getBoundingClientRect().top + window.scrollY;
      const l = window.__lenis;
      const target = top - window.innerHeight * 0.72;
      if (l?.scrollTo) l.scrollTo(target, { immediate: true });
      else window.scrollTo(0, target);
      return { top };
    });
    await page.waitForTimeout(1100);

    const state = await page.evaluate((exp) => {
      const a = document.querySelector("section a[href^='/work/']");
      const title = document.querySelector("[data-next-title]");
      const num = document.querySelector("[data-next-num]");
      if (!a || !title || !num) return { missing: true };
      const tx = (el) => {
        const m = getComputedStyle(el).transform;
        if (m === "none") return 0;
        return Math.round(parseFloat(m.split(",")[4] || "0"));
      };
      return {
        href: a.getAttribute("href"),
        hrefOk: a.getAttribute("href") === `/work/${exp}`,
        titleX: tx(title),
        numX: tx(num),
        accName: (a.textContent || "").trim().slice(0, 60),
      };
    }, expected);

    if (!reduce) await page.screenshot({ path: resolve(outDir, `${label}-${slug}.png`) });
    const bad =
      errors.length > 0 ||
      state.missing ||
      !state.hrefOk ||
      (reduce ? state.titleX !== 0 : state.titleX <= 0); // reduced: final x=0; live: mid-drift x>0
    if (bad) fail++;
    console.log(
      `[${slug}${reduce ? " reduced" : ""}] ${JSON.stringify(state)} errors=${errors.length}${bad ? " <-- CHECK" : ""}`,
    );
    errors.forEach((e) => console.log("   - " + e));
    await ctx.close();
  }
}
await browser.close();
console.log(fail ? `FAIL ${fail}` : "ALL PASS", `-> .shots/${label}-*`);
