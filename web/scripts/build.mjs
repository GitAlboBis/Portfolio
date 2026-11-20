#!/usr/bin/env node
/* npm run build: astro build with Astro's anonymous telemetry off (this build sends nothing anywhere) */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const cli = fileURLToPath(new URL("../node_modules/astro/bin/astro.mjs", import.meta.url));
const r = spawnSync(process.execPath, [cli, "build", ...process.argv.slice(2)], { stdio: "inherit", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" }, cwd: fileURLToPath(new URL("..", import.meta.url)) });
process.exit(r.status ?? 1);
