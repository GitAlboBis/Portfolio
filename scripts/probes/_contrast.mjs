// SCRATCH: WCAG contrast sampling for the hero copy over the real gradient+scrim.
// Hides the copy, screenshots, samples the bg under each text box, computes the
// ratio vs the composited text color.  node _contrast.mjs
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const browser = await chromium.launch();

const lum = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [Math.max(lum(a), lum(b)), Math.min(lum(a), lum(b))];
  return (hi + 0.05) / (lo + 0.05);
};
const blend = (fg, alpha, bg) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));

for (const vp of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844, isMobile: true },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3200);

  // boxes of interest BEFORE hiding
  const boxes = await page.evaluate(() => {
    const grab = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const lines = [...document.querySelectorAll("#hero [data-hero-line]")];
    const amber = document.querySelector("#hero .text-amber");
    const cue = document.querySelector("#hero [data-hero-cue] span");
    return { role: grab(lines[0]), name: grab(lines[1]), amber: grab(amber), cue: grab(cue) };
  });

  // hide ONLY the text (keep the scrim!), shoot, sample
  await page.evaluate(() => {
    const root = document.querySelector("#hero h1")?.closest(".pointer-events-none");
    root.querySelector(".container-edit").style.opacity = "0";
  });
  await page.waitForTimeout(120);
  const png = (await page.screenshot()).toString("base64");

  const samples = await page.evaluate(async ({ png, boxes }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const cv = document.createElement("canvas");
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
    const g = cv.getContext("2d");
    g.drawImage(img, 0, 0);
    const dpr = img.naturalWidth / window.innerWidth;
    const avg = (b) => {
      if (!b) return null;
      const d = g.getImageData(Math.round(b.x * dpr), Math.round(b.y * dpr), Math.max(1, Math.round(b.w * dpr)), Math.max(1, Math.round(b.h * dpr))).data;
      let r = 0, gg = 0, bl = 0, n = 0;
      // also track the BRIGHTEST pixel region (worst case for light text)
      let br = [0, 0, 0], bl2 = 255 * 3;
      let dk = [255, 255, 255];
      for (let i = 0; i < d.length; i += 4) {
        r += d[i]; gg += d[i + 1]; bl += d[i + 2]; n++;
        const s = d[i] + d[i + 1] + d[i + 2];
        if (s > br[0] + br[1] + br[2]) br = [d[i], d[i + 1], d[i + 2]];
        if (s < bl2) { dk = [d[i], d[i + 1], d[i + 2]]; bl2 = s; }
      }
      return { avg: [Math.round(r / n), Math.round(gg / n), Math.round(bl / n)], brightest: br, darkest: dk };
    };
    return { role: avg(boxes.role), name: avg(boxes.name), amber: avg(boxes.amber), cue: avg(boxes.cue) };
  }, { png, boxes });

  const PAPER = [251, 246, 239];
  const AMBER = [242, 163, 60];
  const report = (label, s, fg, alpha, need) => {
    if (!s) return console.log(`  ${label}: MISSING`);
    const fgC = alpha < 1 ? blend(fg, alpha, s.avg) : fg;
    const rAvg = ratio(fgC, s.avg).toFixed(2);
    const rWorst = ratio(fgC, s.brightest).toFixed(2);
    console.log(`  ${label}: avg=${rAvg} worst(brightest px)=${rWorst} need>=${need} ${+rAvg >= need ? "PASS" : "FAIL"}${+rWorst >= need ? "" : " (worst-px below)"}`);
  };
  console.log(`[${vp.name}]`);
  report("role paper (t-meta small)", samples.role, PAPER, 1, 4.5);
  report("name paper (display, large)", samples.name, PAPER, 1, 3);
  report("amber jewel (semibold ~large)", samples.amber, AMBER, 1, 3);
  report("cue paper/85 (t-meta small)", samples.cue, PAPER, 0.85, 4.5);
  await ctx.close();
}
await browser.close();
