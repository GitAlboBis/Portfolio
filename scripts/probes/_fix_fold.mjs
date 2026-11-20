import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3000";
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => sessionStorage.setItem("at-preloader-seen", "1"));
const p = await ctx.newPage();
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(8000);
console.log(JSON.stringify(await p.evaluate(() => {
  const box = (e) => { const b = e.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), bottom: Math.round(b.bottom + scrollY) }; };
  const sec = document.querySelector("#phase-intake");
  const tbl = sec.querySelector("table");
  const rows = [...tbl.querySelectorAll("tbody tr")].filter((r) => getComputedStyle(r).display !== "none")
    .map((r) => ({ t: r.textContent.trim().slice(0, 26), ...box(r) }));
  const rel = sec.querySelector(".bg-safety:last-of-type");
  const yellow = [...sec.querySelectorAll(".bg-safety")].map((e) => ({ t: e.textContent.trim().slice(0, 22), ...box(e) }));
  return { strip: box(document.querySelector("header[role=banner]") || document.body),
    header: box(document.querySelector("header.sheet")), band: box(document.querySelector("nav")),
    figure: box(document.querySelector("figure")), benchBox: box(document.querySelector(".bench-box")),
    caption: box(tbl.querySelector("caption")), rows, yellow, doc: document.documentElement.scrollHeight,
    measured: box(document.querySelector("#phase-test")) };
}, null), null, 1));
await b.close();
