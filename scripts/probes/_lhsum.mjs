import { readFileSync } from "node:fs";
for (const f of process.argv.slice(2)) {
  const r = JSON.parse(readFileSync(f, "utf8"));
  const c = r.categories, a = r.audits;
  const n = (k) => a[k]?.numericValue;
  console.log(
    f.replace(/.*[\/]/, "").padEnd(26),
    "form=" + (r.configSettings.formFactor ?? "?").padEnd(7),
    "P " + Math.round(c.performance.score * 100),
    "A " + Math.round(c.accessibility.score * 100),
    "BP " + Math.round(c["best-practices"].score * 100),
    "SEO " + Math.round(c.seo.score * 100),
    "| LCP " + Math.round(n("largest-contentful-paint")) + "ms",
    "TBT " + Math.round(n("total-blocking-time")) + "ms",
    "CLS " + (n("cumulative-layout-shift") ?? 0).toFixed(3),
    "FCP " + Math.round(n("first-contentful-paint")) + "ms",
    "SI " + Math.round(n("speed-index")) + "ms",
  );
  const fails = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && ["performance","accessibility","best-practices","seo"].some(cat => (r.categories[cat].auditRefs||[]).some(ref=>ref.id===x.id && ref.weight>0)));
  for (const x of fails.slice(0, 10)) console.log("    ! " + x.id + " (" + (x.score*100).toFixed(0) + ") " + (x.displayValue ?? ""));
}
