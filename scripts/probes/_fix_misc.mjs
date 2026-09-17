import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3000";
const b = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => sessionStorage.setItem("at-preloader-seen", "1"));
const p = await ctx.newPage();

// F12 — parts column on both schematic sub-forms
for (const slug of ["sphere-ai", "sersan-io", "spherenode"]) {
  await p.goto(`${base}/work/${slug}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const parts = await p.evaluate(() => {
    const ol = [...document.querySelectorAll("ol")].find((o) => o.querySelector("li span:nth-child(3)"));
    if (!ol) return null;
    return [...ol.querySelectorAll("li")].map((li) => {
      const sp = [...li.querySelectorAll("span")];
      return { part: sp[1]?.textContent.trim(), group: sp[2]?.textContent.trim() };
    });
  });
  const filled = parts.filter((x) => x.group && x.group !== "not in the catalogue").length;
  console.log(`F12 /work/${slug}: ${filled}/${parts.length} resolved,`, JSON.stringify(parts.filter((x) => !x.group || x.group === "not in the catalogue").map((x) => x.part)));
}

// F11 — longest line in the Estimate Items column
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const measure = await p.evaluate(() => {
  const worst = [];
  for (const el of document.querySelectorAll("p, li, dd, span, td, th")) {
    if (!el.children.length && el.textContent.trim().length > 40) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const ch = parseFloat(cs.fontSize) * 0.5;
      const perLine = r.width / ch;
      if (perLine > 78) worst.push({ chars: Math.round(perLine), w: Math.round(r.width), fs: cs.fontSize, t: el.textContent.trim().slice(0, 48) });
    }
  }
  return worst.sort((a, b) => b.chars - a.chars).slice(0, 5);
});
console.log("F11 widest measures:", JSON.stringify(measure, null, 1));
await b.close();
