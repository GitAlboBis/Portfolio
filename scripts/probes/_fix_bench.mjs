// F2 (settle) + F6 (readout swap verb) verification
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.env.BASE_URL || "http://localhost:3000";
const out = ".shots/wp10-fixed/bench";
await mkdir(out, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => sessionStorage.setItem("at-preloader-seen", "1"));
const p = await ctx.newPage();
const t0 = Date.now();
await p.goto(base + "/", { waitUntil: "commit" });
for (const ms of [1500, 3000, 5000, 7000]) {
  const wait = ms - (Date.now() - t0);
  if (wait > 0) await p.waitForTimeout(wait);
  const box = await p.$(".bench-box");
  await box.screenshot({ path: `${out}/settle-${ms}.png` });
  const st = await p.evaluate(() => {
    const s = window.__heroStore ? window.__heroStore.getState() : null;
    const stamp = [...document.querySelectorAll(".stamp")].map((e) => e.textContent.trim());
    const state = [...document.querySelectorAll("dl.bg-safety div")].map((e) => e.textContent.trim()).pop();
    return { status: s?.status, frameMs: s?.frameMs?.toFixed?.(1), particles: s?.particles, stamps: stamp, stateRow: state };
  });
  console.log(ms, "ms →", JSON.stringify(st));
}
// F6: sample the readout dd opacity + colour 120 times over 6s
const samples = await p.evaluate(async () => {
  const dds = [...document.querySelectorAll("dl.bg-safety dd")];
  const seen = [];
  for (let i = 0; i < 120; i++) {
    for (const d of dds) {
      const cs = getComputedStyle(d);
      seen.push({ o: Number(cs.opacity), c: cs.color, clip: cs.clipPath });
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  const minO = Math.min(...seen.map((s) => s.o));
  const colors = [...new Set(seen.map((s) => s.c))];
  const clipped = seen.filter((s) => s.clip && s.clip !== "none" && !/0%\)?$/.test(s.clip)).length;
  return { samples: seen.length, minOpacity: minO, colors, clipStates: [...new Set(seen.map((s) => s.clip))].slice(0, 6) };
});
console.log("F6 readout sampling:", JSON.stringify(samples, null, 1));
await b.close();
