// Chi inietta <link rel=preload href=/coast/night-sea.webp> su /work?
// Patcha insertBefore/appendChild PRIMA di ogni script della pagina e cattura lo stack.
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  sessionStorage.setItem("at-preloader-seen", "1");
  Object.defineProperty(navigator, "gpu", { get: () => undefined });
  window.__injections = [];
  const spy = (orig, name) =>
    function (...args) {
      try {
        const n = args[0];
        if (n && n.tagName === "LINK" && /night-sea/.test(n.href || "")) {
          window.__injections.push({ via: name, rel: n.rel, as: n.as, stack: new Error().stack });
        }
      } catch {}
      return orig.apply(this, args);
    };
  Node.prototype.insertBefore = spy(Node.prototype.insertBefore, "insertBefore");
  Node.prototype.appendChild = spy(Node.prototype.appendChild, "appendChild");
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/work", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(4000);
const inj = await page.evaluate(() => window.__injections);
console.log(JSON.stringify(inj, null, 2).slice(0, 4000) || "none captured");
await browser.close();
