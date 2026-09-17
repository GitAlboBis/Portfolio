// scripts/probes/wp10-evidence.mjs — WP-10 evidence pack (mechanical gates).
//
//   node scripts/probes/wp10-evidence.mjs [--base=URL]
//
// 1. full-page captures of every route, EN and IT, desktop 1440×900 + mobile 390×844
//    → .shots/wp10/<route>-<vp>-<locale>.png
//    plus .impeccable/review/desktop.png + mobile.png (the home sheet, from the top)
// 2. EN/IT parity: visible text set per route/locale, <html lang>, overflow probe
//    → .shots/wp10/parity.json
// 3. keyboard: tab order from the top of the sheet, focus ring colour on the yellow
//    band, skip-link target resolution → .shots/wp10/keyboard.json
// 4. reduced-motion and no-WebGPU stills of the home bench
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const baseArg = argv.find((a) => a.startsWith("--base="));
const baseUrl = baseArg ? baseArg.slice(7) : process.env.BASE_URL || "http://localhost:3000";

const ROUTES = ["/", "/work", "/work/sersan-io", "/work/sphere-ai", "/about", "/styleguide", "/no-such-page-404"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false, dpr: 1 },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, dpr: 2 },
];

const shotDir = resolve(process.cwd(), ".shots", "wp10");
const reviewDir = resolve(process.cwd(), ".impeccable", "review");
await mkdir(shotDir, { recursive: true });
await mkdir(reviewDir, { recursive: true });
const slug = (r) => (r === "/" ? "home" : r.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "_"));

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});

/** A context seeded with the preloader flag and (optionally) the IT locale. */
async function makeCtx(vp, { locale = "en", reduce = false, nogpu = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    reducedMotion: reduce ? "reduce" : "no-preference",
    colorScheme: "light",
  });
  await ctx.addInitScript(
    ({ locale, nogpu }) => {
      try {
        sessionStorage.setItem("at-preloader-seen", "1");
        // the zustand persist key is "ocean-ui" (legacy name, see CLAUDE.md §0)
        localStorage.setItem("ocean-ui", JSON.stringify({ state: { locale }, version: 0 }));
      } catch {}
      if (nogpu) {
        try {
          Object.defineProperty(navigator, "gpu", { get: () => undefined, configurable: true });
        } catch {}
      }
    },
    { locale, nogpu },
  );
  return ctx;
}

async function settle(page) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(1200);
  // walk the sheet so every ScrollTrigger reveal has fired, then come back up
  await page.evaluate(async () => {
    const go = (y) =>
      new Promise((r) => {
        const l = window.__lenis;
        if (l && typeof l.scrollTo === "function") l.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        setTimeout(r, 220);
      });
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += window.innerHeight) await go(y);
    await go(h);
    await go(0);
  });
  await page.waitForTimeout(900);
}

/** Visible text of the page, normalised, as an ordered list. */
const TEXT_FN = () => {
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const el = n.parentElement;
    if (!el) continue;
    if (el.closest("script,style,noscript,[aria-hidden='true'],.sr-only")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const t = n.textContent.replace(/\s+/g, " ").trim();
    if (t) out.push(t);
  }
  return out;
};

/** Anything that overflows the viewport horizontally, or a cell clipping its text. */
const OVERFLOW_FN = () => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  if (document.documentElement.scrollWidth > vw + 1)
    bad.push({ kind: "page", detail: `scrollWidth ${document.documentElement.scrollWidth} > ${vw}` });
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1.5 || r.left < -1.5) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed") continue;
      bad.push({ kind: "bleed", sel: el.tagName + "." + String(el.className).slice(0, 48), right: Math.round(r.right) });
    }
    // text clipped by a fixed-height box (ellipsis is deliberate; hidden is not)
    const cs = getComputedStyle(el);
    if (cs.overflow === "hidden" && cs.textOverflow !== "ellipsis" && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
      if (el.querySelector("canvas,img,svg")) continue;
      const t = el.textContent.replace(/\s+/g, " ").trim();
      if (t.length > 4)
        bad.push({ kind: "clip", sel: el.tagName + "." + String(el.className).slice(0, 48), scroll: el.scrollHeight, client: el.clientHeight, text: t.slice(0, 48) });
    }
  }
  return bad.slice(0, 20);
};

const parity = [];

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const perLocale = {};
    for (const locale of ["en", "it"]) {
      const ctx = await makeCtx(vp, { locale });
      const page = await ctx.newPage();
      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle", timeout: 60_000 });
      await settle(page);
      const lang = await page.evaluate(() => document.documentElement.getAttribute("lang"));
      const text = await page.evaluate(TEXT_FN);
      const overflow = await page.evaluate(OVERFLOW_FN);
      const file = resolve(shotDir, `${slug(route)}-${vp.name}-${locale}.png`);
      /* CHROME'S 16,384px TEXTURE CEILING (finish review F7). A fullPage shot of
         a 12,500px sheet at DPR2 is 25,000 device px: Chrome returns it STITCHED
         WRONG — the page restarts from the header mid-image and later slices
         replay earlier sections — and the gate then "images" a ledger nobody
         ever photographed. Over the ceiling we take the first viewport instead
         and say so; the whole sheet is captured as verified tiles by
         scripts/probes/_recapture.mjs. */
      const devicePx = (await page.evaluate(() => document.documentElement.scrollHeight)) * vp.dpr;
      const tooTall = devicePx > 16384;
      await page.screenshot({ path: file, fullPage: !tooTall });
      if (tooTall) console.log(`  [ceiling] ${route} ${vp.name}: ${devicePx}px > 16384 — first viewport only`);
      if (route === "/" && locale === "en") {
        await page.screenshot({ path: resolve(reviewDir, `${vp.name}.png`), fullPage: !tooTall });
      }
      perLocale[locale] = { lang, text, overflow, shot: file };
      await ctx.close();
    }
    const en = new Set(perLocale.en.text);
    const it = new Set(perLocale.it.text);
    const shared = [...en].filter((s) => it.has(s));
    parity.push({
      route,
      viewport: vp.name,
      langEn: perLocale.en.lang,
      langIt: perLocale.it.lang,
      enCount: perLocale.en.text.length,
      itCount: perLocale.it.text.length,
      identical: shared,
      onlyEn: [...en].filter((s) => !it.has(s)).slice(0, 80),
      onlyIt: [...it].filter((s) => !en.has(s)).slice(0, 80),
      overflowEn: perLocale.en.overflow,
      overflowIt: perLocale.it.overflow,
      shots: { en: perLocale.en.shot, it: perLocale.it.shot },
    });
    console.log(
      `[parity] ${route} · ${vp.name} · lang en=${perLocale.en.lang} it=${perLocale.it.lang} · strings ${perLocale.en.text.length}/${perLocale.it.text.length} · identical ${shared.length} · overflow ${perLocale.en.overflow.length}/${perLocale.it.overflow.length}`,
    );
  }
}
await writeFile(resolve(shotDir, "parity.json"), JSON.stringify(parity, null, 2));

/* ── keyboard: tab order, focus ring on the band, skip link ─────────────── */
const keyboard = [];
for (const route of ["/", "/work", "/about", "/styleguide", "/no-such-page-404"]) {
  const ctx = await makeCtx(VIEWPORTS[0]);
  const page = await ctx.newPage();
  await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle", timeout: 60_000 });
  await settle(page);

  const stops = [];
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      // the ground the ring sits on
      let bg = "";
      let el = a;
      while (el && el !== document.documentElement) {
        const c = getComputedStyle(el).backgroundColor;
        if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") {
          bg = c;
          break;
        }
        el = el.parentElement;
      }
      return {
        tag: a.tagName,
        text: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 44),
        href: a.getAttribute("href"),
        outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
        shadow: cs.boxShadow,
        onGround: bg,
        size: [Math.round(r.width), Math.round(r.height)],
      };
    });
    if (!s) break;
    stops.push(s);
  }

  // skip link: focus it, press Enter, see where focus landed
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press("Tab"); // may need a reset: re-focus from the top
  const skip = await page.evaluate(() => {
    const a = document.querySelector('a[href^="#"]');
    if (!a) return null;
    return { href: a.getAttribute("href"), targetExists: !!document.querySelector(a.getAttribute("href")), text: a.textContent.trim() };
  });
  let landed = null;
  if (skip?.targetExists) {
    await page.evaluate(() => {
      const a = document.querySelector('a[href^="#"]');
      a.focus();
    });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    landed = await page.evaluate(() => {
      const a = document.activeElement;
      return { tag: a?.tagName, id: a?.id, scrollY: Math.round(window.scrollY) };
    });
  }
  keyboard.push({ route, skip, landed, stops });
  console.log(
    `[kbd] ${route} · skip ${skip?.href} target=${skip?.targetExists} → focus ${landed?.tag}#${landed?.id} @${landed?.scrollY}px · ${stops.length} stops`,
  );
  await ctx.close();
}
await writeFile(resolve(shotDir, "keyboard.json"), JSON.stringify(keyboard, null, 2));

/* ── degraded states: reduced motion + no WebGPU (the labelled still) ───── */
for (const [tag, opts] of [
  ["reduce", { reduce: true }],
  ["nogpu", { nogpu: true }],
]) {
  for (const vp of VIEWPORTS) {
    const ctx = await makeCtx(vp, opts);
    const page = await ctx.newPage();
    await page.goto(baseUrl + "/", { waitUntil: "networkidle", timeout: 60_000 });
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({ path: resolve(shotDir, `home-${vp.name}-${tag}.png`) });
    const bench = await page.evaluate(() => {
      const box = document.querySelector(".bench-box");
      if (!box) return null;
      return {
        hasCanvas: !!box.querySelector("canvas"),
        hasStill: !!box.querySelector("img"),
        text: box.textContent.replace(/\s+/g, " ").trim().slice(0, 160),
      };
    });
    console.log(`[${tag}] ${vp.name} · bench ${JSON.stringify(bench)}`);
    await ctx.close();
  }
}

await browser.close();
console.log("\nevidence → .shots/wp10 · .impeccable/review");
