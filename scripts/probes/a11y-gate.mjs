// scripts/probes/a11y-gate.mjs — WP-10 gate meccanico: axe-core su ogni route, due viewport.
//
//   node scripts/probes/a11y-gate.mjs [--base=http://localhost:3000] [--reduce] [--routes=/,/about]
//
// Per ogni route × viewport (1440×900 DPR1, 390×844 DPR2): carica con il preloader
// saltato, aspetta 2s, scorre fino in fondo e torna su (così ScrollTrigger monta
// tutto il DOM pinnato), inietta axe-core dal CDN e chiama axe.run con i tag
// wcag2a/wcag2aa/wcag21aa/wcag22aa/best-practice.
// Output: .shots/wp10/axe/<route>-<vp>.json + un sommario su stdout.
// Exit 1 se esiste una violazione serious/critical.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const hit = argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const baseUrl = arg("base", process.env.BASE_URL || "http://localhost:3000");
const reduce = argv.includes("--reduce");
const nogpu = argv.includes("--nogpu");
const ROUTES = arg("routes", "/,/work,/work/sersan-io,/work/sphere-ai,/about,/styleguide,/no-such-page-404")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const AXE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false, dpr: 1 },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, dpr: 2 },
];

const outDir = resolve(process.cwd(), ".shots", "wp10", "axe");
await mkdir(outDir, { recursive: true });
const slug = (r) => (r === "/" ? "home" : r.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "_"));

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});

const summary = [];
let seriousTotal = 0;

for (const route of ROUTES) {
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
    const url = new URL(route, baseUrl).toString();
    let lang = null;
    let violations = [];
    let error = null;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await page.evaluate(() => document.fonts?.ready).catch(() => {});
      await page.waitForTimeout(2000);
      // percorri la pagina: molte sezioni montano solo dopo lo scroll
      await page.evaluate(async () => {
        const go = (y) =>
          new Promise((r) => {
            const l = window.__lenis;
            if (l && typeof l.scrollTo === "function") l.scrollTo(y, { immediate: true, force: true });
            else window.scrollTo(0, y);
            setTimeout(r, 250);
          });
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += window.innerHeight) await go(y);
        await go(h);
        await go(0);
      });
      await page.waitForTimeout(800);
      lang = await page.evaluate(() => document.documentElement.getAttribute("lang"));
      await page.addScriptTag({ url: AXE_CDN });
      const res = await page.evaluate(
        async (tags) => await window.axe.run(document, { runOnly: { type: "tag", values: tags } }),
        TAGS,
      );
      violations = res.violations;
    } catch (e) {
      error = e.message;
    }

    const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of violations) byImpact[v.impact ?? "minor"] = (byImpact[v.impact ?? "minor"] ?? 0) + v.nodes.length;
    const serious = byImpact.critical + byImpact.serious;
    seriousTotal += serious;

    const detail = violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      count: v.nodes.length,
      nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target, summary: n.failureSummary?.split("\n").slice(0, 4).join(" | ") })),
    }));

    const file = resolve(outDir, `${slug(route)}-${vp.name}${reduce ? "-reduce" : ""}${nogpu ? "-nogpu" : ""}.json`);
    await writeFile(file, JSON.stringify({ route, viewport: vp.name, lang, error, byImpact, violations: detail }, null, 2));

    summary.push({ route, viewport: vp.name, lang, error, ...byImpact });
    console.log(
      `\n[axe] ${route} · ${vp.name} · lang=${lang}${error ? ` · ERROR ${error}` : ""}` +
        `\n   critical ${byImpact.critical} · serious ${byImpact.serious} · moderate ${byImpact.moderate} · minor ${byImpact.minor}`,
    );
    for (const d of detail) {
      console.log(`   [${d.impact}] ${d.id} ×${d.count} — ${d.help}`);
      for (const n of d.nodes) console.log(`        ${n.target.join(" ")}  ::  ${n.summary ?? ""}`);
    }
    await ctx.close();
  }
}

await browser.close();
await writeFile(resolve(outDir, `summary${reduce ? "-reduce" : ""}${nogpu ? "-nogpu" : ""}.json`), JSON.stringify(summary, null, 2));
console.log(`\naxe gate → serious+critical nodes: ${seriousTotal}`);
process.exit(seriousTotal === 0 ? 0 : 1);
