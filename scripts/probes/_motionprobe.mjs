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

// ── Pass B: skip preloader — counts + mid-transition frames
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem("at-preloader-seen", "1"); } catch {}
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.type() + ": " + m.text().slice(0, 200)); });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const counts = await page.evaluate(() => {
    const gsap = window.gsap;
    const ST = gsap?.ScrollTrigger || window.ScrollTrigger;
    const sts = ST ? ST.getAll() : [];
    const scrubbed = sts.filter((s) => s.vars.scrub).length;
    const pinned = sts.filter((s) => s.vars.pin).length;
    const sticky = [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).position === "sticky").map((e) => e.className.toString().slice(0, 60));
    const canvases = document.querySelectorAll("canvas").length;
    const videos = document.querySelectorAll("video").length;
    const anims = document.getAnimations();
    const cssAnims = anims.filter((a) => a.constructor.name === "CSSAnimation").length;
    const cssTrans = anims.filter((a) => a.constructor.name === "CSSTransition").length;
    const infinite = anims.filter((a) => a.effect?.getTiming?.().iterations === Infinity).length;
    const tickerListeners = gsap?.ticker?._listeners?.length ?? null;
    const willChange = [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).willChange !== "auto").length;
    const docH = document.documentElement.scrollHeight;
    return { scrollTriggers: sts.length, scrubbed, pinned, stickyCount: sticky.length, sticky, canvases, videos, animationsTotal: anims.length, cssAnims, cssTrans, infiniteLoops: infinite, tickerListeners, willChange, docH, vh: innerHeight, viewports: +(docH / innerHeight).toFixed(1) };
  });
  result.counts = counts;

  // section map: top offsets
  const map = await page.evaluate(() => {
    const ids = ["hero", "about", "works", "tech", "nightfall", "contact"];
    const m = {};
    for (const id of ids) { const e = document.getElementById(id); if (e) m[id] = Math.round(e.getBoundingClientRect().top + scrollY); }
    const secs = [...document.querySelectorAll("main section")].map((s) => ({ label: s.id || s.getAttribute("aria-label") || s.className.slice(0, 30), top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.offsetHeight) }));
    return { m, secs };
  });
  result.map = map;

  const shoot = async (name, y, settle = 700) => {
    await page.evaluate((y) => { window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y); }, y);
    await page.waitForTimeout(settle);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  };

  const vh = counts.vh;
  const secs = map.secs;
  const find = (label) => secs.find((s) => (s.label || "").toLowerCase().includes(label));
  // hero scroll-out: copy sinking mid-way (~30% of first viewport)
  await shoot("01-hero-out-30", Math.round(vh * 0.3));
  await shoot("02-hero-out-70", Math.round(vh * 0.7));
  // about entrance
  await shoot("03-about-enter", map.m.about - Math.round(vh * 0.5));
  // works gallery: mid cross-fade between 1 and 2
  const worksTop = map.m.works;
  const worksSec = find("works");
  const worksDen = (worksSec?.h ?? 0) - vh;
  await shoot("04-works-xfade-1-2", worksTop + Math.round(worksDen * (0.5 / 4)));
  // coast film mid + end (underwater)
  const coast = find("coast");
  if (coast) { await shoot("05-coast-mid", coast.top + Math.round((coast.h - vh) * 0.5), 1200); await shoot("06-coast-end", coast.top + (coast.h - vh) - 10, 1200); }
  // ascent: just before / at / after the break
  const asc = find("ascent");
  if (asc) {
    const den = asc.h - vh;
    await shoot("07-ascent-p60", asc.top + Math.round(den * 0.6), 900);
    await shoot("08-ascent-p74", asc.top + Math.round(den * 0.74), 900);
    await shoot("09-ascent-p80", asc.top + Math.round(den * 0.8), 500);
    await shoot("10-ascent-p95", asc.top + Math.round(den * 0.95), 900);
  }
  // nightfall stack mid-cover
  const nf = map.m.nightfall;
  await shoot("11-nightfall-50", nf - Math.round(vh * 0.5), 900);
  await shoot("12-nightfall-85", nf - Math.round(vh * 0.15), 900);

  // scroll-linked speed: whole page fly-through, sample frame time
  const fps = await page.evaluate(async () => {
    const lenis = window.__lenis;
    const total = document.documentElement.scrollHeight - innerHeight;
    lenis?.scrollTo(0, { immediate: true });
    await new Promise((r) => setTimeout(r, 400));
    const frames = [];
    let last = performance.now();
    let raf;
    const loop = (t) => { frames.push(t - last); last = t; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    lenis?.scrollTo(total, { duration: 12, easing: (t) => t });
    await new Promise((r) => setTimeout(r, 12500));
    cancelAnimationFrame(raf);
    const sorted = [...frames].sort((a, b) => a - b);
    const p = (q) => sorted[Math.floor(sorted.length * q)];
    const long = frames.filter((f) => f > 34).length;
    return { frames: frames.length, mean: +(frames.reduce((a, b) => a + b, 0) / frames.length).toFixed(1), p50: +p(0.5).toFixed(1), p95: +p(0.95).toFixed(1), max: +Math.max(...frames).toFixed(1), framesOver34ms: long };
  });
  result.flythrough12s = fps;
  result.consoleIssues = logs;
  await ctx.close();
}

console.log(JSON.stringify(result, null, 2));
await browser.close();
