// SCRATCH adversarial QA matrix for the Continuous Curtain. NOT committed.
//   node _curtain.mjs
// Scenarios: covered nav (exit plays, handoff clean) · modifier-click (native
// new-tab, no cover) · middle-click (no onClick at all) · double-click latch ·
// second-link mid-cover swallowed · back-button after nav · hung-nav bail
// (RSC fetch aborted -> curtain retracts, page interactive) · reduced-motion
// (instant nav, zero cover) · IT locale sweep. Console clean everywhere.
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const IGNORE = [
  /Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i,
  /Failed to fetch RSC payload/i, /ERR_FAILED/i, /Failed to load resource/i, // expected in the hung-nav scenario only
];
const results = [];
const browser = await chromium.launch();

async function scenario(name, { reduce = false, locale = null } = {}, run) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduce ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(Object.getPrototypeOf(navigator), "gpu", { get: () => undefined });
  });
  if (locale) {
    await page.addInitScript((loc) => {
      localStorage.setItem("ocean-ui", JSON.stringify({ state: { locale: loc, soundEnabled: false }, version: 0 }));
    }, locale);
  }
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && !IGNORE.some((re) => re.test(m.text()))) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  try {
    const detail = await run(page, ctx);
    const bad = errors.length > 0 || /FAIL/.test(detail);
    results.push(`${bad ? "FAIL" : "PASS"} [${name}] ${detail} errors=${errors.length}`);
    errors.forEach((e) => results.push("    - " + e));
  } catch (err) {
    results.push(`FAIL [${name}] threw: ${String(err).slice(0, 160)}`);
  }
  await ctx.close();
}

const coverState = (page) =>
  page.evaluate(() => {
    const paths = [...document.querySelectorAll("#exit-cover path")];
    if (paths.length !== 2) return "no-overlay";
    const d = paths.map((p) => p.getAttribute("d") || "");
    return d.every((x) => x === "M0 0H0Z" || x === "") ? "clear" : "painted";
  });

// ── 1. plain covered nav: / -> /about ────────────────────────────────────────
await scenario("covered-nav", {}, async (page) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2800);
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await link.click();
  await page.waitForTimeout(200); // mid-cover
  const mid = await coverState(page);
  await page.waitForURL("**/about", { timeout: 8000 });
  await page.waitForTimeout(1400); // enter lift + handoff
  const after = await coverState(page);
  const url = page.url();
  return `mid=${mid}${mid === "painted" ? "" : " FAIL(no cover mid-flight)"} after=${after}${after === "clear" ? "" : " FAIL(stuck cover)"} url=${url.endsWith("/about") ? "ok" : "FAIL " + url}`;
});

// ── 2. ctrl+click: native new-tab, page stays, no cover ─────────────────────
await scenario("modifier-click", {}, async (page, ctx) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2600);
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const before = ctx.pages().length;
  await link.click({ modifiers: ["ControlOrMeta"] });
  await page.waitForTimeout(900);
  const state = await coverState(page);
  const stayed = page.url().replace(/\/$/, "") === baseUrl.replace(/\/$/, "");
  const popup = ctx.pages().length > before;
  return `stayed=${stayed ? "ok" : "FAIL"} cover=${state}${state === "clear" ? "" : " FAIL"} newTab=${popup}`;
});

// ── 3. middle-click: onClick never fires, no cover, no nav ───────────────────
await scenario("middle-click", {}, async (page) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2600);
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await link.click({ button: "middle" }).catch(() => {});
  await page.waitForTimeout(900);
  const state = await coverState(page);
  const stayed = page.url().replace(/\/$/, "") === baseUrl.replace(/\/$/, "");
  return `stayed=${stayed ? "ok" : "FAIL"} cover=${state}${state === "clear" ? "" : " FAIL"}`;
});

// ── 4. double-click latch: one nav, no double-cover ─────────────────────────
await scenario("double-click-latch", {}, async (page) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2800);
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await link.click();
  await page.waitForTimeout(80);
  await link.click({ force: true }).catch(() => {});
  await page.waitForURL("**/about", { timeout: 8000 });
  await page.waitForTimeout(1400);
  const after = await coverState(page);
  return `landed=ok after=${after}${after === "clear" ? "" : " FAIL(stuck)"}`;
});

// ── 5. back-button after a covered nav: enter plays, nothing sticks ─────────
await scenario("back-after-nav", {}, async (page) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2800);
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await link.click();
  await page.waitForURL("**/about", { timeout: 8000 });
  await page.waitForTimeout(1500);
  await page.goBack();
  await page.waitForTimeout(1600);
  const state = await coverState(page);
  const home = page.url().replace(/\/$/, "") === baseUrl.replace(/\/$/, "");
  const h1 = await page.locator("#hero h1").count();
  return `back=${home ? "ok" : "FAIL"} cover=${state}${state === "clear" ? "" : " FAIL"} h1=${h1}`;
});

// ── 6. hung nav: RSC fetch STALLS (pending forever) -> bail retracts ───────
await scenario("hung-nav-bail", {}, async (page, ctx) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2800);
  // stall (never fulfill) every /about request from now on: push hangs, no
  // rejection -> no Next hard-nav fallback -> the 1.8s bail must save us
  await ctx.route("**/about**", () => {});
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await link.click();
  await page.waitForTimeout(600); // covered by now
  const mid = await coverState(page);
  await page.waitForTimeout(3800); // > 0.42 cover + 2.5s bail + 0.45s retract
  const after = await coverState(page);
  const stayed = !page.url().includes("/about");
  const interactive = await page.evaluate(() => {
    const a = document.querySelector("#about a[href='/about']");
    if (!a) return false;
    const r = a.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!el && (a === el || a.contains(el));
  });
  await ctx.unroute("**/about**");
  return `mid=${mid}${mid === "painted" ? "" : " FAIL(no cover)"} after=${after}${after === "clear" ? "" : " FAIL(stranded)"} stayed=${stayed ? "ok" : "note-navigated"} interactive=${interactive ? "ok" : "FAIL"}`;
});

// ── 7. reduced-motion: instant nav, zero cover ───────────────────────────────
await scenario("reduced-motion", { reduce: true }, async (page) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2200);
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const t0 = Date.now();
  await link.click();
  await page.waitForURL("**/about", { timeout: 8000 });
  const ms = Date.now() - t0;
  const state = await coverState(page);
  return `navMs=${ms}${ms < 1200 ? "" : " FAIL(cover delay?)"} cover=${state}${state === "clear" ? "" : " FAIL"}`;
});

// ── 8. IT locale: case-study loop nav via the handoff band ──────────────────
await scenario("it-locale-loop", { locale: "it" }, async (page) => {
  await page.goto(`${baseUrl}/work/badante24h`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2600);
  const band = page.locator("a[href='/work/doit-voice-ai-agent']").first();
  await band.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await band.click();
  await page.waitForURL("**/work/doit-voice-ai-agent", { timeout: 8000 });
  await page.waitForTimeout(1400);
  const state = await coverState(page);
  const eyebrow = await page.locator("text=Prossimo progetto").count();
  return `landed=ok cover=${state}${state === "clear" ? "" : " FAIL"} itEyebrow=${eyebrow >= 1 ? "ok" : "FAIL"}`;
});

// ── 9. under-cover interaction: locale toggle + menu are inert/swallowed ────
await scenario("under-cover-inert", {}, async (page) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2800);
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await link.click();
  await page.waitForTimeout(430); // fully covered, push pending/committed
  // blind-tap where the nav pill's locale toggle sits (top center-right)
  await page.mouse.click(905, 32).catch(() => {});
  await page.keyboard.press("Tab").catch(() => {});
  await page.keyboard.press("Enter").catch(() => {});
  await page.waitForURL("**/about", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1300);
  const state = await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem("ocean-ui") || "{}");
    return {
      locale: persisted?.state?.locale ?? "en",
      menuOpen: !!document.querySelector("#menu-overlay[style*='pointer-events: auto']"),
      cover: [...document.querySelectorAll("#exit-cover path")].every((p) => (p.getAttribute("d") || "M0 0H0Z") === "M0 0H0Z") ? "clear" : "painted",
    };
  });
  const onAbout = page.url().includes("/about");
  return `landed=${onAbout ? "ok" : "FAIL"} locale=${state.locale}${state.locale === "en" ? "" : " FAIL(flipped under cover)"} menu=${state.menuOpen ? "FAIL(opened under cover)" : "closed"} cover=${state.cover}${state.cover === "clear" ? "" : " FAIL"}`;
});

// ── 10. covered cross-page hash nav lands ON the section ────────────────────
await scenario("hash-nav-section", {}, async (page) => {
  await page.goto(`${baseUrl}/work/badante24h`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2600);
  const back = page.locator("header a[href='/#works']");
  await back.click();
  await page.waitForURL("**/#works", { timeout: 8000 });
  await page.waitForTimeout(1800); // enter + settle
  const pos = await page.evaluate(() => {
    const el = document.querySelector("#works");
    if (!el) return { missing: true };
    const top = el.getBoundingClientRect().top;
    return { top: Math.round(top), scrollY: Math.round(window.scrollY) };
  });
  const ok = !pos.missing && pos.top > -900 && pos.top < 300 && pos.scrollY > 100;
  return `worksTop=${pos.top} scrollY=${pos.scrollY} ${ok ? "" : "FAIL(landed at page top?)"}`;
});

// ── 11. slow-but-successful nav (stall 3.2s > bail 2.5s, then continue) ─────
await scenario("slow-success-nav", {}, async (page, ctx) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2800);
  await ctx.route("**/about**", async (route) => {
    await new Promise((r) => setTimeout(r, 3200));
    await route.continue().catch(() => {});
  });
  const link = page.locator("#about a[href='/about']");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await link.click();
  await page.waitForTimeout(2600); // bail fired (cover retracted), push still in flight
  const midBail = await coverState(page);
  await page.waitForTimeout(3000); // late commit -> hard-cut enter (pre-curtain behavior)
  const after = await coverState(page);
  const landed = page.url().includes("/about");
  await ctx.unroute("**/about**");
  return `afterBail=${midBail}${midBail === "clear" ? "" : " note-still-covered"} landed=${landed ? "ok" : "note-stayed"} final=${after}${after === "clear" ? "" : " FAIL(stuck)"}`;
});

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails ? `\n${fails} SCENARIO(S) FAILED` : "\nALL PASS");
await browser.close();
process.exit(fails ? 1 : 0);
