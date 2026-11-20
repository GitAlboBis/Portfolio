import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://127.0.0.1:5178/proto/rivista/index.html", { waitUntil: "load" });
const info = await page.evaluate(async () => {
  if (!navigator.gpu) return { gpu: false };
  const a = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!a) return { gpu: true, adapter: false };
  const inf = a.info || {};
  return { gpu: true, adapter: true, vendor: inf.vendor, arch: inf.architecture, desc: inf.description, features: [...a.features].join(","), maxBuf: a.limits.maxStorageBufferBindingSize, f32filter: a.features.has("float32-filterable"), ts: a.features.has("timestamp-query") };
});
console.log(JSON.stringify(info, null, 1));
await page.waitForTimeout(3500);
await page.screenshot({ path: process.argv[2] });
await browser.close();
