// Generate a 960px-wide mobile tier of the cinematic frame sequence from the
// committed 1920px WebP originals. Run: `bun scripts/gen-mobile-frames.mjs`
// (sharp is already a project dependency). Output: public/frames/m/f_###.webp
// Wire as a prebuild step later; for now run once and commit the tier.
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";

const SRC = "public/frames";
const OUT = join(SRC, "m");
const WIDTH = 960;
const QUALITY = 78;

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /^f_\d+\.webp$/.test(f)).sort();

let n = 0;
for (const f of files) {
  await sharp(join(SRC, f))
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(join(OUT, f));
  n++;
}
console.log(`generated ${n} mobile frames (${WIDTH}px, q${QUALITY}) in ${OUT}`);
