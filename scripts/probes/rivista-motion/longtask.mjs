// longtask.mjs · MC-31 acceptance (canon §6 P0): no long task > 50 ms between the click and the landing of a cut.
// Desktop 1440×900. Two rounds of forward (tile 01 → case) and back (case → tile) S4 cuts. The probe's init script
// observes `longtask` entries in both documents (PerformanceObserver, buffered) and times every
// ScrollTrigger.refresh() call; the landing is the last frame the travelling overlay ([data-nv-img]) is visible.
//   MC-31.<cut>   no long task in [click, landing]; the refresh calls in that window are listed with their cost
// Usage: node longtask.mjs [--cpu 4]  (--cpu N: CDP CPU throttling ×N, the Lighthouse-mobile lab factor is 4;
//                                      RV_BASE=<url> to probe another tree)
import path from "node:path";
import * as S from "./strip.mjs";

const ci = process.argv.indexOf("--cpu");
const CPU = ci > 0 ? Number(process.argv[ci + 1]) || 1 : 1;
const dir = S.outDir("longtask", `cpu${CPU}`);
const out = { cuts: [], verdicts: [] };
const V = (...a) => out.verdicts.push(S.verdict(...a));

const SAMPLER = `function(){ const i=document.querySelector("[data-nv-img]"); if(!i) return 0; const cs=getComputedStyle(i); return cs.visibility!=="hidden" && +cs.opacity>0.01 ? 1 : 0; }`;

async function cut(page, label, click) {
  await page.evaluate(() => { __probe.s = []; __probe.ev = []; __probe.lt = []; __probe.rf = []; __probe.arm(); });
  const from = page.url().split("?")[0];
  const t0 = await S.pageNow(page);
  await click();
  await page.waitForURL((u) => u.toString().split("?")[0] !== from, { timeout: 8000 });
  await S.sleep(2600);
  const docs = await S.collect(page);
  const samples = docs.flatMap((d, k) => d.s.map((x) => ({ t: x.e - t0, v: x.v, doc: k })));
  const vis = samples.filter((x) => x.v === 1 && x.t >= 0);
  const landing = vis.length ? vis[vis.length - 1].t : null;
  const lt = docs.flatMap((d, k) => d.lt.map((e) => ({ t: +(e.e - t0).toFixed(1), dur: e.dur, doc: k, attr: e.attr })));
  const rf = docs.flatMap((d, k) => d.rf.map((e) => ({ t: +(e.e - t0).toFixed(1), dur: e.dur, doc: k })));
  const ev = docs.flatMap((d, k) => d.ev.filter((e) => e.n.startsWith("fx:")).map((e) => ({ t: +(e.e - t0).toFixed(1), n: e.n, doc: k })));
  const end = landing ?? 1600;
  // each long task carries the fx events and refresh calls that fall inside it (what the main thread was doing)
  const inCut = lt.filter((x) => x.t + x.dur > 0 && x.t < end).map((x) => ({ ...x,
    during: ev.filter((e) => e.doc === x.doc && e.t >= x.t - 1 && e.t <= x.t + x.dur + 1).map((e) => e.n)
      .concat(rf.filter((f) => f.doc === x.doc && f.t >= x.t - 1 && f.t <= x.t + x.dur + 1).map((f) => `ST.refresh ${f.dur} ms`)) }));
  const rfIn = rf.filter((x) => x.t >= 0 && x.t < end);
  const tbt = inCut.reduce((a, x) => a + Math.max(0, x.dur - 50), 0);
  const r = { label, landing: landing == null ? null : +landing.toFixed(1), longTasks: inCut, refreshes: rfIn, allRefreshes: rf, tbtInCut: +tbt.toFixed(1), events: ev };
  out.cuts.push(r);
  V(`MC-31.${label}${CPU > 1 ? `@cpu${CPU}` : ""}`, inCut.length === 0, `${inCut.length} long task(s) in [click, landing ${r.landing} ms]: ${inCut.map((x) => `${x.dur} ms @ ${x.t} (doc${x.doc}${x.during.length ? ": " + x.during.join("+") : ""})`).join(", ") || "none"}; ScrollTrigger.refresh in the window: ${rfIn.map((x) => `${x.dur} ms @ ${x.t} (doc${x.doc})`).join(", ") || "none"}; blocking ${r.tbtInCut} ms`);
  return r;
}

const browser = await S.L.launch({ headless: false });
try {
  const { page, context, consoleMsgs } = await S.open(browser, "work.html", { ...S.VP.desktop, introSeen: true, sampler: SAMPLER });
  await S.sleep(2500);
  if (CPU > 1) { const cdp = await context.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }); out.cpu = CPU; }
  const tileClick = async () => { const b = await page.locator('[data-tile-id="01"] .tile-media').boundingBox(); await page.mouse.click(b.x + b.width / 2, Math.min(b.y + b.height / 2, 860)); };
  const backClick = async () => { await page.locator("a.ghost[data-back]").first().click(); };
  for (const round of [1, 2]) {
    await S.toRail(page);
    await cut(page, `fwd-${round}`, tileClick);
    await S.sleep(1200);
    await cut(page, `back-${round}`, backClick);
    await S.sleep(800);
  }
  out.console = S.consoleVerdict(consoleMsgs);
  V("console", out.console.clean && out.console.warnings.length === 0, `${out.console.errors.length} errors, ${out.console.warnings.length} warnings`);
  await context.close();
} catch (e) {
  out.error = String((e && e.stack) || e);
  console.log("ERROR", out.error);
} finally {
  await browser.close();
  S.writeJSON(path.join(dir, "longtask.json"), out);
}
const fails = out.verdicts.filter((v) => v.verdict === "FAIL").length;
console.log(`longtask: ${fails} FAIL · ${path.join(dir, "longtask.json")}`);
process.exitCode = fails || out.error ? 1 : 0;
