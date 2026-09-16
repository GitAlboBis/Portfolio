# Bench still — provenance

Lo still di fallback del banco prova (REDESIGN-SPEC §E.5, §F.6): **un frame catturato dal motore
reale** — MLS-MPM su WebGPU, shading WP-3b (rampa di profondità, mano bagnata, bordo traslucido,
schiuma panna, cubemap officina) — non un rendering d'artista. Viene stampato dentro lo stesso
riquadro quando il renderer non c'è (no WebGPU / reduced motion / `device.lost`), con la parola
`STILL` e la riga di motivo sopra. La stessa origine è scritta nell'EXIF IFD0 di ogni file
(ImageDescription · Artist · Software · DateTime), leggibile con
`node -e "require('sharp')('public/bench/<file>').metadata().then(m=>console.log(m.exif.toString('latin1')))"`.

- Data: 2026-09-16
- Sorgente: `http://localhost:3000/dev/bench` (dev server locale) — il banco vivo, stato `live`.
- Strumento: Playwright chrome channel + --enable-unsafe-webgpu (152.0.7977.83) + sharp.
- Viewport: 1440×1200 CSS px @ deviceScaleFactor 2.05 (il ritaglio esce a 1554px e viene RIDOTTO a 1520 — mai ingrandito).
- Ritaglio: elemento `.bench-box` MENO il bordo 1px → 758×538 CSS px. La cornice non è nel raster: lo still si stampa dentro la cornice viva (`absolute inset-0`), quindi stamparla sarebbe una doppia riga.
- Sedimentazione: 8000 ms di calma dopo lo stato `live`, nessun poke del puntatore, nessuno scroll — la lettera a riposo.
- Letture dello strumento nell'istante dello scatto: Particles 74,403 · Frame 16.7 ms · DPR 1.5 (backing della canvas, cap del tier) · Tier desktop.
- Encoder: sharp → WebP, qualità di partenza 82, effort 6, cap 200 KB per file (scala a gradini se sfora).
- Comando esatto: `node scripts/capture-bench.mjs` (da `C:\Users\alber\Portfolio`, con `npm run dev` attivo).

| File | Sorgente | Stato motore | Viewport | Output | Qualità | Peso |
|---|---|---|---|---|---|---|
| `tank-still-1520.webp` | /dev/bench | live | 1440×1200 @2.05x | 1520×1079 WebP | q82 | 30.1 KB |
| `tank-still-700.webp` | /dev/bench | live | 1440×1200 @2.05x | 700×497 WebP | q82 | 8.6 KB |

EXIF `ImageDescription` per file:

- `tank-still-1520.webp`: "Captured frame of the WebGPU fluid test bench · Sep 2026 · Chrome WebGPU · MLS-MPM · portfolio of Alberto Tuveri"
- `tank-still-700.webp`: "Captured frame of the WebGPU fluid test bench · Sep 2026 · Chrome WebGPU · MLS-MPM · portfolio of Alberto Tuveri"
