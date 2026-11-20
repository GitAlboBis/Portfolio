/* ==========================================================================
   sound/render.mjs · the site's sound without a browser window (lane n-sound)

   The engine of fx-sound.js (RVSound.createEngine) takes its context as an argument; this script loads it alone into a
   headless Chrome page (window.__rvSoundEngineOnly), builds the same graph on an OfflineAudioContext, schedules a list
   of cues and writes the render as a 16-bit stereo WAV. Nothing is fetched: the page is about:blank.

     node public/proto/rivista/sound/render.mjs [cues.json] [out.wav] [--dur=30] [--rate=48000]

   cues.json: [{ "t": seconds, "event": name, "detail": {…} }, …], in time order. The events are the engine's cues:
     start {fade}  stop {ms}  page {key, glide}  scroll {v: px/s}  step {scene, step, of, pan: -1..1}  obla {k: 1..5}
     row {i: 0..3, on}  nav:start {ms, door, glass, dawn, back, hard, page}  nav:covered {dawn, back, hard}  nav:arrived
     nav:reset  tick  copy  menu {open}
   Page keys: home work about consult obla contact case 404. Without cues.json: the 30 s demo below.
   A cut as the site plays it (the contract in docs/redesign/rivista-story/build/n-fix-flight.md; Astro build, desktop):
   nav:start {ms: 1160, door: 416, glass: 520, page: key} at the click: the rush rises to `glass` (the eye in the
   door's glass), the door sounds there and the next page's chord opens with it, all scheduled by nav:start (the
   page cue at `door` then changes nothing); nav:arrived at 1.08 to 1.17 s. nav:covered after such a nav:start plays nothing more. On the
   assembled pages the document ends at the door: nav:start {…, hard: true}, then stop {ms: 50}; the page that arrives
   plays nav:covered {dawn} alone (the door). A scroll is a run of scroll cues, 30 a second, v in px/s.
   Not a page of the site: a tool (the integration lane uses it to lay the sound under a film).
   ========================================================================== */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "../../../../scripts/lib/headless.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, v) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split("=")[1] : v; };
const pos = argv.filter((x) => !x.startsWith("--"));
const DUR = +opt("dur", 30), RATE = +opt("rate", 48000);

/* the demo: the room on the cover, a scroll, two rows of the index, a cut to Work (rush, door, the room glides), three
   steps of the gallery with the scrolls between them, the menu's sheet, a cut to Contact, the copy control */
const scroll = (t0, t1, peak) => { const c = []; for (let t = t0; t <= t1; t += 1 / 30) { const k = (t - t0) / (t1 - t0); c.push({ t: +t.toFixed(3), event: "scroll", detail: { v: peak * Math.sin(Math.PI * k) } }); } return c; };
const DEMO = [
  { t: 0, event: "page", detail: { key: "home", glide: 0.01 } },
  { t: 0.05, event: "start", detail: { fade: 1.5 } },
  ...scroll(4.0, 5.2, 2400),
  { t: 6.0, event: "row", detail: { i: 0, on: true } },
  { t: 7.4, event: "row", detail: { i: 0, on: false } },
  { t: 7.6, event: "row", detail: { i: 2, on: true } },
  { t: 9.0, event: "tick" },
  { t: 9.0, event: "row", detail: { i: 2, on: false } },
  { t: 9.0, event: "nav:start", detail: { ms: 1160, door: 416, glass: 520, dawn: false, page: "work" } },
  { t: 9.42, event: "nav:covered", detail: { dawn: false } },
  { t: 9.42, event: "page", detail: { key: "work", glide: 1.4 } },
  { t: 10.1, event: "nav:arrived" },
  { t: 12.0, event: "step", detail: { scene: "gallery", step: 0, of: 10, pan: 1 } },
  ...scroll(13.2, 14.4, 1800),
  { t: 14.5, event: "step", detail: { scene: "gallery", step: 1, of: 10, pan: 1 } },
  ...scroll(15.8, 17.0, 1800),
  { t: 17.1, event: "step", detail: { scene: "gallery", step: 2, of: 10, pan: 1 } },
  { t: 19.5, event: "menu", detail: { open: true } },
  { t: 20.6, event: "menu", detail: { open: false } },
  { t: 22.0, event: "tick" },
  { t: 22.0, event: "nav:start", detail: { ms: 1160, door: 520, glass: 520, dawn: true, page: "contact" } },
  { t: 22.52, event: "nav:covered", detail: { dawn: true } },
  { t: 22.52, event: "page", detail: { key: "contact", glide: 1.4 } },
  { t: 23.1, event: "nav:arrived" },
  { t: 25.5, event: "copy" },
];

const cues = pos[0] ? JSON.parse(readFileSync(resolve(pos[0]), "utf8")) : DEMO;
const out = resolve(pos[1] || "demo.wav");
const src = readFileSync(join(HERE, "..", "fx-sound.js"), "utf8");

const browser = await launch();
try {
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.text()); });
  await page.setContent("<!doctype html><title>render</title>");
  await page.evaluate(() => { window.__rvSoundEngineOnly = true; });
  await page.addScriptTag({ content: src });
  const b64 = await page.evaluate(async ({ cues, DUR, RATE }) => {
    const ctx = new OfflineAudioContext(2, Math.round(DUR * RATE), RATE);
    const eng = window.RVSound.createEngine(ctx);
    for (const c of cues) eng.cue(c.event, c.detail || {}, c.t);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
    const dv = new DataView(new ArrayBuffer(44 + n * 4));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); dv.setUint32(4, 36 + n * 4, true); w(8, "WAVE"); w(12, "fmt "); dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, RATE, true); dv.setUint32(28, RATE * 4, true);
    dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, "data"); dv.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) {
      dv.setInt16(o, Math.max(-1, Math.min(1, L[i])) * 32767, true);
      dv.setInt16(o + 2, Math.max(-1, Math.min(1, R[i])) * 32767, true);
    }
    const u8 = new Uint8Array(dv.buffer); let s = "";
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }, { cues, DUR, RATE });
  writeFileSync(out, Buffer.from(b64, "base64"));
  console.log(`[render] ${cues.length} cues, ${DUR} s at ${RATE} Hz -> ${out}${errs.length ? "\n[render] page said: " + errs.join(" | ") : ""}`);
} finally {
  await browser.close();
}
