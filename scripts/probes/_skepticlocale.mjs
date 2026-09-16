// SKEPTIC PROBE — does the EN/IT toggle break the portal panel + meta row on reopen?
// Scenario under test: load home -> open menu (baseline) -> Esc -> click locale toggle -> reopen -> measure.
// Also variant B: never-opened -> toggle -> open.
import { chromium } from "playwright";
import { resolve } from "node:path";

const base = process.env.BASE_URL || "http://localhost:3000";
const out = resolve(process.cwd(), ".shots");
const IGNORE = [/React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i, /Download the React DevTools/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const browser = await chromium.launch();

async function measure(page) {
  return page.evaluate(() => {
    const panel = document.querySelector("#menu-overlay div[aria-hidden]"); // the portal panel wrapper
    const metas = Array.from(document.querySelectorAll("#menu-overlay .menu-meta"));
    const lines = Array.from(document.querySelectorAll("#menu-overlay .menu-line"));
    const cs = (el) => {
      const s = getComputedStyle(el);
      return { op: +s.opacity, vis: s.visibility, tf: s.transform, inline: el.style.cssText };
    };
    return {
      panel: panel ? cs(panel) : null,
      metas: metas.map(cs),
      lineCount: lines.length,
      firstLine: lines[0] ? cs(lines[0]) : null,
    };
  });
}

async function openMenu(page) {
  await page.locator('header [aria-controls="menu-overlay"]').first().click();
  await page.waitForTimeout(1700); // full open timeline
}
async function closeMenu(page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1400); // reverse at 1.35x + margin
}
async function toggleLocale(page) {
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("header button"));
    const b = btns.find((x) => /^(IT|EN)\b/.test(x.textContent.trim()) && !x.hasAttribute("aria-controls"));
    if (!b) throw new Error("locale toggle not found");
    b.click();
  });
  await page.waitForTimeout(600); // let React re-render + useGSAP re-run
}

// ── Variant A: open once, close, toggle, reopen ────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(base, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2600);

  await openMenu(page);
  const baseline = await measure(page);
  console.log("A. BASELINE OPEN #1:", JSON.stringify(baseline, null, 1));
  await page.screenshot({ path: resolve(out, "skeptic-A-open1.png") });

  await closeMenu(page);
  await toggleLocale(page);
  const afterToggleClosed = await measure(page);
  console.log("A. CLOSED after toggle (inline residue?):", JSON.stringify({ panel: afterToggleClosed.panel, meta0: afterToggleClosed.metas[0] }, null, 1));

  await openMenu(page);
  const reopened = await measure(page);
  console.log("A. REOPEN after locale toggle:", JSON.stringify(reopened, null, 1));
  await page.screenshot({ path: resolve(out, "skeptic-A-reopen.png") });
  console.log("A. console errors:", errors.length, errors.slice(0, 5));
  await ctx.close();
}

// ── Variant B: never opened, toggle, then first open ──────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(base, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2600);

  await toggleLocale(page);
  await openMenu(page);
  const opened = await measure(page);
  console.log("B. FIRST OPEN after toggle (never opened before):", JSON.stringify(opened, null, 1));
  await page.screenshot({ path: resolve(out, "skeptic-B-open.png") });
  console.log("B. console errors:", errors.length, errors.slice(0, 5));
  await ctx.close();
}

await browser.close();
