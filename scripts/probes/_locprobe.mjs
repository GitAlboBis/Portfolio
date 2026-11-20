// SCRATCH probe — Nightfall fix 6 (EN↔IT desync): switching locale reflows the
// content ABOVE the runway; without the debounced ScrollTrigger.refresh() the
// scrub's start/end go stale (+27px reproduced on mobile IT) and at coverTop≈0
// progress stays <0.995 → data-scene-covered never sets. NOT committed.
//   node _locprobe.mjs
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const IGNORE = [/Download the React DevTools/i, /\[Fast Refresh\]/i, /THREE\.Clock/i, /WebGPU/i];
const isReal = (t) => !IGNORE.some((re) => re.test(t));

const passes = [
  { name: "loc-desktop", width: 1440, height: 900, dpr: 1 },
  { name: "loc-mobile", width: 390, height: 844, dpr: 2, mobile: true },
];

const browser = await chromium.launch();
let fail = 0;
for (const p of passes) {
  const ctx = await browser.newContext({
    viewport: { width: p.width, height: p.height },
    isMobile: !!p.mobile,
    deviceScaleFactor: p.dpr,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && isReal(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3200);

  // Switch EN → IT at runtime (el.click() bypasses hit-testing/pill visibility).
  const clicked = await page.evaluate(() => {
    const b = document.querySelector('button[aria-label="Toggle language"]');
    if (!b) return false;
    b.click();
    return true;
  });
  // Reflow above the runway → body RO → 200ms debounce → ScrollTrigger.refresh()
  await page.waitForTimeout(900);

  // Park the night edge at the viewport top: refreshed triggers ⇒ progress ≈ 1.
  await page.evaluate(() => {
    const cover = document.getElementById("nightfall");
    if (cover) window.scrollTo(0, cover.getBoundingClientRect().top + window.scrollY - 1);
  });
  await page.waitForTimeout(1400);
  const end = await page.evaluate(() => {
    const card = document.querySelector(".nightfall-card");
    const veil = document.querySelector(".nightfall-veil");
    const cover = document.getElementById("nightfall");
    const m = new DOMMatrixReadOnly(getComputedStyle(card).transform === "none" ? undefined : getComputedStyle(card).transform);
    return {
      coverTop: Math.round(cover.getBoundingClientRect().top),
      scale: m.a,
      veil: parseFloat(getComputedStyle(veil).opacity),
      covered: card.hasAttribute("data-scene-covered"),
      lang: document.querySelector('button[aria-label="Toggle language"]')?.textContent,
    };
  });

  // And mid-handoff after the switch: the pin math must still dock exactly.
  await page.evaluate(() => {
    const cover = document.getElementById("nightfall");
    if (cover) window.scrollTo(0, cover.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5);
  });
  await page.waitForTimeout(1200);
  const mid = await page.evaluate(() => {
    const card = document.querySelector(".nightfall-card");
    return { cardBottom: Math.round(card.getBoundingClientRect().bottom), vh: window.innerHeight };
  });

  // Stuck-refresh regression (major finding): park at the footer (card stuck
  // at full 100vh sticky displacement), toggle locale again (body reflow →
  // debounced safe refresh fires HERE) — the refreshInit disarm must keep the
  // card-internal trigger windows (#tech-title TideReveal) measured at flow
  // positions. Scrolled back up to reading position, the title must be
  // unmasked (--tide ≈ 1); a stale +100vh window leaves it at 0 (invisible).
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.querySelector('button[aria-label="Toggle language"]')?.click());
  await page.waitForTimeout(1600); // 200ms debounce + gsap safe-refresh delay + settle
  // Release the sticky first: at max scroll the stuck card can sit fully
  // inside the viewport (short cards), so a rect-based target would compute
  // BELOW maxScroll and clamp to no movement. Jump well above the handoff,
  // then converge on the title from flow positions.
  await page.evaluate(() => {
    const cover = document.getElementById("nightfall");
    window.scrollTo(0, Math.max(0, cover.getBoundingClientRect().top + window.scrollY - window.innerHeight * 4));
  });
  await page.waitForTimeout(700);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const t = document.getElementById("tech-title");
      if (t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35);
    });
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(1800); // scrub 1.5 catch-up
  const back = await page.evaluate(() => {
    const t = document.getElementById("tech-title");
    const content = t?.querySelector("[data-tide-content]");
    const card = document.querySelector(".nightfall-card");
    return {
      titleTopPct: t ? Math.round((t.getBoundingClientRect().top / window.innerHeight) * 100) : -1,
      tide: content ? parseFloat(getComputedStyle(content).getPropertyValue("--tide")) : -1,
      covered: card.hasAttribute("data-scene-covered"),
      pos: getComputedStyle(card).position,
    };
  });

  const ok =
    errors.length === 0 && clicked &&
    end.covered && end.scale <= 0.96 && end.veil > 0.5 &&
    Math.abs(mid.cardBottom - mid.vh) < 8 &&
    back.tide > 0.85 && !back.covered && back.pos === "sticky";
  if (!ok) fail++;
  console.log(
    `[${p.name}] ${ok ? "PASS" : "FAIL"} — clicked=${clicked} lang-btn=${end.lang} · end@coverTop=${end.coverTop}: covered=${end.covered} scale=${end.scale.toFixed(3)} veil=${end.veil.toFixed(2)} · mid: cardBottom=${mid.cardBottom}/${mid.vh} · back-up: tide=${back.tide.toFixed(2)}@title${back.titleTopPct}%vh covered=${back.covered} pos=${back.pos} · errors: ${errors.length}`,
  );
  for (const e of errors) console.log("   - " + e.slice(0, 160));
  await ctx.close();
}
await browser.close();
console.log(fail === 0 ? "ALL PASS" : `${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
