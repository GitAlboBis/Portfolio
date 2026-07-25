# IL BEAT DRONE — round ③ (2026-07-25)

> Design approvato da Alberto (scope: tutte le opzioni + carte blanche sui dettagli).
> Fonte footage: folder Drive "ALBE DRONE" (12 clip DJI Air 3S, D-Log M), masters scaricati su questo PC in `C:\Users\alber\Videos\ALBE-DRONE\`. LUT obbligatoria `_air3s.cube` (root, untracked). Clip 0040 già usato (LA ROCCIA).

## Inventario clip (contact-sheet gradate, sessione 2026-07-25)

| Clip | Durata | Contenuto | Uso |
|---|---|---|---|
| 0032 | 40s | orbita avvicinamento torre Porto Flavia | riserva |
| 0033 | 53s | orbita STRETTA facciata PORTO FLAVIA, poi pull-back su costa | **A: portale→About** |
| 0034 | 31s | avvicinamento frontale Pan di Zucchero | riserva |
| 0036 | 25s | falesie dall'alto + panorama | riserva |
| 0038 | 49s | volo lungo la costa, promontorio verde | riserva |
| 0041 | 51s | Pan di Zucchero lontano, meditativo | riserva |
| 0342 | 31.5s | **sorvolo della SOMMITÀ di Pan di Zucchero che valica il bordo e precipita sul mare aperto** | **B: /work outro** (+ A: portale→Works) |
| 0343 | 53s | mare aperto → cresta del monolite dall'alto, barchetta alla base | riserva |
| 0345 | 14.5s | pelo d'acqua: inseguimento barca con scia verso le falesie | riserva |
| 0346 | 14.2s | **pelo d'acqua CONTROLUCE verso il monolite scuro, glitter del sole** | **A: portale→Home** |
| 0353 | 76s | **l'ARCO NATURALE col sole che ci passa attraverso**, falesie, glitter | **C: /about — L'ARCO** |

## A · PORTALE VIVO (menu-portale: still → micro-loop)

- Le `PREVIEWS` di `MenuOverlay.tsx` guadagnano `videoSrc` opzionale: `home`(0346), `about`(0033), `works`(0342). **`contact` resta still di proposito** — le rotte vive si muovono, la notte aspetta (intenzionalità > completezza).
- Loop **palindromi** (ricetta AscentSurface: forward+reverse, zero stacco) ~2.2s×2, encode ~720w CRF≥28, muted/`playsinline`/`loop`, **no audio track**. Target ≤500KB l'uno.
- `poster` = still attuali → paint identico a oggi; il video si sovrappone quando pronto (`canplay`).
- **Play SOLO del preview attivo** (pause degli altri: decoder/batteria); pause totale a menu chiuso.
- Mount: dentro il gate `warm` esistente (solo desktop ≥64rem, solo dopo prima apertura). Reduced-motion: SOLO still (nessun `<video>` montato — pattern FilmScrub).
- `warm.ts`: i loop entrano in coda warm a priorità bassa (dopo gli still), skip Save-Data/2G/reduced.

## B · /WORK OUTRO — "la fine della pista"

- `FilmScrub` **in coda** alla runway su `/work` (mai PRIMA: non si gate-ano i progetti), dentro `WorkIndex` sotto `<WorkHorizontal/>`.
- Clip 0342 trim ~12s: la cresta erbosa della sommità → il bordo → lo strapiombo → mare aperto infinito. Lo scroll esegue il valico.
- Encode ricetta LA ROCCIA: LUT + grade caldo, `keyint 6`, 1600w desktop / 960w mobile / poster → `public/coast/runway-{1600,960}.mp4` + poster.
- `heightVh` ~220. TornEdge top (carta→film). `tearBottom=false` se il film chiude la pagina.
- Caption nuova `dict.work.film` EN/IT (eyebrow/title/meta) — tono: la pista finisce, il volo continua.
- Warm: aggiunto alla coda warm di rotta `/work`.

## C · /ABOUT — L'ARCO

- Seconda banda `FilmScrub` sul percorso, **tra la timeline (experience) e la tesi**: il passaggio.
- Clip 0353, segmento dell'ARCO (~metà clip, sole attraverso l'arco + glitter) ~12s.
- Encode come B → `public/coast/arch-{1600,960}.mp4` + poster. Caption `dict.journey.film2` EN/IT — metafora del passaggio (studio→mestiere).
- Attenzione al ritmo pagina: /about ha già LA ROCCIA — le due bande devono respirare (almeno una sezione piena tra loro; verifica a schermo).

## Vincoli trasversali

- **Niente regressioni** su: portale attuale (crossfade/parallasse/caption/focus), runway, journey. Screenshot before/after.
- Reduced-motion: still oneste ovunque, zero `<video>` montati.
- Bilingue: ogni stringa via `dict.ts` (zod shape en≡it).
- Perf: byte lazy (IO), layout dal primo paint (no CLS), un solo ticker, Lighthouse mobile non deve scendere (<84 attuale = da rimisurare a fine round).
- QA: probe Playwright per pezzo (`_portalloop.mjs`, `_workfilm.mjs`, `_archfilm.mjs`) + `_routesweep.mjs` console-clean; review avversariale finale (workflow multi-lente); typecheck+build verdi per ogni commit.
- Branch `feat/drone-beats`, un commit atomico per pezzo. Merge su main = G3.

## Ordine di esecuzione

1. Selezione trim fine (contact-sheet dense dei 4 clip scelti) → encode di tutti gli asset (background).
2. A (delta di codice minore) → QA visivo.
3. B → QA visivo.
4. C → QA visivo.
5. Review avversariale round completo → fix → `_routesweep` + Lighthouse → docs (HANDOFF/PLAN) → G3.
