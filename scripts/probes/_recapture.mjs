// WP-10 fix-batch recapture (finish review F7).
// A single fullPage screenshot of a 12,500px mobile sheet exceeds Chrome's
// 16,384px texture ceiling at DPR2 and comes back STITCHED WRONG: the page
// restarts from the header mid-image and later slices replay earlier sections.
// So: assert the height first, and capture anything over the ceiling as
// viewport-height TILES instead of one impossible image.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const base = process.env.BASE_URL || "http://localhost:3000";
const CEILING = 16384;
const ROUTES = [
  ["/", "home"],
  ["/work", "work"],
  ["/work/sersan-io", "work_sersan_io"],
  ["/work/sphere-ai", "work_sphere_ai"],
  ["/about", "about"],
  ["/styleguide", "styleguide"],
  ["/no-such-page-404", "no_such_page_404"],
];
const VPS = [
  { n: "desktop", width: 1440, height: 900, dpr: 1, mob: false },
  { n: "mobile", width: 390, height: 844, dpr: 2, mob: true },
];
const outRoot = resolve(process.cwd(), ".shots/wp10-fixed");
await mkdir(outRoot, { recursive: true });
await mkdir(resolve(process.cwd(), ".impeccable/review"), { recursive: true });

const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });
const report = [];
for (const [route, slug] of ROUTES) {
  for (const vp of VPS) {
    const ctx = await b.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      isMobile: vp.mob,
      hasTouch: vp.mob,
    });
    await ctx.addInitScript(() => sessionStorage.setItem("at-preloader-seen", "1"));
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") errs.push(`${m.type()}: ${m.text()}`);
    });
    p.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
    await p.goto(base + route, { waitUntil: "networkidle" });
    // past the bench settle window on "/" so the captures show the LIVE bench
    await p.waitForTimeout(route === "/" ? 8000 : 1200);
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    const px = h * vp.dpr;
    const dir = `${outRoot}/${slug}-${vp.n}`;
    if (px <= CEILING) {
      await p.screenshot({ path: `${dir}.png`, fullPage: true });
      report.push({ route, vp: vp.n, cssHeight: h, devicePx: px, mode: "fullpage", tiles: 1, console: errs.length });
    } else {
      // tiles: scroll one viewport at a time, never ask the compositor for more
      await mkdir(dir, { recursive: true });
      const steps = Math.ceil(h / vp.height);
      for (let i = 0; i < steps; i++) {
        const y = Math.min(i * vp.height, h - vp.height);
        await p.evaluate((yy) => {
          const l = window.__lenis;
          if (l) l.scrollTo(yy, { immediate: true, force: true });
          else window.scrollTo(0, yy);
        }, y);
        await p.waitForTimeout(260);
        await p.screenshot({ path: `${dir}/${String(i).padStart(2, "0")}-y${y}.png` });
      }
      report.push({ route, vp: vp.n, cssHeight: h, devicePx: px, mode: "tiled", tiles: steps, console: errs.length });
    }
    // the two review stills the finish protocol archives
    if (route === "/") {
      await p.evaluate(() => {
        const l = window.__lenis;
        if (l) l.scrollTo(0, { immediate: true, force: true });
        else window.scrollTo(0, 0);
      });
      await p.waitForTimeout(400);
      if (px <= CEILING) {
        await p.screenshot({ path: `.impeccable/review/${vp.n}.png`, fullPage: true });
      } else {
        // the review still is the FIRST VIEWPORT, honestly labelled; the whole
        // sheet lives in the tile folder beside it
        await p.screenshot({ path: `.impeccable/review/${vp.n}.png` });
      }
    }
    if (errs.length) console.log(`  console ${route} ${vp.n}:`, errs.slice(0, 4));
    await ctx.close();
  }
}
await b.close();
await writeFile(`${outRoot}/capture-report.json`, JSON.stringify(report, null, 2));
console.table(report);
