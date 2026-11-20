// WP-3 bench probe — settle, move-check, frame budget, adapter identity, dispose.
// node _bench.mjs [desktop|mobile] [settleMs]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const which = process.argv[2] || "desktop";
const settle = Number(process.argv[3] || 6000);
const out = ".shots/wp3";
await mkdir(out, { recursive: true });

const VP =
  which === "mobile"
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan"],
});
const ctx = await browser.newContext(VP);
const page = await ctx.newPage();
const errs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errs.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => errs.push(`[pageerror] ${e.message}`));
await page.addInitScript(() => sessionStorage.setItem("at-preloader-seen", "1"));
await page.goto("http://localhost:3000/dev/bench", { waitUntil: "networkidle" });

const adapter = await page.evaluate(async () => {
  if (!navigator.gpu) return "no navigator.gpu";
  const a = await navigator.gpu.requestAdapter();
  if (!a) return "no adapter";
  const i = a.info || {};
  return `${i.vendor || "?"} / ${i.architecture || "?"} / ${i.device || "?"} / ${i.description || "?"}`;
});
console.log("adapter:", adapter);

await page.waitForTimeout(settle);
const box = page.locator("figure .bench-box");
const rect = await box.boundingBox();
console.log("box rect:", JSON.stringify(rect));
await box.screenshot({ path: `${out}/box-${which}-A.png` });
const a = await page.evaluate(() => {
  const s = window.__heroStore.getState();
  return { frameMs: s.frameMs, particles: s.particles, dpr: s.dpr, tier: s.tier, status: s.status };
});
await page.waitForTimeout(1500);
await box.screenshot({ path: `${out}/box-${which}-B.png` });
const b = await page.evaluate(() => {
  const s = window.__heroStore.getState();
  return { frameMs: s.frameMs, particles: s.particles, dpr: s.dpr, tier: s.tier, status: s.status };
});
console.log("A:", JSON.stringify(a));
console.log("B:", JSON.stringify(b));
console.log("frame readout changed:", a.frameMs !== b.frameMs);

// 3s of frameMs samples, averaged
const samples = await page.evaluate(
  () =>
    new Promise((res) => {
      const v = [];
      const id = setInterval(() => v.push(window.__heroStore.getState().frameMs), 250);
      setTimeout(() => {
        clearInterval(id);
        res(v);
      }, 3000);
    }),
);
const uniq = [...new Set(samples.filter((x) => x > 0))];
const avg = uniq.reduce((s, x) => s + x, 0) / Math.max(uniq.length, 1);
console.log("frameMs samples:", uniq.map((x) => x.toFixed(1)).join(" "));
console.log("frameMs avg over ~3s:", avg.toFixed(2), "→", (1000 / avg).toFixed(1), "fps");

// full page shot too
await page.screenshot({ path: `${out}/page-${which}.png`, fullPage: false });

// dispose check: client-side nav away, count canvases
await page.click('a[href="/about"]');
await page.waitForTimeout(2500);
const after = await page.evaluate(() => ({
  url: location.pathname,
  canvases: document.querySelectorAll("canvas").length,
  status: window.__heroStore.getState().status,
}));
console.log("after nav:", JSON.stringify(after));

console.log("console errors/warnings:", errs.length);
for (const e of errs.slice(0, 20)) console.log("  ", e);
await browser.close();
