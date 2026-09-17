// Focus-state evidence for WP-10: skip link, locale toggle (both states), band cell.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const out = resolve(process.cwd(), ".shots", "wp10", "focus");
await mkdir(out, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { sessionStorage.setItem("at-preloader-seen","1") } catch {} });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(1800);
const names = ["skiplink", "locale-en-active", "locale-it", "band-intake", "band-diagnosis", "band-estimate", "band-work", "band-test", "band-release", "band-email"];
for (let i = 0; i < names.length; i++) {
  await p.keyboard.press("Tab");
  await p.waitForTimeout(200);
  const info = await p.evaluate(() => {
    const a = document.activeElement, cs = getComputedStyle(a), r = a.getBoundingClientRect();
    // the pixel actually behind the ring: sample just outside the box
    const probe = document.elementFromPoint(Math.max(2, r.left - 4), r.top + r.height / 2);
    const behind = probe ? getComputedStyle(probe).backgroundColor : "?";
    return { text: a.textContent.trim().slice(0, 28), color: cs.color, outline: cs.outline, shadow: cs.boxShadow, behind };
  });
  console.log(names[i].padEnd(18), JSON.stringify(info));
  await p.screenshot({ path: resolve(out, `${String(i).padStart(2,"0")}-${names[i]}.png`), clip: { x: 0, y: 0, width: 1440, height: 260 } });
}
await b.close();
