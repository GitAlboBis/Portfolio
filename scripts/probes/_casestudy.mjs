// QA probe — CASE STUDY VIVI (/work/[slug] photo essay).
// desktop 1440 / mobile 390 / reduced-motion: screenshots per beat + console
// pulita + verifiche funzionali (cuts visibili, sticky chapter label, chips).
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SLUG = process.env.SLUG ?? "badante24h";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const issues = [];

async function run(name, ctxOpts, { reduced = false } = {}) {
  const ctx = await browser.newContext({
    ...ctxOpts,
    ...(reduced ? { reducedMotion: "reduce" } : {}),
  });
  await ctx.addInitScript(() => {
    sessionStorage.setItem("at-preloader-seen", "1");
    Object.defineProperty(navigator, "gpu", { get: () => undefined });
  });
  const page = await ctx.newPage();
  const local = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") local.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => local.push(`[pageerror] ${e.message}`));
  await page.goto(`${BASE}/work/${SLUG}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  // ── beats: scroll to each and screenshot ────────────────────────────────
  const beats = [
    ["intro", () => window.scrollTo(0, 0)],
    ["wideshot", () => document.querySelectorAll("figure")[0]?.scrollIntoView({ block: "center" })],
    ["metrics-ch1", () => document.querySelectorAll(".t-index")[0]?.scrollIntoView({ block: "center" })],
    ["cut-inset", () => document.querySelectorAll("figure")[1]?.scrollIntoView({ block: "center" })],
    ["chapter2", () => document.querySelectorAll(".t-index")[1]?.scrollIntoView({ block: "start" })],
    ["cut-full", () => document.querySelectorAll("figure")[2]?.scrollIntoView({ block: "center" })],
    ["stack", () => [...document.querySelectorAll(".glass")].at(-1)?.scrollIntoView({ block: "center" })],
    ["next", () => document.querySelector("[data-next-title]")?.scrollIntoView({ block: "center" })],
  ];
  for (const [beat, fn] of beats) {
    await page.evaluate(fn);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `.shots/case-${name}-${beat}.png` });
  }

  // ── functional checks ───────────────────────────────────────────────────
  const checks = await page.evaluate(() => {
    const out = {};
    const figs = [...document.querySelectorAll("figure")];
    out.figures = figs.length;
    const imgs = figs.flatMap((f) => [...f.querySelectorAll("img")]);
    out.imgsLoaded = imgs.every((i) => i.naturalWidth > 0);
    out.imgVisible = imgs.every((i) => {
      const r = i.getBoundingClientRect();
      const cs = getComputedStyle(i);
      return r.width > 0 && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.9;
    });
    // chips visible (reduced must never hide them)
    const chips = [...document.querySelectorAll(".glass")];
    out.chips = chips.length;
    out.chipsVisible = chips.every((c) => {
      const cs = getComputedStyle(c);
      return cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.9;
    });
    out.captions = [...document.querySelectorAll("figcaption")].map((c) => c.textContent.trim());
    return out;
  });
  if (checks.figures < 3) issues.push({ name, err: `figures=${checks.figures} (attesi 3 con textureSrc)` });
  if (!checks.imgsLoaded) issues.push({ name, err: "una img del cut non ha caricato" });
  if (!checks.imgVisible) issues.push({ name, err: "una img del cut è nascosta/trasparente" });
  if (!checks.chipsVisible) issues.push({ name, err: "chips stack nascoste" });

  // sticky chapter label (desktop only): scroll into the middle of chapter 2's
  // long body — the label should sit near the sticky top, i.e. above ~200px.
  if (name === "desktop") {
    const sticky = await page.evaluate(() => {
      const idx = document.querySelectorAll(".t-index")[1];
      if (!idx) return { err: "chapter 2 index missing" };
      const row = idx.closest(".grid-edit");
      const body = row.querySelector(".col-read p");
      const r = body.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r.top - 100 + r.height * 0.6);
      return null;
    });
    await page.waitForTimeout(600);
    const pos = await page.evaluate(() => {
      const idx = document.querySelectorAll(".t-index")[1];
      return idx ? idx.getBoundingClientRect().top : -1;
    });
    if (sticky?.err) issues.push({ name, err: sticky.err });
    else if (pos < 0 || pos > 300)
      issues.push({ name, err: `sticky label top=${Math.round(pos)} (atteso <300 a metà capitolo)` });
    await page.screenshot({ path: `.shots/case-${name}-sticky.png` });
  }

  const relevant = local.filter(
    (e) =>
      !e.includes("Download the React DevTools") &&
      !e.includes("THREE.Clock") &&
      !e.includes("[Fast Refresh]"),
  );
  if (relevant.length) issues.push({ name, console: relevant });
  await ctx.close();
  return checks;
}

const d = await run("desktop", { viewport: { width: 1440, height: 900 } });
const m = await run("mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const r = await run("reduced", { viewport: { width: 1440, height: 900 } }, { reduced: true });

await browser.close();
console.log("desktop:", JSON.stringify(d));
console.log("mobile:", JSON.stringify(m));
console.log("reduced:", JSON.stringify(r));
console.log(issues.length ? "ISSUES:\n" + JSON.stringify(issues, null, 2) : "ALL PASS");
