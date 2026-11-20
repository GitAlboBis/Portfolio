// QA probe — ESTENSIONI ECOSISTEMA (wordmark ripple su tide-touch,
// ScrollProgress underwater/flare). Eventi sintetici + tide organico.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const issues = [];

async function run(name, { reduced = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
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
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  // ── ScrollProgress: submerge → dim, poi surface-break → flare → day ──────
  const barSel = 'div[aria-hidden][style*="clip-path"]';
  const filterOf = () =>
    page.evaluate((sel) => {
      const bars = [...document.querySelectorAll(sel)].filter((b) => getComputedStyle(b).position === "fixed" && b.getBoundingClientRect().height <= 4);
      return bars[0] ? getComputedStyle(bars[0]).filter : "NOBAR";
    }, barSel);

  const base = await filterOf();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("submerge", { detail: true })));
  await page.waitForTimeout(950);
  const under = await filterOf();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("surface-break")));
  await page.waitForTimeout(250);
  const flare = await filterOf();
  await page.waitForTimeout(1400);
  const settled = await filterOf();

  if (base === "NOBAR") issues.push({ name, err: "ScrollProgress non trovato" });
  if (!reduced) {
    if (under === base) issues.push({ name, err: "submerge non ha cambiato il filter" });
    if (flare === under) issues.push({ name, err: "surface-break non ha flarato" });
    if (settled !== base) issues.push({ name, err: `flare non rientrato (settled != base)` });
  } else {
    if (under !== base || settled !== base)
      issues.push({ name, err: "reduced: il filter NON deve reagire agli eventi" });
  }

  // ── Wordmark ripple su tide-touch (footer in vista, evento sintetico) ────
  await page.evaluate(() => document.querySelector("footer")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(2500); // FlipText entrance completa
  const before = await page.evaluate(() => {
    const c = document.querySelectorAll("footer .flip-word div, footer .flip-word span");
    return c.length;
  });
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("tide-touch")));
  await page.waitForTimeout(320); // meta' onda
  const mid = await page.evaluate(() => {
    const chars = [...document.querySelectorAll("footer .flip-word *")].filter((n) => n.childElementCount === 0);
    const moved = chars.filter((ch) => {
      const t = getComputedStyle(ch).transform;
      if (!t || t === "none") return false;
      const m = t.match(/matrix\(([^)]+)\)/);
      if (!m) return false;
      const ty = parseFloat(m[1].split(",")[5]);
      return Math.abs(ty) > 1;
    });
    return { chars: chars.length, moved: moved.length };
  });
  await page.screenshot({ path: `.shots/eco-${name}-ripple.png` });
  await page.waitForTimeout(1800);
  const after = await page.evaluate(() => {
    const chars = [...document.querySelectorAll("footer .flip-word *")].filter((n) => n.childElementCount === 0);
    return chars.filter((ch) => {
      const t = getComputedStyle(ch).transform;
      const m = t.match(/matrix\(([^)]+)\)/);
      return m && Math.abs(parseFloat(m[1].split(",")[5])) > 1;
    }).length;
  });
  if (!reduced) {
    if (before === 0) issues.push({ name, err: "split del wordmark assente" });
    if (mid.moved < 3) issues.push({ name, err: `ripple non visto (moved=${mid.moved}/${mid.chars})` });
    if (after > 0) issues.push({ name, err: `ripple non rientrato (${after} chars ancora spostati)` });
  } else if (mid.moved > 0) {
    issues.push({ name, err: "reduced: il ripple NON deve muovere le lettere" });
  }

  const relevant = local.filter(
    (e) => !e.includes("Download the React DevTools") && !e.includes("THREE.Clock") && !e.includes("[Fast Refresh]") && !e.includes("was preloaded using link preload"),
  );
  if (relevant.length) issues.push({ name, console: relevant });
  await ctx.close();
  return { base: base.slice(0, 60), under: under.slice(0, 90), flareChanged: flare !== under, mid };
}

const d = await run("default");
const r = await run("reduced", { reduced: true });
await browser.close();
console.log("default:", JSON.stringify(d));
console.log("reduced:", JSON.stringify(r));
console.log(issues.length ? "ISSUES:\n" + JSON.stringify(issues, null, 2) : "ALL PASS");
