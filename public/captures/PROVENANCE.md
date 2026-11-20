# Captures — provenance

Ogni raster in questa cartella è materiale reale del lavoro di Alberto Tuveri, mai generato, e ogni file dice da dove
viene. È di sei tipi: catture di siti pubblici (sersan.io, spherenode.com, settembre 2026); fotogrammi della scena WebGPU
di sersan.io catturati in Chrome headless su un adattatore hardware (`sersan-io-wordmark`, `-blackhole`, `-portrait`,
ottobre 2026); la cattura di una preview cliente non ancora lanciata (Domus Tua, mai linkata); una cattura fatta in una
sessione staff SerSan autenticata, ritagliata, con il nome di un docente e i titoli dei contenuti a pagamento coperti da
barre piatte (Sphere AI); due fotogrammi del master 4K del brand film SerSan; il ridisegno del class diagram del team
(Supply Chain, dal modello Visual Paradigm). Dal 2026-10-11 (decisioni del direttore, su delega di Alberto) le due
sospensioni del fix S2 sono chiuse: la tavola di Domus Tua è una vista della sezione del metodo della preview, senza
persone, nomi propri o marchi di terzi (la cattura dell'hero del 2026-10-09, con il volto e il nome della fondatrice e
il marchio WhatsApp, è stata sostituita dallo stesso script e non è più nell'albero servito; il suo `fig.hold` in
`cases.json` è tolto); il ritratto a particelle di Alberto (`sersan-io-portrait`, una scena del suo stesso lavoro su
sersan.io) è una figura del caso sersan.io, con una didascalia che dice che le righe di telemetria sullo sfondo sono
decorazione. Il `sersan-io-blackhole-sq` (quadrato, per la figura Now della home) è lo stesso fotogramma grezzo
del `sersan-io-blackhole`, tagliato 1:1. La stessa
origine è scritta nell'EXIF IFD0 di ogni file (ImageDescription · Artist · Copyright · Software · DateTime), leggibile con
`node -e "require('sharp')('public/captures/<file>').metadata().then(m=>console.log(m.exif.toString('latin1')))"`.

- Data: 2026-09-16
- Strumento: Playwright chrome channel + --enable-unsafe-webgpu (152.0.7977.83), viewport 1600×1000 @ DPR 1, `waitUntil: "networkidle"` + settle, cookie banner declinati (mai accettati), scroll a 0 (composizione hero).
- Taglio 800×500: downscale (sharp, fit cover/top) della stessa cattura 1600×1000 — stessa composizione, per `srcset`.
- Encoder: sharp → WebP, qualità di partenza 82, effort 6, cap 200 KB per file (scala a gradini se sfora).
- Comando esatto: `node scripts/capture-sites.mjs` (dalla radice del repository).
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

<!-- media:_round-2026-10-09 -->
## Aggiunte del 2026-10-09 (lane media, `docs/redesign/rivista-next/11-media-scout.md`)

Le righe sopra (catture di settembre) restano com'erano. Da qui la cartella contiene anche media reali che non sono catture di un sito: un ritaglio di una cattura di prodotto già esistente (Sphere AI), due fotogrammi del master del brand film SerSan e il ridisegno di un diagramma UML del team universitario. Ogni file ha qui il suo blocco `<!-- media:<slug> -->`, scritto dallo script che lo produce: rieseguire uno script sostituisce solo il proprio blocco, mai le righe di settembre.

- Formato comune: `<slug>-1600.webp` (1600×1000) e `<slug>-800.webp` (800×500, downscale dello stesso fotogramma 16:10), EXIF IFD0 (ImageDescription · Artist · Copyright · Software · DateTime; testo ASCII, quindi `·` diventa `-`), sidecar `<file>.webp.json` scritto da `impeccable embed-prompt`.
- Peso: il 1600 resta sotto 160.000 byte (il passaggio S4 lo consegna come data URL solo sotto quella soglia, `20-cases-spec.md` R2); l'800 sotto 200 KB. La qualità parte più alta di 82 dove 82 lasciava blocchi visibili (gradienti scuri del film, testo piccolo di interfaccia), sempre sotto il tetto.
- Script: `scripts/media/plates.mjs` (encoder comune), `scripts/media/stills.mjs` (sphere-ai, sersan-brand, sersan-brand-end), `scripts/capture-sites.mjs` (domus-tua; ora vuole il nome del sito e appende qui invece di riscrivere), `scripts/media/vpp-plate.mjs` (agricultural-supply-chain e il suo dettaglio).
- Non prodotti: `badante24h` (l'hero stampa lo stato vuoto «Stiamo aggiornando i profili in questa zona» e la pagina registra l'errore React #418 al caricamento), `maintech-oma` e `doit-voice-ai-agent` (nessun media reale: restano le tavole tipografiche).
<!-- /media:_round-2026-10-09 -->

<!-- media:sphere-ai -->
### `sphere-ai-*` — aggiunto 2026-10-09 (lane media, `node scripts/media/stills.mjs sphere-ai`)

Sorgente (S2, 2026-10-09): `public/screens-pass1/mentor-chat-en.png` del repo `spherenode-promo` di SerSan (3840×2160, prima passata di `scripts/capture.mjs` del 2026-09-03, 09:57 UTC, sessione staff SerSan autenticata): il mentor risponde dalle trascrizioni con citazioni numerate ed elenca le fonti (la passata delle 10:12, usata a settembre, apriva con «I didn't find specific Spherenode material» e contraddiceva il caso). Taglio 16:10 dell'intera conversazione (fix S2, recensioni desktop S7 e telefono 7) `extract({ left: 690, top: 170, width: 3150, height: 1969 })`: il bordo sinistro cade nella gola dopo il divisore della barra laterale (x 686), il destro oltre la scheda della risposta (nessuna riga tagliata), dall'header fino al campo di domanda. **Redazioni**: sette barre piatte RGB(48,52,48) coprono il nome di un docente nel testo e i titoli di lezioni e sessioni live citate e suggerite (contenuto a pagamento); nient'altro è toccato. Nessun dato d'account nel fotogramma.

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `sphere-ai-1600.webp` | 1600×1000 WebP | q90 | 122.8 KB (125736 B) | 686 B IFD0 |
| `sphere-ai-800.webp` | 800×500 WebP | q90 | 42.9 KB (43898 B) | 686 B IFD0 |

EXIF `ImageDescription` (ASCII): "Capture of spherenode.com/mentor (signed-in SerSan staff session) - 3 Sep 2026 - Playwright Chromium 1920x1080 @2x - cropped 16:10 to the whole conversation - an instructor's name and the course and session titles redacted - portfolio of Alberto Tuveri"
<!-- /media:sphere-ai -->

<!-- media:sersan-brand -->
### `sersan-brand-*` — aggiunto 2026-10-09 (lane media, `node scripts/media/stills.mjs sersan-brand`)

Sorgente: `renders/tiff8_v2/00900.tif` della cartella di progetto After Effects del film (`SERSAN-AE`) (TIFF 8 bit RGBA 3840×2160, aerender 2026-09-08, taglio da 54,121 s / 1622 fotogrammi; fotogramma 900 = 00:30.03). S2 (2026-10-09, lane casi, difetto 5 del verificatore): taglio 16:10 centrato sulla scheda di vetro centrale `extract({ left: 496, top: 60, width: 2848, height: 1780 })`, alfa appiattito: il titolo del film «Selected work» (righe 1858–1966, misurate) resta fuori, perché l'over-scale della parallasse dell'hero del caso lo tagliava al piede del riquadro in quasi ogni posa. Il taglio di settembre-ottobre era centrato a piena altezza (`left: 192, top: 0, 3456×2160`). Mai i fotogrammi 1080–1260 (loghi di terzi).

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `sersan-brand-1600.webp` | 1600×1000 WebP | q92 | 95.5 KB (97798 B) | 590 B IFD0 |
| `sersan-brand-800.webp` | 800×500 WebP | q92 | 28.9 KB (29616 B) | 590 B IFD0 |

Punto focale (`object-position`): `50% 50%` — la x vale per il taglio 4:5 del caso sotto 1024 px, la y per un taglio 16:9 a copertura.

EXIF `ImageDescription` (ASCII): "Frame 900 (00:30.03) of the SerSan brand film - 4K lossless master frame (aerender TIFF, 8 Sep 2026) - cropped 16:10 to the centre card - directed and produced by Alberto Tuveri - portfolio of Alberto Tuveri"
<!-- /media:sersan-brand -->

<!-- media:sersan-brand-end -->
### `sersan-brand-end-*` — aggiunto 2026-10-09 (lane media, `node scripts/media/stills.mjs sersan-brand-end`)

Sorgente: `renders/tiff8_v2/01560.tif` della stessa cartella (fotogramma 1560 = 00:52.05, cartello d'identità finale). Stesso taglio 16:10 centrato del fotogramma 900.

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `sersan-brand-end-1600.webp` | 1600×1000 WebP | q92 | 46.5 KB (47596 B) | 592 B IFD0 |
| `sersan-brand-end-800.webp` | 800×500 WebP | q92 | 18.8 KB (19214 B) | 592 B IFD0 |

Punto focale (`object-position`): `50% 75%` — la x vale per il taglio 4:5 del caso sotto 1024 px, la y per un taglio 16:9 a copertura.

EXIF `ImageDescription` (ASCII): "Frame 1560 (00:52.05) of the SerSan brand film, identity end card - 4K lossless master frame (aerender TIFF, 8 Sep 2026) - cropped 16:10 - directed and produced by Alberto Tuveri - portfolio of Alberto Tuveri"
<!-- /media:sersan-brand-end -->

<!-- media:domus-tua -->
### `domus-tua-*` — catturato 2026-10-11 (`node scripts/capture-sites.mjs domus-tua`)

Sorgente: https://domus-tua-ten.vercel.app/metodo (client preview, before the domustua.com launch) · titolo pagina "Il Metodo Domus Tua · Domus Tua Immobiliare" · Playwright Chrome 155.0.8059.39 headless, viewport 1600×1000 @2x, locale `it-IT`, `prefers-reduced-motion: reduce` (la versione statica del sito), `networkidle` + 10000 ms · cookie: declined via "Solo necessari" · navigazione: ok · errori di pagina: 0. Vista: pagina scorsa fino al titolo «prima stima alla firma» (scrollY 1964). Taglio 16:10 in pixel sorgente `extract({"left":92,"top":200,"width":2688,"height":1680})`, nessun ritocco: the method section, below the site header and beside the floating contact buttons: no person, no personal name and no third-party mark in the frame. Il taglio 800×500 è un downscale della stessa cattura.

Sostituisce la cattura del 2026-10-09 (l'hero della home: il volto e il nome della fondatrice, il marchio WhatsApp nell'header), che non è più nell'albero servito. Decisione del direttore, 2026-10-11.

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `domus-tua-1600.webp` | 1600×1000 WebP | q90 | 59.3 KB (60772 B) | 788 B IFD0 |
| `domus-tua-800.webp` | 800×500 WebP | q90 | 23.3 KB (23884 B) | 788 B IFD0 |

Nessun punto focale: il caso mostra il fotogramma intero (`fig.contain` in `cases.json`), come quello di Sphere AI.

EXIF `ImageDescription` (ASCII): "Capture of https://domus-tua-ten.vercel.app/metodo (client preview, before the domustua.com launch) - Oct 2026 - Playwright Chrome 1600x1000 @2x - reduced motion - cookies declined ("Solo necessari") - the method section, below the site header and beside the floating contact buttons: no person, no personal name and no third-party mark in the frame - cropped 16:10 - portfolio of Alberto Tuveri"
<!-- /media:domus-tua -->

<!-- media:agricultural-supply-chain -->
### `agricultural-supply-chain.svg` e `agricultural-supply-chain-*` — disegnati 2026-11-10 (`node scripts/media/vpp-plate.mjs`)

Ridisegno fedele del class diagram "Project class diagram 4" del modello Visual Paradigm del team (`IDS_project(3).vpp`; repo pubblico github.com/daveeCity/IDS_GROUP_PROJECT; team di tre, Università di Camerino). Il `.vpp` è un file SQLite: copiato in una cartella temporanea e aperto in sola lettura; da `DIAGRAM_ELEMENT` si leggono posizione e misura di 4 package e 56 classi e il percorso di 69 relazioni, da `MODEL_ELEMENT` i membri, gli stereotipi e le estremità delle associazioni. Tutto è disegnato alle coordinate del modello, in scala uniforme 0.20205, dentro la fascia centrale 4:3 (le lastre di vetro di Work tagliano a 4:3) e 16:9 (la figura in testa al caso). Solo tipografia e colori sono del sito, lo studio notturno della spec 50 (ridisegnato il 2026-11-10: prima era su carta crema con Figtree e Cormorant, l'unica immagine crema rimasta): fondo `--night-2`, ogni package un campo `--night` in un filetto `--line`, classi in `--night-2` con filetto `--mute`, nomi in Sofia Sans (`--ink`), membri in `--body`, linee ed etichette in `--mute` (Sofia Sans Condensed), titoli dei package in Sofia Sans Extra Condensed; un solo accento `--accent`: le tre associazioni dettagliare, eseguire, specificare (Prodotto → TracciabilitaProdotto → PassoFiliera → Azienda). Ultima modifica del diagramma nel modello: 2025-12-03. Render: Chrome 157.0.8103.39 headless a DPR 2, poi sharp. Il vettoriale è `agricultural-supply-chain.svg` (i font vengono dalla pagina che lo ospita: `css/fonts.css`).

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `agricultural-supply-chain-1600.webp` | 1600×1000 WebP | lossless | 118.0 KB (120812 B) | 690 B IFD0 |
| `agricultural-supply-chain-800.webp` | 800×500 WebP | lossless | 50.9 KB (52076 B) | 690 B IFD0 |

Punto focale (`object-position`): `50% 50%` — la x vale per il taglio 4:5 del caso sotto 1024 px, la y per un taglio 16:9 a copertura.

EXIF `ImageDescription` (ASCII): "Redrawn from the team's Visual Paradigm model IDS_project.vpp, diagram "Project class diagram 4" (github.com/daveeCity/IDS_GROUP_PROJECT) - shapes and names as modelled - team of 3, University of Camerino - portfolio of Alberto Tuveri"
<!-- /media:agricultural-supply-chain -->

<!-- media:agricultural-supply-chain-detail -->
### `agricultural-supply-chain-detail.svg` e `agricultural-supply-chain-detail-*` — disegnati 2026-11-10 (`node scripts/media/vpp-plate.mjs`)

Dettaglio del package `model` dallo stesso ridisegno (finestra in unità del modello: x 3305, y 3290, 1751×1070; scala 0.76636): le forme e le linee che escono dalla finestra sono tagliate dal suo bordo. Stessa sorgente, stesso metodo del blocco `agricultural-supply-chain`.

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `agricultural-supply-chain-detail-1600.webp` | 1600×1000 WebP | lossless | 53.0 KB (54272 B) | 718 B IFD0 |
| `agricultural-supply-chain-detail-800.webp` | 800×500 WebP | lossless | 27.0 KB (27666 B) | 718 B IFD0 |

Punto focale (`object-position`): `50% 50%` — la x vale per il taglio 4:5 del caso sotto 1024 px, la y per un taglio 16:9 a copertura.

EXIF `ImageDescription` (ASCII): "Detail of the model package, redrawn from the team's Visual Paradigm model IDS_project.vpp, diagram "Project class diagram 4" (github.com/daveeCity/IDS_GROUP_PROJECT) - shapes and names as modelled - team of 3, University of Camerino - portfolio of Alberto Tuveri"
<!-- /media:agricultural-supply-chain-detail -->

<!-- media:sersan-io-wordmark -->
### `sersan-io-wordmark-*` — catturato 2026-10-09 (`node scripts/media/sersan-scenes.mjs capture` poi `encode`)

Sorgente: https://sersan.io/ · the wordmark intro, its particles mid-assembly (HeroTextParticles) · fotogramma grezzo `.shots/captures/sersan-scenes/wordmark-005793ms.png` (5793 ms dalla navigazione, scrollY 0) · Playwright Chrome 155.0.8059.39 headless, `--enable-unsafe-webgpu`, adattatore hardware amd rdna-3 (fallback rifiutato), viewport 1600×1000 @ DPR 2 · cookie: no banner. Taglio 16:10 in pixel sorgente `extract({"left":300,"top":140,"width":2176,"height":1360})`, nessun ritocco. Scena e sito di Alberto Tuveri per SerSan.

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `sersan-io-wordmark-1600.webp` | 1600×1000 WebP | q74 | 142.4 KB (145832 B) | 674 B IFD0 |
| `sersan-io-wordmark-800.webp` | 800×500 WebP | q86 | 56.9 KB (58294 B) | 674 B IFD0 |

EXIF `ImageDescription` (ASCII): "Capture of https://sersan.io (the wordmark intro, its particles mid-assembly (HeroTextParticles)) - 2026-10-09 - WebGPU on a hardware adapter, headless Chrome 155.0.8059.39 1600x1000 @2x - cropped 16:10 - Alberto Tuveri's own WebGPU work - portfolio of Alberto Tuveri"
<!-- /media:sersan-io-wordmark -->

<!-- media:sersan-io-blackhole -->
### `sersan-io-blackhole-*` — catturato 2026-10-09 (`node scripts/media/sersan-scenes.mjs capture` poi `encode`)

Sorgente: https://sersan.io/ · the raymarched black hole under the wordmark, the home hero at rest after the intro (HomeSingularity) · fotogramma grezzo `.shots/captures/sersan-scenes/rest-024252ms.png` (24252 ms dalla navigazione, scrollY 0) · Playwright Chrome 155.0.8059.39 headless, `--enable-unsafe-webgpu`, adattatore hardware amd rdna-3 (fallback rifiutato), viewport 1600×1000 @ DPR 2 · cookie: no banner. Taglio 16:10 in pixel sorgente `extract({"left":640,"top":800,"width":1920,"height":1200})`, nessun ritocco. Scena e sito di Alberto Tuveri per SerSan.

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `sersan-io-blackhole-1600.webp` | 1600×1000 WebP | q82 | 147.6 KB (151184 B) | 710 B IFD0 |
| `sersan-io-blackhole-800.webp` | 800×500 WebP | q86 | 25.2 KB (25768 B) | 710 B IFD0 |

EXIF `ImageDescription` (ASCII): "Capture of https://sersan.io (the raymarched black hole under the wordmark, the home hero at rest after the intro (HomeSingularity)) - 2026-10-09 - WebGPU on a hardware adapter, headless Chrome 155.0.8059.39 1600x1000 @2x - cropped 16:10 - Alberto Tuveri's own WebGPU work - portfolio of Alberto Tuveri"
<!-- /media:sersan-io-blackhole -->

<!-- media:sersan-io-portrait -->
### `sersan-io-portrait-*` — catturato 2026-10-09 (`node scripts/media/sersan-scenes.mjs capture` poi `encode`)

Sorgente: https://sersan.io/ · Alberto Tuveri's own particle portrait in the founders section, with its orbit of skill labels (FounderPortraitMorph) · fotogramma grezzo `.shots/captures/sersan-scenes/founders-011216ms.png` (11216 ms dalla navigazione, scrollY 21923) · Playwright Chrome 155.0.8059.39 headless, `--enable-unsafe-webgpu`, adattatore hardware amd rdna-3 (fallback rifiutato), viewport 1600×1000 @ DPR 2 · cookie: no banner. Taglio 16:10 in pixel sorgente `extract({"left":0,"top":350,"width":2030,"height":1269})`, nessun ritocco. Scena e sito di Alberto Tuveri per SerSan.

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `sersan-io-portrait-1600.webp` | 1600×1000 WebP | q74 | 154.2 KB (157906 B) | 726 B IFD0 |
| `sersan-io-portrait-800.webp` | 800×500 WebP | q84 | 55.2 KB (56518 B) | 726 B IFD0 |

EXIF `ImageDescription` (ASCII): "Capture of https://sersan.io (Alberto Tuveri's own particle portrait in the founders section, with its orbit of skill labels (FounderPortraitMorph)) - 2026-10-09 - WebGPU on a hardware adapter, headless Chrome 155.0.8059.39 1600x1000 @2x - cropped 16:10 - Alberto Tuveri's own WebGPU work - portfolio of Alberto Tuveri"
<!-- /media:sersan-io-portrait -->

<!-- media:sersan-io-blackhole-sq -->
### `sersan-io-blackhole-sq-*` — catturato 2026-10-09 (`node scripts/media/sersan-scenes.mjs capture` poi `encode`)

Sorgente: https://sersan.io/ · the SerSan mark, the wordmark and the raymarched black hole under them, the home hero at rest after the intro (HomeSingularity) · fotogramma grezzo `.shots/captures/sersan-scenes/rest-024252ms.png` (24252 ms dalla navigazione, scrollY 0) · Playwright Chrome 155.0.8059.39 headless, `--enable-unsafe-webgpu`, adattatore hardware amd rdna-3 (fallback rifiutato), viewport 1600×1000 @ DPR 2 · cookie: no banner. Taglio 1:1 in pixel sorgente `extract({"left":720,"top":40,"width":1920,"height":1920})`, nessun ritocco. Scena e sito di Alberto Tuveri per SerSan.

| File | Output | Qualità | Peso | EXIF |
|---|---|---|---|---|
| `sersan-io-blackhole-sq-1600.webp` | 1600×1600 WebP | q82 | 224.1 KB (229438 B) | 734 B IFD0 |
| `sersan-io-blackhole-sq-800.webp` | 800×800 WebP | q86 | 36.1 KB (36956 B) | 734 B IFD0 |

EXIF `ImageDescription` (ASCII): "Capture of https://sersan.io (the SerSan mark, the wordmark and the raymarched black hole under them, the home hero at rest after the intro (HomeSingularity)) - 2026-10-09 - WebGPU on a hardware adapter, headless Chrome 155.0.8059.39 1600x1000 @2x - cropped 1:1 - Alberto Tuveri's own WebGPU work - portfolio of Alberto Tuveri"
<!-- /media:sersan-io-blackhole-sq -->
