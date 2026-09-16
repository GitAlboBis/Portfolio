# Captures — provenance

Ogni raster in questa cartella è una cattura di un sito pubblico realizzato da SerSan (Alberto Tuveri in team),
usata come miniatura nella tabella `work-performed` (REDESIGN-SPEC §E.8). La stessa origine è scritta
nell'EXIF IFD0 di ogni file (ImageDescription · Artist · Copyright · Software · DateTime), leggibile con
`node -e "require('sharp')('public/captures/<file>').metadata().then(m=>console.log(m.exif.toString('latin1')))"`.

- Data: 2026-09-16
- Strumento: Playwright chrome channel + --enable-unsafe-webgpu (152.0.7977.83), viewport 1600×1000 @ DPR 1, `waitUntil: "networkidle"` + settle, cookie banner declinati (mai accettati), scroll a 0 (composizione hero).
- Taglio 800×500: downscale (sharp, fit cover/top) della stessa cattura 1600×1000 — stessa composizione, per `srcset`.
- Encoder: sharp → WebP, qualità di partenza 82, effort 6, cap 200 KB per file (scala a gradini se sfora).
- Comando esatto: `node scripts/capture-sites.mjs` (da `C:\Users\alber\Portfolio`).
- Diritti: le catture mostrano siti di proprietà dei rispettivi titolari (campo EXIF `Copyright`); usate come prova del lavoro svolto.

| File | Sorgente | Titolo pagina | Viewport | Output | Qualità | Peso | Cookie |
|---|---|---|---|---|---|---|---|
| `sersan-io-1600.webp` | https://sersan.io | SerSan — Custom Software, Automation & AI Studio | 1600×1000 @1x | 1600×1000 WebP | q78 | 193.8 KB | no banner |
| `sersan-io-800.webp` | https://sersan.io | SerSan — Custom Software, Automation & AI Studio | 1600×1000 @1x | 800×500 WebP | q82 | 27.2 KB | no banner |
| `spherenode-1600.webp` | https://spherenode.com | Spherenode — Membership | 1600×1000 @1x | 1600×1000 WebP | q82 | 48.4 KB | declined via "Only necessary" |
| `spherenode-800.webp` | https://spherenode.com | Spherenode — Membership | 1600×1000 @1x | 800×500 WebP | q82 | 19.9 KB | declined via "Only necessary" |

EXIF `ImageDescription` per file:

- `sersan-io-1600.webp`: "Capture of https://sersan.io · Sep 2026 · Playwright Chrome 1600x1000 · portfolio of Alberto Tuveri"
- `sersan-io-800.webp`: "Capture of https://sersan.io · Sep 2026 · Playwright Chrome 1600x1000 · portfolio of Alberto Tuveri"
- `spherenode-1600.webp`: "Capture of https://spherenode.com · Sep 2026 · Playwright Chrome 1600x1000 · portfolio of Alberto Tuveri"
- `spherenode-800.webp`: "Capture of https://spherenode.com · Sep 2026 · Playwright Chrome 1600x1000 · portfolio of Alberto Tuveri"
