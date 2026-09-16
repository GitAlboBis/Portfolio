// scripts/visual-gate.mjs — il gate visivo comune a ogni Work Package (REDESIGN-SPEC §J).
//
//   node scripts/visual-gate.mjs <wp> [route ...] [--reduce] [--nogpu] [--base=http://localhost:3000]
//   (route con o senza slash iniziale: "styleguide" ≡ "/styleguide")
//
//   node scripts/visual-gate.mjs wp0 /styleguide
//   node scripts/visual-gate.mjs wp3 / --nogpu          -> navigator.gpu undefined (still + motivo)
//   node scripts/visual-gate.mjs wp2 / /work --reduce   -> prefers-reduced-motion: reduce
//
// Per ogni route: desktop 1440×900 (DPR 1) + mobile 390×844 (DPR 2, touch) su Chrome
// (channel "chrome", --enable-unsafe-webgpu, così il banco prova gira davvero). Il
// preloader viene saltato dal flag sessionStorage "at-preloader-seen" scritto PRIMA del
// parse (addInitScript). La pagina viene percorsa una viewport alla volta con
// `window.__lenis.scrollTo(y, { immediate: true, force: true })` (fallback window.scrollTo),
// uno screenshot per passo in .shots/<wp>/<route>-<vp>-NN.png. Errori e warning di console
// vengono raccolti (IGNORE sotto) e stampati: exit 1 su qualsiasi errore rilevante.
// Nessun "fatto" senza questi screenshot guardati.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const positional = argv.filter((a) => !a.startsWith("--"));
const wp = positional[0];
if (!wp) {
  console.error("usage: node scripts/visual-gate.mjs <wp> [route ...] [--reduce] [--nogpu] [--base=URL]");
  process.exit(2);
}
// Le route si accettano anche senza slash iniziale ("styleguide", "work/sphere-ai"):
// in Git Bash su Windows "/styleguide" viene convertito in un path di sistema (MSYS),
// quindi da lì si passa senza slash o con MSYS_NO_PATHCONV=1.
const routes = (positional.length > 1 ? positional.slice(1) : ["/"]).map((r) =>
  r.startsWith("/") ? r : `/${r}`,
);
const reduce = flags.has("--reduce");
const nogpu = flags.has("--nogpu");
const baseArg = argv.find((a) => a.startsWith("--base="));
const baseUrl = baseArg ? baseArg.slice("--base=".length) : process.env.BASE_URL || "http://localhost:3000";
const MAX_STEPS = Number(process.env.GATE_MAX_STEPS || 14);
const SETTLE_MS = Number(process.env.GATE_SETTLE_MS || 900);

const outDir = resolve(process.cwd(), ".shots", wp);
await mkdir(outDir, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false, dpr: 1 },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, dpr: 2 },
];

// Rumore noto del dev server / di three: mai un errore del nostro codice.
const IGNORE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /THREE\.Clock/i,
  /Image with src/i,
  /Warning: Extra attributes from the server/i,
];
const isRelevant = (text) => !IGNORE.some((re) => re.test(text));
const routeSlug = (r) => (r === "/" ? "home" : r.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "_"));

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});

const report = { wp, baseUrl, reduce, nogpu, routes: [] };
let relevantErrors = 0;

for (const route of routes) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      reducedMotion: reduce ? "reduce" : "no-preference",
      colorScheme: "light",
    });
    await ctx.addInitScript(
      ({ nogpu }) => {
        try {
          sessionStorage.setItem("at-preloader-seen", "1");
        } catch {}
        if (nogpu) {
          try {
            Object.defineProperty(navigator, "gpu", { get: () => undefined, configurable: true });
          } catch {}
        }
      },
      { nogpu },
    );

    const page = await ctx.newPage();
    const errors = [];
    const warnings = [];
    page.on("console", (m) => {
      const t = m.type();
      const text = m.text();
      if (!isRelevant(text)) return;
      if (t === "error") errors.push(text);
      else if (t === "warning") warnings.push(text);
    });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("requestfailed", (r) => {
      const f = r.failure()?.errorText || "";
      if (/ERR_ABORTED/i.test(f)) return; // navigazioni/prefetch annullati: non è un errore
      errors.push(`requestfailed: ${r.url()} (${f})`);
    });

    const url = new URL(route, baseUrl).toString();
    const shots = [];
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    } catch (e) {
      errors.push(`goto: ${e.message}`);
    }
    // font pronti + un respiro per Lenis/ScrollTrigger
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);

    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const steps = Math.min(MAX_STEPS, Math.max(1, Math.ceil(total / vp.height)));
    for (let i = 0; i < steps; i++) {
      const y = Math.min(i * vp.height, Math.max(0, total - vp.height));
      await page.evaluate((y) => {
        const l = window.__lenis;
        if (l && typeof l.scrollTo === "function") l.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      }, y);
      await page.waitForTimeout(SETTLE_MS);
      const file = resolve(outDir, `${routeSlug(route)}-${vp.name}-${String(i).padStart(2, "0")}.png`);
      await page.screenshot({ path: file });
      shots.push(file);
    }

    const entry = { route, viewport: vp.name, scrollHeight: total, steps, shots, errors, warnings };
    report.routes.push(entry);
    relevantErrors += errors.length;

    console.log(`\n[${wp}] ${route} · ${vp.name} ${vp.width}×${vp.height}@${vp.dpr} · height ${total}px · ${steps} shot(s)`);
    for (const s of shots) console.log(`   shot  ${s}`);
    console.log(`   console errors: ${errors.length} · warnings: ${warnings.length}`);
    for (const e of errors) console.log(`   ✗ ${e}`);
    for (const w of warnings) console.log(`   ! ${w}`);

    await ctx.close();
  }
}

await browser.close();
await writeFile(resolve(outDir, "gate-report.json"), JSON.stringify(report, null, 2));

const mode = [reduce && "reduced-motion", nogpu && "no-webgpu"].filter(Boolean).join(", ") || "default";
console.log(`\n${wp} · ${routes.join(" ")} · ${mode} → ${relevantErrors === 0 ? "CLEAN" : `${relevantErrors} relevant console error(s)`}`);
console.log(`report: ${resolve(outDir, "gate-report.json")}`);
process.exit(relevantErrors === 0 ? 0 : 1);
