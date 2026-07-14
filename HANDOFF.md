# HANDOFF — Alberto Tuveri Portfolio (Golden Hour)

> Last updated: **2026-07-14** (branch `feat/hero-water-flock-realism`, NON ancora su main: acqua hero fotorealistica + murmurazione viva). This is the "continue here" doc.

---

## ⏯ CONTINUA DA QUI — sessione 2026-07-14 (REALISM, branch `feat/hero-water-flock-realism`)

Mandato carte-blanche di Alberto ("pieno controllo, lasciami a bocca aperta"): **acqua+splash dell'hero** e **stormo della murmurazione** portati a livello realistico. G4 sbloccato da lui per questa missione. 2 commit sul branch, **merge su main = G3 (🔵 serve ok esplicito)**.

| Cosa | Commit |
|---|---|
| **Acqua hero**: glint solare dorato (prima lo speculare era `* 0.0`!), micro-increspature animate (uniform `time` nel BUCO DI PADDING a offset 12 di RenderUniforms — layout/size invariati), dispersione cromatica, **foam bianco velocity-driven** (thickness `r16float`→`rg16float`, G = spessore·velocità, ratio = velocità media per pixel), **gravità balistica** sulle gocce (archi veri), density 0.7→0.38 (controluce!), cubemap rigenerata con mare luminoso + glitter path | `35b751c` |
| **Murmurazione**: campo raffiche curl-noise condiviso (vortici coerenti), banking nelle virate + shimmer ambra sun-oriented (`side: DoubleSide` OBBLIGATORIO), onde di allarme propagate dt-normalizzate (poke del cursore → onda di fuga nella "A" che guarisce), battito asimmetrico + planate, 560→820 uccelli desktop | `cf00565` |

**Gotcha CRITICI scoperti in QA (non regredire):**
- ⚠ la **gravità balistica DEVE essere gated posizionalmente** (`smoothstep(halfW·1.6, halfW·3.2, dAxis)`): il churn interno supera `speedGate` anche a riposo, quindi qualsiasi gate su speed/hold **fa collassare la "A" in un cumulo sul pavimento** (visto a schermo).
- ⚠ il canvas è `alphaMode:'premultiplied'`: ogni termine ADDITIVO in fluid.wgsl (glint) va clampato `min(finalColor, 1.0)` o color>alpha = compositing indefinito da spec.
- ⚠ texture procedurali world-space sul fluido (breakup foam) **aliasano a scacchiera sulle superfici edge-on** — modulare col facing, mai pattern ad alta frequenza.
- ⚠ velocità reali degli splash ≈ 4–8 unità griglia → `SPEED_REF` foam = **7** (a 14 il foam non scattava MAI).
- Probe WebGPU: il Chromium di Playwright NON ha dxil.dll (device fail) → **`chromium.launch({ channel: "chrome", headless: true })`** funziona (Chrome reale headless con DXC). Skip preloader: `sessionStorage["at-preloader-seen"]="1"` in addInitScript. Probe: `_water_qa.mjs` (untracked, root).
- Tuning live: slider leva `ballistic` aggiunto; pokeForce 0.85, MOUSE_RADIUS 7 (9 smerigliava l'intera lettera).

**Review avversariale** (workflow 5 lenti × 3 verifier, 44 agenti): 13 finding grezzi → 3 unici confermati, tutti fixati (clamp premultiplied, DoubleSide, onda allarme dt-normalizzata).

**MERGED su main con ok G3 di Alberto ("mergia e continua") e pushato** (`1f234f5` → deploy Vercel). Follow-up su `feat/realism-polish`: **root-caused e fixato il warning `Element not found: #hero`** — NON era una race: `useGSAP` con `scope: root` risolve le stringhe-selettore via `root.querySelector`, e `#hero` è il GENITORE di root → mai trovato, trigger silenziosamente caduto sul fallback (funzionava per coincidenza: hero a scroll 0). Fix: `trigger: el.closest("#hero")`. ⚠ Lezione generale: **dentro `useGSAP` con `scope`, mai selettori-stringa per elementi FUORI dallo scope** — passare l'elemento. Resta solo `THREE.Clock deprecated` (2×, interno R3F v9 con three 0.184 — non nostro, non fixabile senza patch).

**Perfection pass (`87a92ed`, merged+pushed):** bank spento a bassa velocità (un uccello parcheggiato teneva roll casuali — `lat` divide per `spXY`≈0), shimmer più raro (soglia 0.72–0.985), density 0.34 (controluce anche nello stato denso iniziale), handle dev `window.__heroStore` per i probe.

⚠ **Lezione ambiente NUOVA (2026-07-14): finestra Chrome OCCLUSA = rAF congelato = stati fantasma.** Con la finestra dietro altre (`visibilityState:"hidden"`, 0 tick rAF) GSAP/preloader restano congelati e la sim WebGPU avanza solo a raffiche quando lo screenshot CDP forza un frame → screenshot di transitori impossibili (la "A" in nuvola gigante, preloader eterno, h1 assente) che SEMBRANO bug gravissimi ma non lo sono. Prima di giudicare screenshot claude-in-chrome: `document.visibilityState` + contatore rAF via javascript_tool; se hidden → finestra in primo piano o probe Playwright headless (`channel:"chrome"`). Probabile causa-radice anche degli stall storici della cattura.

**Ambient pass (`7632b74`, su main+pushato):** ① **SunRays** — god-rays crepuscolari dal sole della cubemap, due ventagli conici controrotanti CSS-only (`.hero-rays` in globals, statici in reduced-motion), montati da CanvasHost tra `#sea-backdrop` e il canvas fluido; ② **gabbiani ambientali** in Escort — 3-4 silhouette lontane planano sull'orizzonte quando la pagina riposa in cima, fade se scrolli o evochi la scia; ③ **ecosistema**: poke violento → `hero-splash` (WaterBallHero, mouseVel>1.6 throttled 1.2s) → i gabbiani si spaventano (scatto su + battiti rapidi, poi crociera). ⚠ Il "sole CSS" fu bocciato nell'ABOUT: i raggi hero sono altra cosa (ventaglio di luce, non disco) — se Alberto storce il naso, si spengono rimuovendo `<SunRays/>` da CanvasHost.

**RITAGLI DI CARTA (`b0c4104`, su main+pushato):** `TornEdge` — strappo di carta deterministico (SVG, hash-fract a precisione fissa, ombra di fibra) su TUTTE le cuciture fotografiche: FilmScrub top+bottom, strip Masua /about, e **banner editoriale nei case study** (still del progetto + parallax + strappi, gated su `work.textureSrc`). Il linguaggio: la carta si LACERA per rivelare le fotografie.

**SFONDI REALI (`160ee44`, su main+pushato) — Alberto: "troppo artificiale, dev'essere tutto realistico":** ① HERO = **loop fotografico di oceano al tramonto** dietro la "A" (`SeaBackdrop`: Kling 3.0 pro da still nano_banana con start_image==end_image → **loop nativo senza stacco**; poster-first, mobile 960, reduced=still; 1.6MB). Il pass sky procedurale è stato RIMOSSO (sky.wgsl cancellato, canvas di nuovo trasparente, SunRays/nubi CSS eliminati). ② /about = strip editoriale full-bleed del **DJI reale di Masua** con parallax + melt nella carta. ③ Contact = **notte vera** (Pan di Zucchero + Via Lattea, nano_banana): home in **blend screen sopra NightSky** (shader vivo, non distruttivo), closing /about come bg+overlay. ⚠ **IMMAGINI: da ora SOLO `soul_2`** (gratis per il piano di Alberto; nano_banana=2cr, kling pro 10s=17.5cr — saldo ~65). Ricetta loop: generare still → video con start=end frame → `loop` attribute.

**CIELO VIVO (`81d129e`) + ATMOSFERA /about (`77d0a0f`), su main+pushati:** ① lo sfondo hero non è più CSS statico — `render/sky.wgsl` dipinge nello STESSO canvas WebGPU il gemello ANIMATO della cubemap (stesso sole/palette → riflessi coerenti): nubi fbm in deriva, sole che respira, **mare sotto l'orizzonte con la colonna di glitter scintillante**; pipeline = sky pass opaco → fluido in blend premoltiplicato (`loadOp:'load'`); i layer CSS (SunRays/nubi) restano SOLO fallback no-WebGPU/reduced (CanvasHost li salta col fluido attivo); density fluido 0.30. ② /about: carta ACQUERELLO del Sulcis (Higgsfield, `public/coast/sulcis-map.webp`, multiply+mask) + `GoldenMotes` estratto condiviso. ⚠ **Lezione hydration**: il serializzatore SSR TRONCA i float negli style (~6 cifre) mentre il client li setta integrali → qualsiasi style numerico da hash va arrotondato a precisione fissa prima del render (fix in GoldenMotes, era latente anche sulla home). **URL prod: `portfolio-jet-eta-24.vercel.app`.**

**LA ROCCIA (`feeefee`, su main+pushato) — footage DRONE REALE su /about:** `FilmScrub` estratto come componente condiviso (CoastInterlude = wrapper); nuova banda tra bio e timeline con il **DJI Air 3S di Gianluca** (folder Drive "ALBE DRONE", 12 clip — ID estratti dalla pagina pubblica del folder; download via `drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`). ⚠ **Il footage è D-Log M**: pipeline `ffmpeg -vf "fps=24,scale=…,lut3d=_air3s.cube,colortemperature=6000:mix=0.35,scale=out_range=limited,format=yuv420p"` con la **LUT ufficiale DJI Air 3S** (in `_air3s.cube` alla root, untracked; URL nel commit). Il clip 0040 rivela la facciata scolpita PORTO FLAVIA·MCMXXIV — caption `dict.journey.film`. Restano 11 clip reali nel Drive per beat futuri.

**WORKS STILLS (`26bc7de`, su main+pushato) — il buco P0 chiuso:** 3 still editoriali generati con **Higgsfield** (nano_banana_pro, 6 crediti, G5 sbloccato da Alberto): mani nella luce dorata (badante24h), onde di voce ambra (doit), patchwork agricolo aereo (agri) — serie coerente coi token, WebP in `public/works/`. **Branch texture** implementato negli shader di ENTRAMBE le superfici works (cover-fit + duotone pull 0.14 verso il mood + placeholder 1px + fallback procedurale per i provisional). Regola pratica: still nuovi = 3:2, 1280w, `ffmpeg -c:v libwebp -quality 82`.

**LA COSTA (`783355d`, su main+pushato) — la banda video-scrub:** `CoastInterlude` tra Works e Tech — drone su Pan di Zucchero alla golden hour scrubbato dallo scroll (pin 260vh, seek con LERP sul ticker condiviso — mai currentTime diretto per evento; byte lazy via IO 900px ma layout dal primo paint = no CLS; caption `dict.coast` EN/IT; reduced-motion = still senza pin). **Il clip finisce SOTT'ACQUA nei raggi teal** — lo scroll esegue il dive del sito. Asset: re-encode scrub-friendly **keyint 6** dai master 4K (`public/video/` resta gitignored; i web-encode vivono in **`public/coast/`** tracked: 1600=8.5MB, 960=3.2MB mobile, poster 120KB; ffmpeg winget disponibile). + **dolly hero** (camera 72→56 col drain beat, camera-only WP-6) + **nubi in deriva** nel cielo hero (CSS 130s/170s). Alberto ha sbloccato anche **G5/Higgsfield** ("pieno controllo") — non speso: il footage reale bastava. Il dev server wedged (500 su /work/[slug], Jest worker) è stato riavviato — fix noto: kill+restart.

**Golden ambience (`cc2312e`, su main+pushato):** GOLDEN MOTES — 14 motes di polline dorato che salgono per la banda About (CSS puro, valori deterministici per indice = zero hydration mismatch, delay negativi, reduced-motion = polvere statica) + HORIZON GLINT — scintilla che corre lungo la hairline dell'orizzonte ogni ~9s (sibling della linea, non figlio: lo scaleX del draw la schiaccerebbe).

**Pendenze:** 🔵 far VEDERE ad Alberto rest/splash/drain + raggi/gabbiani/motes a schermo (feel fine con leva — finestra Chrome in primo piano!).

---

## ⏯ CONTINUA DA QUI — sessione 2026-07-13 (LA MAREA, branch `feat/awwwards-motion`)

Missione carte-blanche di Alberto: overhaul animazioni verso SOTD. Piano + consuntivo completo in **`ANIMATION_PLAN.md`** (§8). In sintesi, sul branch:
| Cosa | Commit |
|---|---|
| **Token motion** (`--dur-*`, `--ease-crest`, CustomEase tide/dive/drift/crest, `src/lib/motion.ts`, Flip/Observer registrati) + migrazioni prime superfici + Marquee bilingue | `144ba06` |
| **GL artwork layer sotto la runway /work** (still generativi per-slug, bend da velocità, tide-reveal; fondi slide→quad GL con failsafe CSS reversibile) | `47ac525` |
| **Stessi artwork nella depth gallery home** (`src/webgl/artwork.ts` condiviso) + banking camera + tilt piani | `d7736ef` |
| **Preloader**: counter % onesto + orlo sunset curtainPath nel wipe; **CountUp** su metriche case study | `e9eb7f1` |
| **Wildcard**: costellazione "A" in NightSky a fine pagina (uConst, ignizione scaglionata, clamp mobile) | `aab8cb7` |

**MERGED su main con ok G3 di Alberto** (`e63a95f` + fix a11y `5fd43f1` + `374e069` preloader-skip) e pushato (= deploy Vercel). **Lighthouse prod**: desktop 98/96/100/100; mobile degradato 77/96/100/100 — e col hook `?nopre` misurato che **il preloader NON è il collo di bottiglia LCP** (5.0s identico senza): il WP-10 vero è hydration JS + re-hide del testo SSR nell'entrance hero. Preloader ora si salta alle visite ripetute (sessionStorage, hide pre-paint). Restano di design: color-contrast delle parole non-lette del read-along (risolte allo scroll, reduced=visibili).

QA: probe Playwright per ogni pass (`_runwaygl/_gallerygl/_pass4/_constellation/_qa/_preskip.mjs`, untracked in root — desktop+mobile+reduced su 4 route, console pulita), typecheck+build verdi. ⚠ Lezione ambiente: **screenshot claude-in-chrome si bloccano con canvas WebGL attivo in viewport** (anche su main puro — CDP capture starvation, il renderer è vivo): pixel-QA delle zone canvas SOLO via probe Playwright. Pendenze: WP-10 (LCP mobile, direzione sopra), still reali (`textureSrc` monta in `artwork.ts`), contenuti SerSan (🔵).

---

## ⏯ CONTINUA DA QUI — sessione 2026-07-10→12 (motion package, merged @ `5c9d12c`)

**Cosa è arrivato su `main` (deployato e verificato in prod, Chrome reale + probe):**
| Cosa | Note |
|---|---|
| **Hero Ink** (`hero/HeroCopy.tsx`) | il primo viewport finalmente PARLA: h1 nome + ruolo + tagline (jewel word amber **bold** da `hero.taglineAccent`) + scroll-cue, SplitText mask-lines (fonts race-cap 1.5s, autoSplit), sink+dissolve scrubbata col drain della "A" (`end:"+=55%"`). Scrim dusk 58vh con mid-stop: **AA misurato coi pixel** (`_contrast.mjs`) — tutti PASS anche worst-pixel su 1440+390. Fix collaterale: `sea-backdrop` era `-z-10` = sepolto dal body (fallback no-WebGPU/reduced era carta bianca) → `z-0`. |
| **RollLink + `.link`** (`motion/RollLink.tsx`, globals) | UNA identità hover per i link chrome (char-roll GSAP, sr-only intatto, matchMedia hover+fine+no-reduced, `revertOnUpdate`) + underline-draw direzionale per i link in-flow. **Tabella di partizione dentro RollLink.tsx** — un trattamento per link, mai due. |
| **Footer wordmark** (`Footer.tsx`, `FlipText.tsx` resuscitato) | "Alberto Tuveri" gigante hinge-out plank-by-plank + punto ember (fuori dallo split), FUORI da Appear (no double-animation); FlipText hardened (clamp start, back.out 1.2, text-repair). Anno © dinamico. `footer.email/top` in dict (violazione EN/IT sanata). |
| **Next-project handoff** (`WorkCaseStudy.tsx`) | banda paper-deep sopra la chiusura night: prossimo progetto CONFERMATO in loop, drift scrubbato title +6vw / numeral ghost 30vw +2vw (grammatica runway), entrambe le estremità clamp(), banda = un solo link, eyebrow ink-mute (ember-ink su paper-deep = 4.3:1, fail). |
| **Runway spotlight + odometro** (`WorkHorizontal.tsx`) | wash opacity .55→1→.55 + scale contenuto .968→1 per slide sul timeline ESISTENTE (zero nuovi trigger); contatore = striscia odometro (tween discreto `overwrite:'auto'`, regge inversioni violente); will-change statici RIMOSSI da titoli/numerali (wash ora `transform-gpu` per l'opacity scrubbata). |
| Riders | CTA contact senza email inline sotto `sm` (overflow 390); hero-cue via token color-mix. |

**2 round di review avversariale** (5 lenti + 2 scettici per finding): 7 finding confermati, tutti fixati — i due leak `revertOnUpdate` (RollLink/NextProject su flip locale/reduced), cue tween async fuori context (clearProps in cleanup), jewel 600→**700** (WCAG large-text vuole bold vero), eyebrow AA, wash repaint. Probe nuove in root (untracked): `_heroink.mjs`, `_rolllink.mjs`, `_wordmark.mjs`, `_nextproj.mjs`, `_runway.mjs`, `_contrast.mjs` (campionamento WCAG su pixel reali — riusalo per OGNI testo su gradiente/canvas).

**Lezioni nuove (oltre a quelle Nightfall):** ① `end:"55% top"` su ScrollTrigger risolve la % contro il DOCUMENTO, non il trigger — usare `"+=55%"`. ② il body dipinge il suo background SOPRA i figli fixed a z negativo — mai `-z-*` per backdrop sotto `bg-paper`. ③ `useGSAP` con deps senza `revertOnUpdate` = deferCleanup (cleanup solo a unmount): ogni flip locale/reduced accumula context/listener/trigger. ④ tween creati async (subscription/delayedCall) vivono FUORI dal context GSAP → kill + clearProps manuali. ⑤ headless WebGPU = SwiftShader (secondi per frame): nelle probe Playwright forza `navigator.gpu = undefined` e verifica il fluido in Chrome reale.

### ✅ Continuous Curtain — MERGED (`f4eb0dc` + fix `f5c7827`, 2026-07-12)
La navigazione è UN beat continuo: exit cover → swap coperto → enter lift.
- **`CoverOverlay`** (montato in `layout.tsx` — DEVE sopravvivere al remount di template): stesse due curtainPath del menu/enter (sunset 1.7 guida, night 4.2 insegue), v 0→1 in 0.42s power2.in. **Handshake senza frame scoperti:** l'enter del nuovo route si aggancia coperto PRE-paint (layout effect), il release dell'overlay è post-paint su `usePathname`. **Bail 2.5s** ritrae la tenda se la push non atterra (fetch stallata); `handoff()` salta se c'è un NUOVO descend live (commit straggler non uccide la nav in corso). **Input sigillato sotto copertura:** i path dipinti inghiottono il pointer (root svg resta PE-none) + `inert` su `[data-page-root]` (il div contenuto di RouteTransition) — niente locale-flip/menu fantasma sotto il night pieno.
- **`TransitionLink`** (drop-in next/link, alias `{ TransitionLink as Link }` in 6 file): intercetta SOLO le nav della tenda — modifier/middle click, external/target, hash same-pathname, reduced-motion, defaultPrevented passano nativi; latch anti double-click.
- **Hash-nav multi-snap** (`RouteTransition`): `/#works` coperta atterra SULLA sezione — snap a mount + `fonts.ready` + fine lift + 1.4s (in prod font tardivi + chunk R3F spostavano il target di ~1300px DOPO il primo snap; il dev cache-warm lo nascondeva). Rider: `ScrollTrigger.refresh(true)`.
- **QA:** matrice `_curtain.mjs` **11 scenari ALL PASS** (nav coperta, ctrl+click, middle, double-click latch, back, hung-bail su stallo, reduced, loop IT, under-cover-inert, hash-section, slow-success) + 1 round review avversariale (4 finding confermati, fixati). ⚠ verifica prod hash-nav interrotta da **Vercel Security Checkpoint** (challenge anti-bot sul MIO IP dopo il polling — non tocca gli utenti); ri-verificare `worksTop≈80` da /work/badante24h → "← All work" quando scade.

### ▶ PROSSIMO (candidati)
- Dal backlog PLAN: SerSan contenuti reali (🔵), stills `Work.textureSrc` (sbloccano gli effetti image-driven), Lighthouse/axe pass (WP-10), #4 Flip grid (🔵 confirm-feel), shared-title handoff /work→case (ora che la curtain è stabile — prototipa e gate spietato).

---

## ⏯ sessione 2026-07-04 (lane Codrops, mandato AUTO-MERGE)

**Mandato attivo di Alberto:** ogni feature della lane Codrops si mergia su `main` **in automatico** (push = deploy Vercel). Restano gated solo G4 (solver fluido), G5 (asset a pagamento) e i contenuti.

### Già su `main` (deployato)
| Cosa | Merge | Note |
|---|---|---|
| **ShallowWater** — velo di caustiche golden-hour (port procedurale del pen MIT `ksenia-k/RwXVMMY`; sorgente mirror: repo GitHub `tysev44/kentrosneep`) | `829611c` | Su /about + /work + /work/[slug]; **intensificato** su richiesta (shading ≤.55, campo più denso, waterline più bassa) nei cap AA. Hardening da review: repaint-on-resize, fase grana wrappata, luce verso paper. Back-port (repaint + grana) a NightSky. |
| **TideSurge** — h2 del Contact risale come marea, scrubbato (Codrops OnScrollTypography FX2) | `bcfd557` | Sostituisce FlipText (file tenuto, ora inutilizzato). Finestre **clamp()** (bug viewport alti riprodotto e fixato), no will-change, no autoSplit inerte (tolto anche da DualWaveText). |
| **fix hydration reduced-motion** | `2cc0858` | `src/lib/use-hydrated.ts` gate i branch a render-time (WorksGallery, WorkHorizontal); DrawLine seeda il dash nell'effect. /, /about, /work reduced = 0 errori console. |
| **Nightfall** — sticky-stack giorno→notte sulla home (lane #5, "Sticky Grid Scroll") | `aba5b92` | `<Nightfall><Tech/></Nightfall>`: card Tech pinnata col fondo al fold (`--nf-top` da ResizeObserver + spacer 100vh reale; cover `#nightfall` con `margin-top:-100vh` — offset di pagina invariati), scrub welded al bordo notte (scale→.955 + velo gradiente night/dusk, max .55). **2 round di review avversariale (6+3 finding, tutti fixati)** — dettagli nella riga Fatto di `CODEDROPSPLAN.md`: covered-gate geometrico + revalidate scroll nativo, sticky armato post-hydration (`[data-nf-ready]`), disarmo su `refreshInit` (refresh a card stuck = trigger interni cotti di ~100vh), `refresh(true)` safe debounced (desync EN↔IT). Gate `_nightfall.mjs` (5 pass incl. portrait) + `_locprobe.mjs` ALL PASS. |

### ▶ PROSSIMO
La lane Codrops ha **esaurito gli item sbloccati senza dipendenze**:
- **#4 Flip grid** (`Ibaliqbal/grid-layout-transition`): vuole un **contenuto a griglia** (es. chips skill del Tech) → **confirm-feel di Alberto** prima.
- **Image-driven** (Wave Motion, 3D Rotations, Thumbnail Flow, …): bloccati sulle **still reali** (`Work.textureSrc`).
- Fuori lane, dal backlog (`PLAN.md`): feel-calls G4 (leva/device.lost), media wiring (`textureSrc`/`videoSrc` — nessuna superficie li carica ancora).

### Note operative
- **Cache Turbopack corrotta** (`.next`) dopo un crash "Jest worker" del dev server = CSS/chunk stantii serviti. Fix: kill node su :3000 → `Remove-Item -Recurse -Force .next` → `npm run dev`.
- Gate Playwright (root, untracked): `_water.mjs` (velo multi-route) · `_surge.mjs` (TideSurge) · `_nightfall.mjs` (stack, 5 pass) · `_locprobe.mjs` (locale-switch + stuck-refresh regression) · `_pinprobe.mjs`/`_cssprobe.mjs` (usa-e-getta).
- Lezione Nightfall (pattern riusabile): **sticky + ScrollTrigger non si conoscono** — un `refresh()` mentre l'elemento è stuck misura i trigger interni spostati; disarmare lo sticky su `refreshInit` e riarmarlo su `refresh` (sincrono, nessun flash). E ogni flag scritto da `onUpdate` può andare stantio sui salti che GSAP non vede → revalidate su scroll nativo, guardia `hasAttribute` (gratis fuori dalla zona).

---
> Operational brain: **`CLAUDE.md`** (rewritten Golden Hour — golden rules, file map, reference links + code-extraction, skill/MCP routing, gates). Backlog: **`PLAN.md`**. Water sim/render: **`WATER-WAVE-PLAN.md`**.
> ⚠ Source of truth = the **code** + this doc. `DESIGN-SYSTEM.md` on disk is still "Ocean v1" (stale); `docs/*` describe the abandoned dark-ocean direction. The Golden Hour design system is **Claude Design** (`d5833b7a-0744-4bb8-bec0-367ce50698e8`) mirrored in `globals.css` @theme + `src/content/tokens.ts` + `/styleguide`.

## What this is
Single-page + a few routes, scroll-driven portfolio. **Golden Hour**: light warm-white page lit by a sunset (ember `#ee5b23` primary · amber · coral · rose · dusk + one dark `night` band). Type **Bricolage Grotesque** (display) + **DM Sans**. Hero = raw-WebGPU water "A" reflecting a sunset. Bilingual EN/IT. Awwwards SOTD target.

## Run it
```bash
npm run dev          # http://localhost:3000  (npm only — no bun in this env; bun.lock present but unused)
npm run typecheck    # tsc --noEmit
npm run build        # next build — the pre-commit gate (also prerenders /about, /work, /work/[slug], icon/og/sitemap/robots)
# /styleguide        # live design-system contract
```
A dev-only **leva** panel (top-right, home) tunes the hero fluid (`IS_DEV`-gated, absent in prod).

## Pages / routes
- **`/`** (`src/app/page.tsx`): Nav (fluid island) → `HeroScrollSettle` → `#hero` (fixed WebGPU "A" + sunset gradient) → `bg-paper`: **About** → **WorksGallery** (depth fly-through, `#works`) → **Tech** (marquee + icon cloud) → night band: **Contact** → **Footer**.
- **`/work`** (`app/work/page.tsx` → `components/work/WorkIndex.tsx`): the "all work" index — minimal header (wordmark→`/`, EN/IT toggle, back-to-home) + the **3D arc carousel** (`WorkCarousel`); each card opens its `/work/[slug]`. *(The home keeps the depth gallery; this is the dedicated explorer — both coexist, both link to case studies.)*
- **`/about`** (`app/about/page.tsx` → `components/about/AboutJourney.tsx`): long bio + **Education** + **Experience** timeline + thesis. Real confirmed content from `docs/07-PROJECTS.md`. Bilingual via `dict.journey`.
- **`/work/[slug]`** (`app/work/[slug]/page.tsx` → `components/work/WorkCaseStudy.tsx`): SSG case studies for the 3 confirmed projects (badante24h, doit-voice-ai-agent, agricultural-supply-chain). PARC content + metrics + stack, bilingual.
- **Route transition**: `app/template.tsx` → `components/transition/RouteTransition.tsx` — a **sunset-curtain** reveal on every client navigation (firstMount-gated for the Preloader, reduced-motion-safe).

## Key files
| Area | File(s) |
|---|---|
| Tokens (truth) | `src/app/globals.css` (`@theme`) + `src/content/tokens.ts` |
| Copy EN/IT | `src/content/dict.ts` (`useDict`, zod) — nav/hero/about/works(+labels)/tech(+marquee)/contact/journey/footer |
| Scroll backbone | `src/app/_providers/Smooth.tsx` (Lenis ← `gsap.ticker`, `window.__lenis`) |
| GSAP reg | `src/lib/gsap.ts` (ScrollTrigger + SplitText + useGSAP) · `src/lib/scroll-choreo.ts` (`useParallax`) |
| State | `src/store/ui.ts` (zustand: locale/sound/reducedMotion/activeWork/loaded/menuOpen; persist key `ocean-ui`) |
| Nav | `src/components/nav/Nav.tsx` (**fluid-island pill**, scroll hide/reveal + reveal-on-pointer-top + active indicator) + `MenuOverlay.tsx` |
| Hero (GATE G4) | `src/webgl/waterball/**` + `src/webgl/CanvasHost.tsx` (home-only) + `HeroScrollSettle.tsx` (writes `heroStore.explode`) + `webgl/store/heroStore.ts` |
| Works (home) | `src/components/works/WorksGallery.tsx` (R3F depth fly-through, mood ramp per project, caption with **Open case →** / **All work ↗** links, reduced-motion list fallback) |
| Works (index) | `src/components/work/WorkIndex.tsx` (`/work` page shell) + `src/components/works/WorkCarousel.tsx` (3D arc → click card opens `/work/[slug]`) + `src/content/works.ts` (real projects + case-study data) |
| Tech | `src/components/sections/Tech.tsx` + `tech-cloud.tsx` (icon cloud) + `data/skill-icons.ts` |
| Sections | `components/sections/About.tsx`, `Contact.tsx`, `footer/Footer.tsx` |
| Motion primitives | `components/motion/{Parallax,Magnetic,Appear,Marquee}.tsx` · `components/reveal/{Reveal,ScrollText,WordGenerate,FlipText,ShimmerText}.tsx` |
| Preloader | `src/components/Preloader.tsx` (SSR sheet, CSS failsafe) |
| SEO | `app/{icon,opengraph-image,sitemap,robots}.tsx/ts` + `layout.tsx` metadata + Person JSON-LD |
| Skills | `.claude/skills/**` — `webgpu-threejs-tsl` + a curated antigravity set (design/motion/3d/perf/a11y/seo) + `awwwards-loop`, `docs-driven-build`. CLAUDE.md §7 routes tasks→skills. |

## Done & verified (this session — 18 commits, newest first)
`82feb3a` feat(works): **restore depth gallery on home + add `/work` carousel index** (both coexist, both link to `/work/[slug]`) — verified in browser: home gallery + `/work` carousel render, console clean ·
`155115d` fix: visible cursor + nav reveal-on-approach + work cards open case study on click ·
`4d68e6a` feat(nav): fluid-island floating glass pill ·
`25bcd20` feat(transition): sunset-curtain route reveal ·
`94eff49` fix: public email → `albertotuveri@gmail.com` ·
`3fbacb6` route enter-transition ·
`e1725fc` feat(seo): metadata/OG/favicon/sitemap/robots/JSON-LD ·
`1fd8978` feat(work): 3D arc carousel ·
`39dedcb` feat(work): real project data + `/work/[slug]` case studies ·
`463dda0` feat(about): `/about` page ·
`f10e013` WordGenerate + 3D char-flip + velocity Marquee ·
`0284c96` revert: removed the side dive-line (disliked) ·
`4293bc8` border-beam CTA ·
`f57f55a` (dive-line, later reverted) ·
`3931197` more text effects + scroll entries (Footer/Contact/Works) ·
`45982c5` PLAN done-markers ·
`a048d36` Preloader ·
`180d565` ocean→Golden Hour comments ·
`6a6b803` (custom cursor — later removed in 155115d) ·
`d2add75` ScrollText (Tech) ·
`b3ae6c2` parallax backbone.
(Earlier: `1bcdcaa` CLAUDE.md rewrite, `56b86ff` skills install.)

Every commit: `npm run build` green + console clean. Motion system, multi-page, SEO, transitions, and the 3D works carousel all shipped, re-themed from the CLAUDE.md §6 reference libraries (Codrops/Magic UI/Aceternity/Skiper/GSAP) on our GSAP/Lenis/three stack.

## Known issues / gotchas
- **Verify the cursor/nav fix (`155115d`) visually** — the home depth gallery + `/work` carousel were re-checked this session (render + console clean), but `155115d`'s cursor removal + nav reveal-on-pointer-top still want a quick eyeball: native cursor visible; nav reappears when you move to the top after scrolling down. (Work-card→case-study click is now confirmed working on both `/` gallery and `/work` carousel.)
- **`WorksGallery` (home) and `WorkCarousel` (`/work`) BOTH ship by design** — the depth gallery was wrongly removed once; it's restored. Don't delete either; both feed `/work/[slug]`. R3F deps are needed by `WorksGallery` (home), so they stay.
- **Custom cursor removed**: `src/components/Cursor.tsx` + the `.cursor-*` / `html.has-custom-cursor` CSS in `globals.css` are now **dead code** (no longer mounted). Delete or rebuild a *visible* custom cursor if wanted — do NOT re-mount the old one (it hid the native cursor with nothing visible). `DiveLine.tsx` was deleted earlier.
- **SerSan ×2** projects are **provisional placeholders** (`works.ts`, status `provisional`, WIP badge, no `/work/[slug]` page; on `/work` the card shows "WIP" instead of opening). Need real titles/PARC/stack from Alberto.
- **`THREE.Clock` deprecation warning** in console = internal to R3F (not our code), benign.
- **`NEXT_PUBLIC_SITE_URL`** must be set on deploy so OG/canonical/sitemap are absolute (falls back to localhost).
- **Hero fluid = GATE G4**: don't retune `src/webgl/waterball/**` params without Alberto's ok. Deploy/merge `main` = **G3**. Paid asset gen (Higgsfield/Blender) = **G5**.
- `resize_window` (claude-in-chrome) didn't change the rendered viewport in-session → true-mobile 390px QA still pending.

See **`PLAN.md`** for the prioritized backlog + the ready-but-unbuilt effect presets.
