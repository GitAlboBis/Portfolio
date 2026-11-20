# 05 — Cinematic Scroll (Pan di Zucchero, fusa nell'hero)

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence). Riconciliato dal loop docs-driven-build.

> Scopo: definire alla lettera la cinematica di Pan di Zucchero del portfolio. **La cinematica NON e piu una sezione S3 a se stante**: e **fusa nell'hero** come backdrop che scrubba sullo scroll. Tecnicamente e una **frame-sequence WebP** (136 frame `public/frames/f_000…f_135.webp`) disegnata su un `<canvas>` 2D full-screen (`src/components/video-backdrop.tsx`), indicizzata da `heroStore.video` (la progress grezza dello scroll dell'hero). Niente clip `<video>` runtime, niente scrub via `currentTime`, niente quad WebGL dedicato, niente zoom-cut A→B. Questo file e la fonte di verita per chi tocca il backdrop cinematico: descrive l'architettura reale, la pipeline di estrazione frame canonica, i beat di scroll, budget di performance, fallback e checklist done-when.

Documenti correlati (usare i path del MANIFEST):
- Stack e versioni vincolanti: `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/01-TECHSTACK.md`
- Art direction, token oceano, color grade: `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/02-DESIGN.md`
- Canvas host, sync Lenis↔scroll, store, mappa scena↔sezione: `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/03-ARCHITECTURE.md`
- Hero acqua MLS-MPM da cui la cinematica eredita il contesto: `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/04-3D-HERO-WATER-LOGO.md`
- Riferimenti di qualita (Lusion, Codrops, ecc.): `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/06-REFERENCES.md`
- Routing MCP (Higgsfield, Vercel, claude-in-chrome): `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/09-MCP.md`
- Routing skill (remotion, scroll-experience, video/asset): `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/10-SKILLS.md`

---

## 1. Cos'e oggi: cinematica fusa nell'hero

La cinematica vive **dentro l'hero**, non in una sezione separata. `src/app/page.tsx` renderizza esattamente: `Hero` → `Intro` → `WorkSection` → `SkillsSection` → `Contact`. **Non esiste alcuna `CinematicSection`**; il vecchio `src/components/sections/cinematic-placeholder.tsx` e stato **eliminato**.

Architettura runtime effettiva (vedi `03-ARCHITECTURE.md`):
- **`src/components/sections/hero.tsx`** — un'unica `<section id="hero">` alta `h-[600vh]` con un blocco interno `sticky top-0 h-screen`. Una **timeline GSAP unica** (ScrollTrigger `scrub: 1`, `start: "top top"`, `end: "bottom bottom"`) e il solo WRITER: ad ogni `onUpdate` scrive `heroStore.video = self.progress` (la progress grezza 0→1 dell'hero) e, su sotto-tween, `explode` e `reveal`.
- **`src/components/video-backdrop.tsx`** — il backdrop cinematico. E un `<canvas>` 2D `fixed inset-0 z-0`, `aria-hidden`, `pointer-events-none`. Nel suo RAF legge `heroStore.video`, mappa la progress su un indice frame e ridisegna la WebP corrispondente. E il READER della cinematica.
- **`src/webgl/CanvasHost.tsx`** — monta, nell'ordine: il `#sea-backdrop` (gradiente CSS, fallback ultimo), poi `VideoBackdrop`, poi `WaterBallHero` (acqua WebGPU). L'ordine e deliberato: la "A" d'acqua trasparente composita SOPRA il backdrop cinematico.

Quindi i tre layer dell'hero — footage cinematico (canvas 2D), acqua "A" (WebGPU), titolo liquido (`LiquidText`) — leggono tutti lo **stesso** `heroStore`, scritto da una sola timeline. Niente loop concorrenti tra i moduli; ognuno ha il proprio RAF leggero che legge `getState()` senza causare re-render React (lo store e un FX-bus non reattivo, vedi `src/webgl/store/heroStore.ts`).

> openQuestion: il commento in testa a `CanvasHost.tsx` cita ancora "R3F stays available for the scroll cinematic (later)". Nell'albero attivo **non c'e** alcuna scena R3F per la cinematica; e una nota storica. Da chiarire con Alberto se R3F per la cinematica e un piano futuro o testo morto da rimuovere.

---

## 2. Sorgente video (Higgsfield) e stato degli asset

Il footage e generato con **Higgsfield** (MCP, vedi `09-MCP.md`). I master grezzi vivono in `public/video/` come `hf_20260624_*.mp4` (piu un `… - Trim.mp4`). **Sono SOURCE-ONLY**: materiale sorgente, **untracked** in git, NON serviti al browser e NON referenziati dal runtime. L'unica cosa che il sito carica e la frame-sequence WebP estratta da questi master (sezione 4).

Trattare i master come placeholder sostituibili: se Alberto fornisce footage reale (specie del backflip), lo si usa al posto del generato e si riestrae la frame-sequence con la stessa ricetta — i nomi file di output (`public/frames/f_NNN.webp`) e il `FRAME_COUNT` restano il contratto.

> openQuestion: il contenuto narrativo esatto del master attuale (establishing aereo? backflip? quale dei vari `hf_*.mp4` e quello estratto in `public/frames`) non e desumibile dal codice. Da confermare con Alberto prima di descrivere i beat narrativi come definitivi.

---

## 3. Frame-sequence: contratto runtime (`src/components/video-backdrop.tsx`)

Questa e l'implementazione reale e stabile. Numeri e dettagli verificati sul codice.

- **`FRAME_COUNT = 136`**. Path: `framePath(i) = "/frames/f_" + String(i).padStart(3,"0") + ".webp"` → `public/frames/f_000.webp … f_135.webp` (136 file presenti).
- **Indicizzazione**: `idx = clamp(round(prog * (FRAME_COUNT - 1)), 0, 135)` dove `prog = heroStore.video`. Lo scrub e quindi 1:1 con la progress dell'hero: se l'utente si ferma, il frame si ferma; se torna indietro, la sequenza torna indietro (reversibile, nessuno stato one-shot).
- **Disegno**: contesto `2d`, `imageSmoothingQuality = "high"`, fit **cover** calcolato a mano (confronto aspect ratio immagine vs canvas, centratura). Disegna solo se `img.complete && img.naturalWidth`.
- **Redraw solo on index-change**: il RAF (`loop`) ridisegna **solo** quando `idx !== lastIdx`. Nessun ridisegno per-frame inutile.
- **DPR clamp 1.5**: `dpr = min(devicePixelRatio || 1, 1.5)`; il canvas backing-store e dimensionato `floor(client * dpr)`. Tetto deliberato per non decodificare/riempire stills oltre 1.5x.
- **Preload throttlato**: carica subito il frame 0, poi una pompa con **`CONCURRENCY = 6`** scorre i frame 1→135 (`new Image()`, `decoding = "async"`). Evita di decodificare tutti i 136 stills 1920px in un colpo.
- **Gating visibilita**: un `IntersectionObserver` su `#hero` (`threshold: 0`) mette `heroVisible`; il RAF salta il lavoro quando l'hero e fuori schermo. Cleanup completo on unmount (cancel RAF, disconnect IO, remove resize listener).
- **Reduced-motion**: se `prefers-reduced-motion: reduce`, `prog` e **forzato a 0.5** → la sequenza si congela su un frame a meta corsa (~frame 67). Nessun movimento, nessuno scrub.

Contratto verso il resto dell'hero: `VideoBackdrop` e puramente un READER di `heroStore.video`. Non scrive nulla, non conosce GSAP, non conosce l'acqua. Cambiare la curva di scrub = cambiare come la timeline in `hero.tsx` scrive `video`.

---

## 4. Pipeline di estrazione frame (CANONICA)

La frame-sequence WebP **e** la strategia di scrub del progetto (non un'opzione di fallback). La ricetta sotto e canonica: produce esattamente il contratto della sezione 3.

Estrazione da un master Higgsfield a 136 frame WebP:

```bash
# Da un master hf_*.mp4 (source-only in public/video/) verso la sequenza servita.
# %03d -> f_000.webp ... f_135.webp ; il count finale deve combaciare con FRAME_COUNT (136).
ffmpeg -i "public/video/hf_<master>.mp4" \
  -vf "scale=1920:-2,fps=<fps>" \
  -c:v libwebp -q:v 80 \
  "public/frames/f_%03d.webp"
```

Note operative:
- **Il count e un contratto**: `public/frames` deve contenere esattamente `FRAME_COUNT` file numerati da `000`. Se cambi numero di frame, aggiorna `FRAME_COUNT` in `video-backdrop.tsx` (oggi 136). `ffmpeg` numera da 1: rinominare a base-0 (`f_000…f_135`) o estrarre con uno script che parta da 0 per rispettare `padStart(3,"0")` su indice 0-based.
- **`fps`**: scegli un `fps` che, sulla durata del master, dia ~136 frame; in alternativa estrai tutti i frame e poi campiona a 136. La progress dell'hero e continua, quindi 136 stills danno uno scrub fluido senza il peso di un `<video>` seek.
- **Risoluzione**: `scale=1920:-2` come master degli stills; il DPR-clamp a 1.5 lato runtime evita di servirli a densita maggiore. Nessuna variante mobile separata: la fit "cover" + DPR clamp coprono i form factor (vedi performance, sezione 6).
- **Qualita WebP**: `-q:v 80` e il punto di partenza (qualita/peso bilanciati). Tarare guardando peso totale di `public/frames` vs nitidezza (apertura, sezione 8).
- **Poster / primo frame**: il frame 0 e caricato per primo e disegnato appena pronto; funge da poster implicito mentre il preload pompa il resto. Non serve un `*.poster.jpg` separato.

Per estrazioni piu sofisticate (denoise, tone-match tra master diversi) si possono usare le skill `remotion` / `remotion-best-practices` (vedi `10-SKILLS.md`), ma l'output deve restare lo stesso contratto `public/frames/f_NNN.webp`.

---

## 5. Beat di scroll (timeline hero)

La progress dell'hero (0→1 sui suoi `600vh` sticky) guida tre cose in parallelo, scritte dalla **stessa** timeline GSAP in `hero.tsx`. Mappa reale dei beat (dai commenti e tween del codice):

| Beat | progress (~) | Cosa accade | Layer / store |
|------|--------------|-------------|---------------|
| Entry | 0.00 | Acqua "A" sul primo frame del footage; scroll-cue visibile; focus-pull d'ingresso. | water + `video=0` |
| Explode | ~0.08 → ~0.24 | La "A" esplode sul footage e svanisce (rising-edge del burst). | `explode` 0→1 |
| Cinematic | ~0.24 → ~0.56 | Il footage scrubba **da solo**: e il beat puramente cinematico. | `video` continua |
| Reveal | ~0.56 → ~0.86 | "Portfolio" poi "Alberto Tuveri" emergono dall'acqua; lo scrim si scurisce per leggibilita. | `reveal` 0→1 + scrim |
| Hold | ~0.86 → 1.00 | Il title card tiene prima che l'hero si sganci. | tween vuoto di coda |

Regole di beat (verificate sul codice):
- `heroStore.video = self.progress` per **tutta** la corsa: il footage non si ferma mai durante l'hero, anche mentre esplodono o si rivelano gli altri layer.
- I valori di progress sopra sono **derivati dagli offset/duration dei tween GSAP** in `hero.tsx` (timeline con `scrub`), quindi sono **live-tuned soggetti a sign-off GATE-6**: non trattarli come numeri finali. Le percentuali nei commenti del codice e in questa tabella vanno riconfermate dopo il tuning.
- I tagli sono guidati dallo scroll, mai temporizzati: reversibili avanti/indietro.
- Le label EN/IT del titolo passano da `LiquidText` + dizionario i18n (vedi `02-DESIGN.md` / `03-ARCHITECTURE.md`); mai copy hardcodato.

---

## 6. Performance

Budget vincolante (da `01-TECHSTACK.md`): 60fps desktop recente, degrado elegante su mobile, Lighthouse perf ≥ 80 mobile. Il backdrop frame-sequence e progettato per essere leggero rispetto a un quad video + seek.

Cosa il codice gia fa (mantenere):
- [x] **Redraw on index-change only**: nessun ridisegno se l'indice frame non cambia.
- [x] **DPR clamp 1.5**: niente backing-store oltre 1.5x.
- [x] **Preload concurrency 6**: decode scaglionato dei 136 stills, non tutti insieme.
- [x] **IntersectionObserver idle**: il RAF non lavora quando l'hero e fuori schermo.
- [x] **Canvas 2D, non WebGL**: nessun costo GPU per il footage; la GPU resta per l'acqua WebGPU.

Da sorvegliare / tarare (GATE-6):
- [ ] **Peso totale `public/frames`**: 136 WebP a 1920px sono il principale costo di banda dell'hero. Misurare il transfer totale e l'impatto su Lighthouse mobile; abbassare `-q:v` o la `scale` se sfora.
- [ ] **Time-to-first-frame**: il frame 0 deve essere pronto presto (e caricato per primo) per evitare canvas vuoto al primo paint.
- [ ] **Coesistenza con WaterBallHero**: il backdrop 2D e l'acqua WebGPU girano sopra lo stesso hero; verificare che insieme reggano 60fps sul desktop target.
- [ ] **Mobile**: nessun asset separato per mobile; affidarsi a fit cover + DPR clamp. Se il peso non regge il budget mobile, valutare una seconda sequenza a risoluzione ridotta (apertura, sezione 8).

Degrado / reduced-motion: vedi sezione 7.

---

## 7. Fallback e accessibilita

Fallback reali nel codice:
- **WebGPU assente** → `WaterBallHero` ritorna `null` (guard `navigator.gpu`); il `#sea-backdrop` (gradiente CSS in `CanvasHost`) e la base. Il `VideoBackdrop` (canvas 2D) **non dipende da WebGPU** e continua a funzionare: il footage scrubba comunque sopra il gradiente. Non esiste un percorso WebGL2.
- **`prefers-reduced-motion: reduce`** → `VideoBackdrop` congela `prog` a 0.5 (frame a meta corsa, niente scrub); `hero.tsx` salta la timeline e imposta `explode:1, reveal:1, video:0.5` (title card statico, scroll-cue nascosto). Nessun movimento.

Regole a11y (vincolanti, da `01-TECHSTACK.md`):
- [x] Il canvas del footage e **decorativo**: `aria-hidden` + `pointer-events-none` (gia nel codice). La narrativa accessibile e il testo reale del titolo (`LiquidText`, EN/IT leggibile da screen reader).
- [x] **Nessun audio**: la frame-sequence e immagini; nessuna traccia audio nell'hero.
- [ ] La sezione hero e sticky/alta `600vh`: lo scroll da tastiera (frecce/PageDown) deve continuare ad avanzare normalmente; verificare che il pin visivo non intrappoli il focus.
- [ ] Contrasto AA per il titolo sovrapposto al footage: lo scrim radiale animato in `hero.tsx` scurisce dietro al testo nel beat reveal; verificare AA sui frame piu chiari (picchi golden-hour del footage).

---

## 8. QA visivo / done-when

QA visivo obbligatorio con **claude-in-chrome** (sostituisce Playwright, vedi `09-MCP.md`): screenshot a progress fissi, console e network puliti.

Procedura QA:
1. Caricare la pagina, scorrere l'hero a step di progress noti (es. 0.05, 0.20, 0.40, 0.60, 0.80, 0.95) e catturare screenshot per ogni beat (entry / explode / cinematic / reveal / hold).
2. Verificare assenza di stutter durante lo scrub del footage: l'indice frame deve seguire lo scroll senza scatti percepibili (specie nel beat "cinematic" 0.24→0.56).
3. Verificare la compositazione: footage (dietro) → acqua "A" trasparente → titolo liquido (davanti), tutti coerenti allo stesso `heroStore.video`.
4. Console: nessun errore di decode immagine, nessun 404 su `/frames/f_NNN.webp`.
5. Network: i frame si caricano lazy/scaglionati (concurrency 6), non tutti al primo paint; nessun fetch dei master `hf_*.mp4` (devono restare source-only, non serviti).
6. Throttle CPU/rete in Chrome → verificare time-to-first-frame accettabile e nessun canvas vuoto prolungato.
7. Forzare `prefers-reduced-motion: reduce` → footage congelato a meta corsa, title card statico, nessun movimento.

Done-when (tutte le caselle vere):
- [ ] `public/frames/f_000…f_135.webp` presenti, count = `FRAME_COUNT` (136), estratti con la ricetta canonica (sezione 4).
- [ ] Master `hf_*.mp4` restano in `public/video/` come source-only (untracked, non serviti, non referenziati a runtime).
- [ ] Scrub del footage reversibile (avanti/indietro), 1:1 con `heroStore.video`, redraw solo on index-change.
- [ ] Beat (explode / cinematic / reveal / hold) leggibili e tarati con Alberto (GATE-6).
- [ ] 60fps su desktop target con footage 2D + acqua WebGPU coesistenti; nessun jank misurabile.
- [ ] Peso `public/frames` entro budget; Lighthouse perf ≥ 80 mobile.
- [ ] Fallback verificati: reduced-motion (congelamento + title statico), WebGPU assente (gradiente CSS + footage ancora attivo).
- [ ] A11y: canvas `aria-hidden` + `pointer-events-none`, titolo EN/IT leggibile da screen reader, focus/tastiera ok, contrasto AA.
- [ ] QA visivo claude-in-chrome su tutti i beat, console e network puliti (nessun 404 frame, nessun fetch dei master mp4).
- [ ] Preview deploy su Vercel verificato (vedi `09-MCP.md`).

---

## 9. Decisioni aperte (confermare con Alberto)

- **Contenuto narrativo del master**: quale `hf_*.mp4` e estratto in `public/frames` e cosa mostra (establishing, backflip, entrambi?). Necessario per descrivere i beat narrativi come definitivi (sezione 2).
- **Footage reale del backflip di Alberto**: usare il reale (preferito) al posto del generato Higgsfield? Se reale, fornire sorgente in alta qualita e riestrarre la sequenza.
- **Tuning della timeline (GATE-6)**: offset/duration dei tween in `hero.tsx` (explode, reveal, hold) e quindi i confini di beat in sezione 5 — valori live-tuned, soggetti a sign-off.
- **`FRAME_COUNT` / qualita WebP / scale**: 136 frame a 1920px `-q:v 80` e il punto di partenza; tarare contro il budget di banda mobile (eventuale seconda sequenza a risoluzione ridotta solo se Lighthouse mobile sfora).
- **Nota R3F "for the scroll cinematic (later)"** in `CanvasHost.tsx`: piano futuro reale o testo morto da rimuovere? La cinematica oggi e canvas-2D, senza R3F.
