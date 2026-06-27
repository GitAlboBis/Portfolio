#!/usr/bin/env node
// Deterministic VISUAL gate for the docs-driven-build loop.
// Boots Playwright against a running app, asserts ZERO console errors on desktop +
// mobile viewports, and captures screenshots. Binary verdict, no AI.
//
// Usage:   node verify-visual.mjs [baseUrl]
//          BASE_URL env var also honored. Default http://localhost:3000
// Assumes: the app is already serving at baseUrl (loop runs `bun run start` or `bun dev`).
// Exit:    0 = clean (0 console errors both viewports) · 1 = console errors found
//          2 = setup error (Playwright browser missing / server unreachable)

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const baseUrl = process.argv[2] || process.env.BASE_URL || 'http://localhost:3000';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const outDir = resolve(repoRoot, 'loops/docs-driven-build/artifacts');

const viewports = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

// Benign noise to ignore (extend as the project's known-safe warnings are identified).
const IGNORE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
];

function isReal(text) {
  return !IGNORE.some((re) => re.test(text));
}

let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  console.error('SETUP: cannot launch chromium — run `bunx playwright install chromium`.');
  console.error(String(err?.message || err));
  process.exit(2);
}

await mkdir(outDir, { recursive: true });
const failures = [];

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    deviceScaleFactor: vp.isMobile ? 3 : 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && isReal(msg.text())) errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2500); // let WebGL/scroll settle
    await page.screenshot({
      path: resolve(outDir, `${vp.name}.png`),
      fullPage: false,
    });
  } catch (err) {
    console.error(`SETUP: navigation failed for ${vp.name} at ${baseUrl}`);
    console.error(String(err?.message || err));
    await browser.close();
    process.exit(2);
  }

  if (errors.length) {
    failures.push({ viewport: vp.name, errors });
    console.error(`FAIL [${vp.name}] ${errors.length} console error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
  } else {
    console.log(`PASS [${vp.name}] 0 console errors — screenshot saved`);
  }
  await ctx.close();
}

await browser.close();

if (failures.length) {
  console.error(`FAIL: console errors on ${failures.map((f) => f.viewport).join(', ')}`);
  process.exit(1);
}
console.log(`PASS: 0 console errors on all viewports. Screenshots in ${outDir}`);
process.exit(0);
