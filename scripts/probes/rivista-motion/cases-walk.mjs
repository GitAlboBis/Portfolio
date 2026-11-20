// cases-walk.mjs · spec 20 §6 R3 / B9: the issue walked by its next-work links, 01 → 09 → 01, twice (18 S5 cuts),
// 1440×900, bfcache on (Chrome keeps up to six documents, each with its band device once its still-page gate opened).
// Per arrival: domInteractive, the long animation frames > 100 ms before the first paint (the seam stall of R4/R5),
// GPU device losses (every device the page asks for is watched). Pass: no device.lost, and seam stalls at or below
// R5's measured rate (1 in 40 case-first arrivals: here at most 1 of 18).
// GPU-timed: run it holding _shots/.gpu.lock. Usage: node cases-walk.mjs   (RV_BASE=<url>)
import fs from "node:fs";
import path from "node:path";
import * as L from "../../lib/headless.mjs";

const BASE = process.env.RV_BASE || L.BASE;
const OUT = path.join(L.ROOT, "_shots", "rivista-next", "cases", "walk");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const INIT = () => {
  window.__seamLoaf = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__seamLoaf.push({ s: +e.startTime.toFixed(1), d: +e.duration.toFixed(1) }); }).observe({ type: "long-animation-frame", buffered: true }); } catch (e) {}
  try { sessionStorage.setItem("rv-intro-seen", "1"); } catch (e) {}
  try {
    const lost = JSON.parse(sessionStorage.getItem("__walkLost") || "[]");
    window.__walkLost = lost;
    if (typeof GPUAdapter !== "undefined") {
      const orig = GPUAdapter.prototype.requestDevice;
      GPUAdapter.prototype.requestDevice = async function (...a) {
        const d = await orig.apply(this, a);
        d.lost.then((info) => { try { const l = JSON.parse(sessionStorage.getItem("__walkLost") || "[]"); l.push({ page: location.pathname.split("/").pop(), reason: info && info.reason, msg: info && info.message }); sessionStorage.setItem("__walkLost", JSON.stringify(l)); } catch (e) {} });
        return d;
      };
    }
  } catch (e) {}
};
const SEAM = () => {
  const n = performance.getEntriesByType("navigation")[0] || {};
  const fp = performance.getEntriesByType("paint").find((e) => e.name === "first-paint");
  const f = fp ? fp.startTime : n.domInteractive || 0;
  return { page: location.pathname.split("/").pop(), type: n.type, di: +(n.domInteractive || 0).toFixed(1), fp: fp ? +fp.startTime.toFixed(1) : null,
    long: (window.__seamLoaf || []).filter((x) => x.d > 100 && x.s < f + 16), gl: (window.FX && FX.gl && FX.gl.state) || null };
};
const ORDER = ["spherenode", "sphere-ai", "maintech-oma", "sersan-io", "domus-tua", "sersan-brand", "badante24h", "doit-voice-ai-agent", "agricultural-supply-chain"];
const browser = await L.launch();
const rows = [], msgs = [];
let error = null;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(INIT);
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error") msgs.push(m.text()); });
  page.on("pageerror", (e) => msgs.push("pageerror: " + e.message));
  await page.goto(BASE + "case-spherenode.html", { waitUntil: "load" });
  await page.waitForFunction(() => window.FX && FX.isReady, null, { timeout: 15000 });
  await sleep(4000);   // the band's still-page gate (R3) opens: this page holds a device from now on
  for (let k = 1; k <= ORDER.length * 2; k++) {
    const want = "case-" + ORDER[k % ORDER.length] + ".html";
    /* every page links its band device before it is left (the bfcache then holds up to six of them, R3) */
    await page.evaluate(() => { const y = document.documentElement.scrollHeight - innerHeight; FX.scrollTo(y, { immediate: true }); window.scrollTo(0, y); });
    const t0 = Date.now();
    let leaveGl = null;
    while (Date.now() - t0 < 10000) { leaveGl = await page.evaluate(() => (window.FX && FX.gl && FX.gl.state) || null); if (leaveGl === "run") break; await sleep(250); }
    await sleep(600);
    await page.evaluate(() => { const a = document.querySelector("a.next-link"); const y = a.getBoundingClientRect().top + scrollY - innerHeight * 0.4; FX.scrollTo(y, { immediate: true }); window.scrollTo(0, y); });
    await sleep(700);
    const from = page.url();
    const b = await page.locator("a.next-link").boundingBox();
    await page.mouse.click(b.x + Math.min(200, b.width / 2), b.y + Math.min(60, b.height / 2));
    await page.waitForURL((u) => u.toString().split("?")[0] !== from.split("?")[0], { timeout: 9000 });
    await page.waitForLoadState("load");
    await page.waitForFunction(() => window.FX && FX.isReady, null, { timeout: 15000 }).catch(() => {});
    await sleep(3600);   // the still-page gate opens on every case: each one links its band device before the next cut
    const s = await page.evaluate(SEAM);
    s.ok = s.page === want;
    s.leftGl = leaveGl;
    rows.push(s);
    console.log(`${String(k).padStart(2)} ${s.page.padEnd(38)} di ${String(s.di).padStart(6)} fp ${String(s.fp).padStart(6)} long ${s.long.map((x) => x.d + "@" + x.s).join(",") || "-"} left with gl ${s.leftGl}, arrived gl ${s.gl}${s.ok ? "" : " WRONG PAGE (want " + want + ")"}`);
  }
  const lost = await page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem("__walkLost") || "[]"); } catch (e) { return []; } });
  rows.lost = lost;
  await context.close();
} catch (e) { error = String((e && e.stack) || e); console.log("ERROR", error); }
finally { await browser.close(); }
const lost = rows.lost || [];
const stalls = rows.filter((r) => r.long.length).length;
const pass = !error && rows.length === ORDER.length * 2 && rows.every((r) => r.ok) && lost.filter((l) => l.reason !== "destroyed").length === 0 && stalls <= 1 && msgs.length === 0;
const report = { base: BASE, date: new Date().toISOString(), pass, cuts: rows.length, stalls, lost, errors: msgs, rows, error };
fs.writeFileSync(path.join(OUT, "cases-walk.json"), JSON.stringify(report, null, 1));
console.log(`walk: ${pass ? "PASS" : "FAIL"} · ${rows.length} cuts · seam stalls ${stalls} · device.lost (not destroyed) ${lost.filter((l) => l.reason !== "destroyed").length} (all: ${JSON.stringify(lost).slice(0, 200)}) · console errors ${msgs.length}`);
process.exitCode = pass ? 0 : 1;
