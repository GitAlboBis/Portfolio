// strip.mjs · the lane-P harness of the rivista motion canon (docs/redesign/rivista-motion/10-motion-canon.md §6, §8).
//
// Library (imported by menu/tokens/longtask.mjs) and a small CLI:
//   * open(browser, url, o)     — openSite()'s twin that installs the probe init scripts BEFORE the first byte:
//                                 an fx:* event recorder (every window.dispatchEvent), effop.js, a longtask
//                                 observer, a ScrollTrigger.refresh timer, and an armable per-frame sampler.
//                                 Everything is stamped in EPOCH ms (performance.timeOrigin + now) so the two
//                                 documents of a cut and the CDP screencast share one clock. On pagehide the
//                                 page's records are flushed to sessionStorage and picked up by the next document.
//   * screencast(page, o)       — a CDP Page.startScreencast recorder that survives navigation (it re-arms on the
//                                 new document); frames carry the compositor swap time (metadata.timestamp).
//   * analyse(frames, o)        — writes numbered frames + strip.json: per-frame mean luminance over a region,
//                                 |Δ| to the previous frame, a spike flag when |Δ| > k × running median (k = 4),
//                                 and a "bare paper" flag when ≥ 99.5 % of a region's pixels are paper.
//   * contact(frames, file, o)  — one labelled contact sheet per strip (what the director LOOKS at with Read).
//
// CLI: node strip.mjs <url> [--ms 3000] [--vp 1440x900|390x844] [--click <css>] [--wheel <px>] [--seen]
//                           [--region x,y,w,h] [--bare x,y,w,h] [--tag name]
// e.g. node strip.mjs index.html --seen --wheel 900 --ms 2500 --tag wheel-s3
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as L from "../../lib/headless.mjs";
import { shot } from "../../lib/headless.mjs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const EFFOP = path.join(HERE, "effop.js");
export const ROOT = L.ROOT;
/** The prototype's URL. RV_BASE overrides it (e.g. a frozen snapshot of HEAD served next to the live tree). */
export const BASE = process.env.RV_BASE || L.BASE;
export const SHOTS = path.join(ROOT, "_shots", "rivista-motion", "P");
export { L, shot };

/** Palette of the V1 paper (fx-core.css :root). */
export const PAPER = [[0xf6, 0xf3, 0xec], [0xed, 0xe7, 0xdc]];

export const VP = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ in-page probe (init script)
/* Runs at document start in every document of the page. window.__probe:
     ev[]    {e, n, d}      fx:* events (+ pointerdown/click/keydown/pagehide/load marks)
     lt[]    {e, dur, name} long tasks
     rf[]    {e, dur}       ScrollTrigger.refresh() calls and their cost
     s[]     {e, v}         per-frame samples of window.__probeSampler (when armed)
     doc                    {url, timeOrigin, t0 (__rvT0 epoch or null)}
   sessionStorage "__probe_docs" holds the finished documents; "__probe_arm" keeps the sampler armed
   across a navigation (so the arrival is sampled from its first frame). */
const PROBE = () => {
  if (window.__probe) return;
  const now = () => performance.timeOrigin + performance.now();
  const P = (window.__probe = { ev: [], lt: [], rf: [], s: [], armed: false, doc: { url: location.href, timeOrigin: performance.timeOrigin } });
  const trim = (d) => { try { return JSON.parse(JSON.stringify(d || {})); } catch (e) { return {}; } };
  const orig = window.dispatchEvent.bind(window);
  window.dispatchEvent = function (evt) {
    try { if (evt && typeof evt.type === "string" && evt.type.indexOf("fx:") === 0 && evt.type !== "fx:gl:stats") P.ev.push({ e: now(), n: evt.type, d: trim(evt.detail) }); } catch (e) {}
    return orig(evt);
  };
  for (const n of ["pointerdown", "click", "keydown"]) window.addEventListener(n, (e) => P.ev.push({ e: now(), n: "@" + n, d: { key: e.key || null, x: e.clientX, y: e.clientY } }), true);
  window.addEventListener("load", () => P.ev.push({ e: now(), n: "@load", d: {} }));
  try {
    new PerformanceObserver((l) => { for (const x of l.getEntries()) P.lt.push({ e: performance.timeOrigin + x.startTime, dur: +x.duration.toFixed(1), name: x.name, attr: (x.attribution || []).map((a) => a.containerSrc || a.name).join(",") }); })
      .observe({ type: "longtask", buffered: true });
  } catch (e) {}
  // time every ScrollTrigger.refresh (gsap's UMD assigns window.ScrollTrigger)
  try {
    let st;
    Object.defineProperty(window, "ScrollTrigger", {
      configurable: true, enumerable: true,
      get: () => st,
      set: (v) => {
        st = v;
        if (v && typeof v.refresh === "function" && !v.refresh.__probe) {
          const r = v.refresh;
          const w = function () { const a = now(); try { return r.apply(this, arguments); } finally { P.rf.push({ e: a, dur: +(now() - a).toFixed(1) }); } };
          w.__probe = true; v.refresh = w;
        }
      },
    });
  } catch (e) {}
  // the sampler: window.__probeSampler() is called once per frame while armed
  const loop = (t) => {
    if (!P.armed) return;
    let v = null;
    try { v = window.__probeSampler ? window.__probeSampler() : null; } catch (e) { v = { err: String(e && e.message) }; }
    P.s.push({ e: performance.timeOrigin + t, v });
    requestAnimationFrame(loop);
  };
  P.arm = () => { if (P.armed) return; P.armed = true; try { sessionStorage.setItem("__probe_arm", "1"); } catch (e) {} requestAnimationFrame(loop); };
  P.disarm = () => { P.armed = false; try { sessionStorage.removeItem("__probe_arm"); } catch (e) {} };
  let armed = null; try { armed = sessionStorage.getItem("__probe_arm"); } catch (e) {}
  if (armed) P.arm();
  const snap = () => ({ doc: Object.assign({}, P.doc, { t0: typeof window.__rvT0 === "number" ? performance.timeOrigin + window.__rvT0 : null }), ev: P.ev, lt: P.lt, rf: P.rf, s: P.s });
  P.snap = snap;
  window.addEventListener("pagehide", () => {
    P.ev.push({ e: now(), n: "@pagehide", d: {} });
    try { const a = JSON.parse(sessionStorage.getItem("__probe_docs") || "[]"); a.push(snap()); sessionStorage.setItem("__probe_docs", JSON.stringify(a)); } catch (e) {}
  });
};

/**
 * Open a rivista page with the probe installed (its own init scripts go in before the first byte).
 * @param {import("playwright").Browser} browser
 * @param {string} url relative to BASE
 * @param {{viewport?:{width:number,height:number}, deviceScaleFactor?:number, isMobile?:boolean, hasTouch?:boolean,
 *          reducedMotion?:"reduce"|"no-preference", introSeen?:boolean, noGpu?:boolean, waitUntil?:string,
 *          sampler?:string, arm?:boolean, init?:string[], before?:(page)=>Promise<void>}} [o]
 *   before:  called after the init scripts and before goto (start a screencast here to film a first load).
 *   sampler: source of a function expression, installed as window.__probeSampler in every document.
 *   arm:     arm the sampler from the first frame of the first document (the intro).
 */
export async function open(browser, url, o = {}) {
  const context = await browser.newContext({
    viewport: o.viewport ?? { width: 1440, height: 900 },
    deviceScaleFactor: o.deviceScaleFactor ?? 1,
    isMobile: o.isMobile ?? false,
    hasTouch: o.hasTouch ?? false,
    reducedMotion: o.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on("console", (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on("pageerror", (e) => consoleMsgs.push({ type: "pageerror", text: String((e && e.stack) || e) }));
  page.on("response", (r) => { if (r.status() >= 400) consoleMsgs.push({ type: "http", text: `${r.status()} ${r.url()}` }); });
  page.on("requestfailed", (r) => { const t = r.failure()?.errorText || ""; if (!/ERR_ABORTED/.test(t)) consoleMsgs.push({ type: "requestfailed", text: `${r.url()} ${t}` }); });
  if (o.noGpu) await page.addInitScript(() => { try { delete Navigator.prototype.gpu; } catch (e) {} });
  await page.addInitScript(({ seen, arm }) => {
    try {
      if (!sessionStorage.getItem("__probe_boot")) {
        sessionStorage.setItem("__probe_boot", "1");
        sessionStorage.removeItem("__probe_docs");
        if (seen) sessionStorage.setItem("rv-intro-seen", "1");
        if (arm) sessionStorage.setItem("__probe_arm", "1");
      }
    } catch (e) {}
  }, { seen: !!o.introSeen, arm: !!o.arm });
  await page.addInitScript({ path: EFFOP });
  await page.addInitScript(PROBE);
  if (o.sampler) await page.addInitScript({ content: `window.__probeSampler = (${o.sampler});` });
  for (const s of o.init || []) await page.addInitScript({ content: s });
  if (o.before) await o.before(page);
  await page.goto(BASE + url, { waitUntil: o.waitUntil ?? "load", timeout: 30000 });
  return { context, page, consoleMsgs };
}

/** Install (or replace) the sampler in the current document and in every later one, then arm it. */
export async function arm(page, samplerSrc) {
  if (samplerSrc) {
    await page.addInitScript({ content: `window.__probeSampler = (${samplerSrc});` });
    await page.evaluate((s) => { window.__probeSampler = (0, eval)("(" + s + ")"); }, samplerSrc);
  }
  await page.evaluate(() => { window.__probe.s = []; window.__probe.arm(); });
}

/** Every document's records so far (finished documents from sessionStorage + the live one), oldest first. */
export async function collect(page, { disarm = true, clear = true } = {}) {
  return page.evaluate(({ disarm, clear }) => {
    const P = window.__probe;
    if (disarm) P.disarm();
    let docs = [];
    try { docs = JSON.parse(sessionStorage.getItem("__probe_docs") || "[]"); } catch (e) {}
    docs.push(P.snap());
    if (clear) { try { sessionStorage.removeItem("__probe_docs"); } catch (e) {} P.ev = []; P.lt = []; P.rf = []; P.s = []; }
    return docs;
  }, { disarm, clear });
}

/** Browser epoch "now" (ms), for marking Node-side actions on the page clock. */
export const pageNow = (page) => page.evaluate(() => performance.timeOrigin + performance.now());

// ------------------------------------------------------------------ screencast
/**
 * CDP screencast that survives navigation. Frames: { i, e (epoch ms of the compositor swap), data (base64), w, h,
 * dw, dh (CSS px of the device), doc }.
 * @param {import("playwright").Page} page
 */
export async function screencast(page, { format = "jpeg", quality = 80, maxWidth, maxHeight, everyNthFrame = 1 } = {}) {
  const vp = page.viewportSize();
  const mw = maxWidth ?? vp.width * 2, mh = maxHeight ?? vp.height * 2;
  const frames = [];
  let cdp = null, doc = 0, stopped = false;
  const startOn = async () => {
    cdp = await page.context().newCDPSession(page);
    cdp.on("Page.screencastFrame", (f) => {
      const m = f.metadata || {};
      frames.push({ i: frames.length, e: (m.timestamp || Date.now() / 1000) * 1000, data: f.data, dw: m.deviceWidth, dh: m.deviceHeight, doc });
      cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send("Page.startScreencast", { format, quality, maxWidth: mw, maxHeight: mh, everyNthFrame });
  };
  await startOn();
  // a cross-document navigation may end the screencast: re-arm it on the new document
  let path0 = null;
  try { path0 = new URL(page.url()).pathname; } catch (e) {}
  const onNav = async (fr) => {
    if (stopped || fr !== page.mainFrame()) return;
    // framenavigated also fires for same-document changes (history.replaceState ?v=1): re-arm only on a new path
    let p = null; try { p = new URL(fr.url()).pathname; } catch (e) {}
    if (p === path0) return;
    path0 = p;
    doc++;
    try { await cdp.send("Page.stopScreencast"); } catch (e) {}
    try { await cdp.detach(); } catch (e) {}
    try { await startOn(); } catch (e) {}
  };
  page.on("framenavigated", onNav);
  return {
    frames,
    async stop() {
      stopped = true;
      page.off("framenavigated", onNav);
      try { await cdp.send("Page.stopScreencast"); } catch (e) {}
      try { await cdp.detach(); } catch (e) {}
      frames.sort((a, b) => a.e - b.e);
      frames.forEach((f, i) => (f.i = i));
      return frames;
    },
  };
}

// ------------------------------------------------------------------ analysis
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

/** Decode a frame to raw RGB, cropped to a CSS-px region. */
async function rgbOf(f, region) {
  const buf = Buffer.from(f.data, "base64");
  const img = sharp(buf);
  const meta = await img.metadata();
  const s = f.dw ? meta.width / f.dw : 1;
  let ext = null;
  if (region) {
    const left = Math.max(0, Math.round(region.x * s)), top = Math.max(0, Math.round(region.y * s));
    const width = Math.max(1, Math.min(meta.width - left, Math.round(region.w * s)));
    const height = Math.max(1, Math.min(meta.height - top, Math.round(region.h * s)));
    ext = { left, top, width, height };
  }
  const pipe = ext ? sharp(buf).extract(ext) : sharp(buf);
  const { data, info } = await pipe.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, scale: s, W: meta.width, H: meta.height };
}

/**
 * @param {Array} frames from screencast().stop()
 * @param {{outDir:string, t0?:number, region?:{x:number,y:number,w:number,h:number}, bare?:{x:number,y:number,w:number,h:number}|Array,
 *          spikeK?:number, spikeFloor?:number, paperTol?:number, bareFrac?:number, write?:boolean, from?:number, to?:number}} o
 *   t0: epoch ms that frame times are expressed against (default: the first frame).
 *   from/to: keep only frames with t in [from, to] (ms relative to t0).
 */
export async function analyse(frames, o) {
  const k = o.spikeK ?? 4, floor = o.spikeFloor ?? 0.6, tol = o.paperTol ?? 10, bareFrac = o.bareFrac ?? 0.995;
  const t0 = o.t0 ?? (frames[0] ? frames[0].e : 0);
  const keep = frames.filter((f) => { const t = f.e - t0; return (o.from == null || t >= o.from) && (o.to == null || t <= o.to); });
  if (o.outDir) fs.mkdirSync(o.outDir, { recursive: true });
  const bares = o.bare ? (Array.isArray(o.bare) ? o.bare : [o.bare]) : [];
  const rows = [];
  let prevL = null;
  const deltas = [];
  for (const f of keep) {
    const t = +(f.e - t0).toFixed(1);
    const { data, w, h } = await rgbOf(f, o.region);
    let sum = 0;
    for (let p = 0; p < w * h; p++) sum += 0.2126 * data[p * 3] + 0.7152 * data[p * 3 + 1] + 0.0722 * data[p * 3 + 2];
    const lum = sum / (w * h);
    const d = prevL == null ? 0 : Math.abs(lum - prevL);
    const med = median(deltas);
    const spike = prevL != null && deltas.length >= 3 && d > k * med && d > floor;
    if (prevL != null) deltas.push(d);
    prevL = lum;
    const bare = [];
    for (const b of bares) {
      const r = await rgbOf(f, b);
      let paper = 0;
      for (let p = 0; p < r.w * r.h; p++) {
        const R = r.data[p * 3], G = r.data[p * 3 + 1], B = r.data[p * 3 + 2];
        if (PAPER.some((c) => Math.abs(R - c[0]) <= tol && Math.abs(G - c[1]) <= tol && Math.abs(B - c[2]) <= tol)) paper++;
      }
      const frac = paper / (r.w * r.h);
      bare.push({ frac: +frac.toFixed(4), bare: frac >= bareFrac });
    }
    const name = `${String(f.i).padStart(4, "0")}_${t < 0 ? "m" : "p"}${String(Math.round(Math.abs(t))).padStart(5, "0")}ms.jpg`;
    if (o.outDir && o.write !== false) fs.writeFileSync(path.join(o.outDir, name), Buffer.from(f.data, "base64"));
    rows.push({ i: f.i, t, doc: f.doc, lum: +lum.toFixed(2), d: +d.toFixed(2), med: +med.toFixed(2), spike, bare, file: name });
  }
  const res = {
    t0, n: rows.length, spikeK: k,
    spikes: rows.filter((r) => r.spike).map((r) => ({ i: r.i, t: r.t, d: r.d, med: r.med })),
    bareFrames: rows.filter((r) => r.bare.some((b) => b.bare)).map((r) => r.t),
    frameGapMax: rows.length > 1 ? Math.max(...rows.slice(1).map((r, i) => +(r.t - rows[i].t).toFixed(1))) : 0,
    rows,
  };
  if (o.outDir) fs.writeFileSync(path.join(o.outDir, "strip.json"), JSON.stringify(res, null, 1));
  return res;
}

/**
 * A labelled contact sheet (JPEG) of up to `max` frames spread over the strip, or of the frames whose
 * times are listed in `at` (ms relative to t0; the nearest frame is taken).
 */
export async function contact(frames, file, { t0, cols = 6, thumbW = 320, max = 24, at, title = "" } = {}) {
  if (!frames.length) return null;
  const T0 = t0 ?? frames[0].e;
  let pick;
  if (at && at.length) pick = at.map((t) => frames.reduce((b, f) => (Math.abs(f.e - T0 - t) < Math.abs(b.e - T0 - t) ? f : b), frames[0]));
  else { const step = Math.max(1, Math.ceil(frames.length / max)); pick = frames.filter((_, i) => i % step === 0).slice(0, max); }
  const m0 = await sharp(Buffer.from(pick[0].data, "base64")).metadata();
  const thumbH = Math.round((thumbW * m0.height) / m0.width), lab = 22, head = title ? 28 : 0;
  const rows = Math.ceil(pick.length / cols);
  const W = cols * thumbW, H = head + rows * (thumbH + lab);
  const comps = [];
  for (let i = 0; i < pick.length; i++) {
    const f = pick[i], x = (i % cols) * thumbW, y = head + Math.floor(i / cols) * (thumbH + lab);
    const buf = await sharp(Buffer.from(f.data, "base64")).resize(thumbW - 4, thumbH - 2, { fit: "fill" }).jpeg({ quality: 82 }).toBuffer();
    comps.push({ input: buf, left: x + 2, top: y + lab });
    const t = (f.e - T0).toFixed(0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${thumbW}" height="${lab}"><rect width="100%" height="100%" fill="#222"/><text x="6" y="16" font-family="Arial" font-size="13" fill="#fff">#${f.i}  t=${t} ms  doc${f.doc}</text></svg>`;
    comps.push({ input: Buffer.from(svg), left: x, top: y });
  }
  if (title) comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${head}"><rect width="100%" height="100%" fill="#000"/><text x="8" y="19" font-family="Arial" font-size="15" fill="#ff0">${title.replace(/[<&>]/g, "")}</text></svg>`), left: 0, top: 0 });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 3, background: "#444" } }).composite(comps).jpeg({ quality: 85 }).toFile(file);
  return file;
}

// ------------------------------------------------------------------ small helpers used by the P0 scripts
/** Parse a computed transform into { tx, ty, sx }. */
export const XF_SRC = `function(t){ if(!t||t==="none") return {tx:0,ty:0,sx:1,sy:1}; const m=t.match(/matrix(3d)?\\(([^)]+)\\)/); if(!m) return {tx:0,ty:0,sx:1,sy:1}; const v=m[2].split(",").map(Number); return m[1] ? {tx:v[12],ty:v[13],sx:v[0],sy:v[5]} : {tx:v[4],ty:v[5],sx:v[0],sy:v[3]}; }`;
/** Parse a computed clip-path inset() into px { t, r, b, l } of a box of size w×h; null when not an inset. */
export const INSET_SRC = `function(c,w,h){ if(!c||c==="none") return {t:0,r:0,b:0,l:0,none:true}; const m=c.match(/inset\\(([^)]+)\\)/); if(!m) return null; const p=m[1].replace(/round.*$/,"").trim().split(/\\s+/); const q=[p[0],p[1]??p[0],p[2]??p[0],p[3]??p[1]??p[0]]; const px=(s,d)=>s.endsWith("%")?parseFloat(s)/100*d:parseFloat(s); return {t:px(q[0],h),r:px(q[1],w),b:px(q[2],h),l:px(q[3],w)}; }`;

export function consoleVerdict(msgs) {
  const errors = msgs.filter((m) => ["error", "pageerror", "http", "requestfailed"].includes(m.type)).map((m) => m.text);
  const warnings = msgs.filter((m) => m.type === "warning").map((m) => m.text);
  return { errors, warnings, clean: errors.length === 0 };
}

/** Print one verdict line and return it. */
export function verdict(id, pass, msg, data) {
  const line = { id, verdict: pass === null ? "N/A" : pass ? "PASS" : "FAIL", msg, ...(data ? { data } : {}) };
  console.log(`[${line.verdict}] ${id} · ${msg}`);
  return line;
}

export function outDir(...p) { const d = path.join(SHOTS, ...p); fs.mkdirSync(d, { recursive: true }); return d; }

export function writeJSON(file, obj) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(obj, null, 1)); }

/** Scroll the home to the rail runway start (like inv4) and wait for the scrub to settle. */
export async function toRail(page, extra = 4) {
  await page.evaluate((extra) => {
    const w = document.querySelector("[data-railway]"), track = document.querySelector("[data-track]");
    // the runway trigger is the one whose animation moves the track (fx-scroll.js buildRail `move`)
    const s = window.ScrollTrigger && ScrollTrigger.getAll().find((s) => s.animation && s.animation.targets && s.animation.targets()[0] === track);
    const y = s ? s.start + extra : w.getBoundingClientRect().top + scrollY;
    window.FX && FX.scrollTo ? FX.scrollTo(y, { immediate: true }) : scrollTo(0, y);
  }, extra);
  await sleep(1400);
}

// ------------------------------------------------------------------ CLI
const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const a = process.argv.slice(2);
  const url = a[0] && !a[0].startsWith("--") ? a[0] : "index.html";
  const opt = (k, d) => { const i = a.indexOf("--" + k); return i < 0 ? d : a[i + 1]; };
  const has = (k) => a.includes("--" + k);
  const box = (s) => { if (!s) return undefined; const [x, y, w, h] = s.split(",").map(Number); return { x, y, w, h }; };
  const vp = opt("vp", "1440x900") === "390x844" ? VP.mobile : VP.desktop;
  const tag = opt("tag", "cli");
  const browser = await L.launch({ headless: false });
  try {
    const { page, context, consoleMsgs } = await open(browser, url, { ...vp, introSeen: has("seen") });
    await sleep(Number(opt("settle", 2500)));
    const rec = await screencast(page);
    const t0 = await pageNow(page);
    await sleep(150);
    if (opt("click")) await page.click(opt("click"));
    if (opt("wheel")) { let left = Number(opt("wheel")); while (left > 0) { const d = Math.min(120, left); await page.mouse.wheel(0, d); left -= d; await sleep(40); } }
    await sleep(Number(opt("ms", 3000)));
    const frames = await rec.stop();
    const dir = outDir(tag);
    const res = await analyse(frames, { outDir: dir, t0, region: box(opt("region")), bare: box(opt("bare")) });
    await contact(frames, path.join(dir, "contact.jpg"), { t0, title: `${tag} ${url}` });
    console.log(JSON.stringify({ dir, n: res.n, spikes: res.spikes, bareFrames: res.bareFrames.length, frameGapMax: res.frameGapMax, console: consoleVerdict(consoleMsgs) }, null, 1));
    await context.close();
  } finally { await browser.close(); }
}
