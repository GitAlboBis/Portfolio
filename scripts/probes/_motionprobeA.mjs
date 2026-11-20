// Motion & choreography probe — counts loops/triggers/animations and captures
// mid-transition frames on the home route. Output: JSON to stdout + PNGs in ./out
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = "C:/Users/alber/AppData/Local/Temp/claude/C--Users-alber-Portfolio/a57754c5-1041-40cd-8985-d3afc45f9fe5/scratchpad/out";
fs.mkdirSync(OUT, { recursive: true });
const URL = "http://localhost:3000/";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const result = {};

// ── Pass A: cold load WITH preloader — time until hero copy is actually visible
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  const marks = {};
  // poll every 100ms for 9s: preloader display, hero h1 line transform/opacity
  for (let i = 0; i < 90; i++) {
    const s = await page.evaluate(() => {
      const pre = document.getElementById("preloader");
      const preVisible = pre && getComputedStyle(pre).display !== "none";
      const preY = pre ? getComputedStyle(pre).transform : null;
      const h1 = document.querySelector("h1 [data-hero-line]");
      let lineY = null;
      let rootOpacity = null;
      if (h1) {
        // SplitText mask wraps lines in .line elements
        const line = h1.querySelector(".line") || h1;
        lineY = getComputedStyle(line).transform;
        const root = h1.closest("div.absolute") || h1.parentElement;
        rootOpacity = root ? getComputedStyle(root).opacity : null;
      }
      const cue = document.querySelector("[data-hero-cue]");
      const cueOp = cue ? getComputedStyle(cue).opacity : null;
      const canvas = document.querySelector("canvas");
      const canvasOp = canvas ? getComputedStyle(canvas).opacity : null;
      return { preVisible, preY, lineY, rootOpacity, cueOp, canvasOp, loadedFlag: !!window.__lenis };
    });
    const t = Date.now() - t0;
    if (!marks.preloaderGone && !s.preVisible) marks.preloaderGone = t;
    if (!marks.preloaderLifting && s.preVisible && s.preY && s.preY !== "none" && !s.preY.includes(", 0, 0)")) marks.preloaderLifting = t;
    if (!marks.heroLineSettled && s.lineY && (s.lineY === "none" || /matrix\(1, 0, 0, 1, 0, 0\)/.test(s.lineY))) marks.heroLineSettled = t;
    if (!marks.cueVisible && s.cueOp && Number(s.cueOp) > 0.9) marks.cueVisible = t;
    if (i % 5 === 0) marks[`sample_${t}`] = s;
    if (marks.preloaderGone && marks.heroLineSettled && marks.cueVisible) break;
    await page.waitForTimeout(100);
  }
  result.coldLoad = marks;
  await ctx.close();
}


console.log(JSON.stringify(result.coldLoad, null, 1));
await browser.close();
