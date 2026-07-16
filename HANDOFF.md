# HANDOFF — Alberto Tuveri Portfolio (Golden Hour)

> Last updated: **2026-07-16 (bis)** (SERVIZIO FOTOGRAFICO nei case study + RACK FOCUS nella gallery home, merged su main). This is the "continue here" doc.

---

## ⏯ CONTINUA DA QUI — sessione 2026-07-16 bis (CASE STUDY VIVI + WORKS DoF, merged @ `f648546`)

Mandato "continua, lasciami a bocca aperta". Chiusi i round ② e ④ dell'elenco 2026-07-15: i due candidati non bloccati con piu' wow-per-rischio.

| Cosa | Commit |
|---|---|
| **IL SERVIZIO FOTOGRAFICO** (round ② — case study vivi): `/work/[slug]` tratta la sua still come un servizio di rivista — wide shot full-bleed d'apertura (settle-zoom), 2 **DETAIL CROP** della stessa foto tra i capitoli PARC (nuovo `src/components/work/DetailCut.tsx`: parallax + Ken Burns scrubbati su elementi SEPARATI, TornEdge, mood wash multiply, caption bilingue `works.detail`), capitoli numerati con **label sticky** accanto alla colonna di lettura, **StackChips** che si posano come carte date, metriche a scala display, numerale ghost runway nell'intro. Header: **scrim di carta** (chrome leggibile sopra foto/night — anche su /about) + **toggle EN/IT** che mancava. | `e274417` |
| **RACK FOCUS** (round ④ — Works gallery DoF, P1 sbloccato dalle still): `WorksGalleryCanvas` — uniform `uBlur` per piano (dead-zone sul fuoco), disk blur 5 tap × 3 canali su mip bias, frangia cromatica radiale, **edge feather** proporzionale al defocus (il dettaglio che vende l'illusione), grana che si dissolve, swell 4.5%; artwork procedurale appiattito col blur; **ghost title → ShaderMaterial** e obbediscono al piano focale. A uBlur=0 collassa al sample nitido. | `70122d7` |
| **Review avversariale** (workflow 21 agenti: 5 lenti → dedup → 3 confutatori/finding con evidenza sui sorgenti three/gsap): 5 finding unici, TUTTI confermati e fixati | `9d85bd2` |

**Lezioni NUOVE (hardening, da non regredire):**
- ⚠ **MeshBasicMaterial → ShaderMaterial raw perde l'output pipeline**: texture sRGB campionata = valori LINEARI; senza `#include <tonemapping_fragment>` + `#include <colorspace_fragment>` in coda al main, il framebuffer sRGB riceve lineare → ember diventa rosso sangue. three risolve gli include anche negli ShaderMaterial: quei due chunk = parita' esatta con MeshBasic.
- ⚠ **Blur su texture di glifi canvas = media ALPHA-PESATA**: i texel trasparenti sono NERI — la media secca scurisce/assottiglia il glifo sfocato invece di farlo sbocciare.
- ⚠ **Il tetto dello zoom sulle still e' la risoluzione sorgente**: 1280px → max ~1.7 (finestre inset) / ~1.5 (full-bleed a 1440), oltre si magnifica il blocking WebP, non fotografia. Il "detail" si ottiene con focal offset + mood wash.
- ⚠ **Toggle locale su pagine piene di trigger scrubbati**: il reflow EN/IT lascia trigger stali (ScrollTrigger ri-misura solo su resize/load) → `ScrollTrigger.refresh()` debounced ~160ms su `locale` (fatto in WorkCaseStudy + AboutJourney).
- Il cursore custom "drop-of-light" nelle probe headless resta parcheggiato all'ultima posizione del click Playwright: il cerchio-punto negli screenshot NON e' un bug.

**QA probe (untracked, root):** `_casestudy.mjs` (3 contesti × 8 beat + funzionali + sticky), `_casemetrics.mjs`/`_casescrim.mjs` (one-off metriche/scrim/flip IT), `_dof.mjs` (6 step di progress × 2 viewport, console = zero errori shader). `_routesweep.mjs` ALL CLEAN post-merge su dev. Build 13 pagine verde; probe rilanciate anche contro `next start` (build prod) — funzionali tutti PASS.

**Osservazione aperta (pre-esistente, NON di questa sessione):** sulla build PROD (`next start` e prod Vercel) la console di /work e /work/[slug] mostra `[warning] The resource /coast/night-sea.webp was preloaded using link preload but not used…`. Un `<link rel=preload as=image href=/coast/night-sea.webp>` compare nel DOM a runtime ma NON e' nell'HTML servito ne' nel nostro codice (grep preload/appendChild/ReactDOM.preload = zero; warm.ts usa fetch low-priority). Sospetti da verificare con calma: prefetch RSC di next/link che rigioca hint float, o comportamento nuovo di next 16.2.10. Benigno ma juror-visible in devtools — da root-causare.

**Round 5 — LA MAREA TOCCA IL NOME (`1b8100d`, stessa sessione):** estensioni ecosistema sugli eventi live — ① `FlipText` ha la prop `rippleOn`: su `tide-touch` un'onda attraversa il wordmark del footer (dip-lift-settle elastico, stagger, `y` px che compone con lo yPercent dell'entrance) e **esce dal punto ember** (hop ritardato 0.42s); ② `ScrollProgress` vive nel mondo: sott'acqua (`submerge`) l'arco del giorno si spegne, su `surface-break`/`tide-touch` flara 650ms. Review proporzionata (10 agenti, 2 lenti × 2 confutatori): 2 finding confermati fixati — entrambi sul flip runtime di reduced a metà animazione (clearProps del punto in cleanup, pattern TideEbb; `setPhase("day")` al detach). QA `_ecosystem.mjs` ALL PASS (default+reduced). ⚠ Lezione: **ogni tween nato in listener su un elemento che sopravvive** (non-splittato) vuole `clearProps` in cleanup, non solo `kill()` — e ogni stato-fase settato da eventi va resettato nel cleanup dell'effect che stacca i listener.

**Osservazione preload CHIUSA (root-caused):** il `<link rel=preload as=image>` fantasma di `night-sea.webp` su /work arriva dal **payload RSC prefetchato** — il flight della home (unica `<img>` in un server component) porta un hint float `"L"` che il client rigioca al prefetch del link wordmark → `/`. By-design di React/Next (l'immagine è pronta se navighi); il warning Chrome scatta solo se NON navighi entro pochi secondi. Nessuna azione (verificato con probe a `appendChild` patchato: lo stack punta al flight consumer di react-dom).

**▶ Prossimi round:** ③ **beat drone** — ⚠ BLOCCATO su questo PC: l'URL del folder Drive "ALBE DRONE", la LUT `_air3s.cube` e i master (`public/video/`, gitignored) vivono solo sull'altro PC — serve che Alberto ri-condivida il link del folder (o la sessione torni sull'altro PC). · eventuale kling loop per case study (G5, preflight `get_cost`). 🔵 Su Alberto: SerSan ×2, feel-review, #4 Flip grid, link Drive.

---

## ⏯ CONTINUA DA QUI — sessione 2026-07-16 (MENU-PORTALE + WARM-UP, merged @ `d9a5cf5`)

Sessione da un altro PC (sync `git pull` dei 73 commit del 14-15). Mandato: aggiornare e continuare il miglioramento usando `npx skills find`.

| Cosa | Commit |
|---|---|
| **Bump deps**: next 16.2.10, react 19.2.7, lenis 1.3.25, tailwind 4.3.2, postprocessing 6.39.2, simple-icons 16.26.0. **three FERMO a 0.184** (drei/fiber si dedupano lì; bump renderer da gated a parte). **TS 7 nativo NON adottato** (rischio>valore). | `463fc90` |
| **Skill installate** (`npx skills add`, project-level): 8 GSAP ufficiali (greensock/gsap-skills), 5 Emil Kowalski (emil-design-eng, apple-design, improve/review-animations, find-animation-opportunities), 4 three.js (cloudai-x: shaders/animation/interaction/postprocessing), ai-video-generation | `74c73e1` |
| **IL MENU-PORTALE** (candidato #1 dei round): scrap fotografico TornEdge nel MenuOverlay che crossfade-a per rotta al hover/focus (blur-mask 9px, enter 0.42s/exit 0.26s), parallasse quickTo, caption `nav.preview` EN/IT su scrim, resting = mare all'ora d'oro; trigger hamburger anche desktop (pill, additivo) | `41efcd9` |
| **WARM-UP PROGRESSIVO** (segnalazione Alberto "non carica il video scroll"): `src/lib/warm.ts` + `<Warmup/>` nel layout — post `ui.loaded`+`load`+idle, coda a priorità bassa porta in HTTP cache chunk R3F (gallery/tech-cloud/murmuration/runway), film scrub (coast/ascent/rock, variante 768px) e still (works/portale), rotta corrente prima + hop probabili; dedupe, skip Save-Data/2G, video skippati in reduced. QA: 12 item senza scroll, coast `readyState=4` in 19ms. NON tocca il primo paint (preloader resta sui font). | `e44cb9a` |
| **Review avversariale portale** (workflow 41 agenti, 5 lenti × 2 confutatori con repro su gsap 3.15): 18 grezzi → 15 confermati (9 unici) → tutti fixati | `56e9811` |

**Lezioni NUOVE (hardening, da non regredire):**
- ⚠ **quickTo + tween concorrente con `overwrite` = quickTo PERMANENTEMENTE inerte** (gsap 3: `_op` mai ripulito, `"x not eligible for reset"` console.warn a ogni chiamata anche in prod). Reset SEMPRE attraverso la stessa coppia quickTo (`qx(0)`), mai `gsap.to` sugli stessi prop.
- ⚠ **SplitText stacca i text node di React**: il flip EN/IT non ritraduce gli split target — servono `key={locale}` sui bottoni splittati (React li ricrea) + `revertOnUpdate`.
- ⚠ **`.from()` residuo al rebuild**: senza `revertOnUpdate` gli inline style (`opacity:0; visibility:hidden`) del vecchio build diventano gli END VALUES del nuovo → elementi invisibili per sempre dopo un flip locale/reduced.
- ⚠ **I rebuild degli overlay devono rispettare `openRef`**: un flip reduced/locale a menu aperto altrimenti nasconde l'overlay con Lenis fermo e `aria-expanded` bugiardo.
- ⚠ **`<img>` in subtree `display:none` viene comunque scaricata**: gate il MOUNT sul breakpoint (`min-width: 64rem`), non fidarsi di `loading="lazy"`.
- Il menu aperto ora **idle-a la sim WebGPU** (gate rAF su `menuOpen`, render-only, G4 intatto) e **pausa il video mare**.

**QA probe (untracked, root):** `_menuportal.mjs` (stati base desktop/mobile/reduced), `_menuportal2.mjs` (regressioni review: parallasse post-reopen, flip IT, reopen rapido, mobile 0 download), `_warm_qa.mjs` (cache pre-scroll + readyState), `_routesweep.mjs` (5 route × 2 viewport console-clean — ALL CLEAN post-bump).

**▶ Prossimi round** (invariati dall'elenco sotto, il #1 è FATTO): ② case study vivi ③ beat drone (11 clip Drive) ④ **Works gallery DoF — SBLOCCATO** (le still reali ci sono) ⑤ estensioni ecosistema. 🔵 Restano su Alberto: SerSan ×2, `NEXT_PUBLIC_SITE_URL`, feel-review.

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

**IL CONTATTO (`f88929d`, su main+pushato):** la "A" sta DENTRO il mare — sotto la waterline (uniform `waterline`+`refl_strength`, vec2f in coda a RenderUniforms 272→288, prefix-compatibile) le gambe si rifrangono (wobble crescente), si dissolvono nel mare, e una **cintura di schiuma** scintilla sulla linea di contatto. Shading rifattorizzato in `waterColor(uv,iuv)`. ⚠ Il mirror a specchio classico è stato PROVATO E SCARTATO (la lettera copre la zona riflessa — non leggeva). + **preloader che COLA**: la A d'inchiostro si stira e cade nel mare mentre la fontana della nascita sale.

**LA NASCITA (`be44fc3`, su main+pushato) — il momento firma:** all'arrivo la "A" non esiste — una fontana coordinata ERUTTA dalla linea del mare reale (veli di spruzzi translucidi contro il sole) e si assembla nella lettera in ~5s (`initFountain`: spawn basso + velocità mirata alla home su 1.8s, overshoot 5-20% per la cresta; solver intatto). Il preloader copre ~2s → il visitatore vede l'acqua diventare un nome. La nascita suona UNA volta per load (i reform post-drain restano `initFromHomes`); l'eruzione emette `hero-splash` (+600ms) e i gabbiani si spaventano. Sequenza QA misurata: 0.9s veli / 1.9s cresta / 5.2s forma perfetta.

**RITAGLI DI CARTA (`b0c4104`, su main+pushato):** `TornEdge` — strappo di carta deterministico (SVG, hash-fract a precisione fissa, ombra di fibra) su TUTTE le cuciture fotografiche: FilmScrub top+bottom, strip Masua /about, e **banner editoriale nei case study** (still del progetto + parallax + strappi, gated su `work.textureSrc`). Il linguaggio: la carta si LACERA per rivelare le fotografie.

**SFONDI REALI (`160ee44`, su main+pushato) — Alberto: "troppo artificiale, dev'essere tutto realistico":** ① HERO = **loop fotografico di oceano al tramonto** dietro la "A" (`SeaBackdrop`: Kling 3.0 pro da still nano_banana con start_image==end_image → **loop nativo senza stacco**; poster-first, mobile 960, reduced=still; 1.6MB). Il pass sky procedurale è stato RIMOSSO (sky.wgsl cancellato, canvas di nuovo trasparente, SunRays/nubi CSS eliminati). ② /about = strip editoriale full-bleed del **DJI reale di Masua** con parallax + melt nella carta. ③ Contact = **notte vera** (Pan di Zucchero + Via Lattea, nano_banana): home in **blend screen sopra NightSky** (shader vivo, non distruttivo), closing /about come bg+overlay. ⚠ **IMMAGINI: da ora SOLO `soul_2`** (gratis per il piano di Alberto; nano_banana=2cr, kling pro 10s=17.5cr — saldo ~65). Ricetta loop: generare still → video con start=end frame → `loop` attribute.

**CIELO VIVO (`81d129e`) + ATMOSFERA /about (`77d0a0f`), su main+pushati:** ① lo sfondo hero non è più CSS statico — `render/sky.wgsl` dipinge nello STESSO canvas WebGPU il gemello ANIMATO della cubemap (stesso sole/palette → riflessi coerenti): nubi fbm in deriva, sole che respira, **mare sotto l'orizzonte con la colonna di glitter scintillante**; pipeline = sky pass opaco → fluido in blend premoltiplicato (`loadOp:'load'`); i layer CSS (SunRays/nubi) restano SOLO fallback no-WebGPU/reduced (CanvasHost li salta col fluido attivo); density fluido 0.30. ② /about: carta ACQUERELLO del Sulcis (Higgsfield, `public/coast/sulcis-map.webp`, multiply+mask) + `GoldenMotes` estratto condiviso. ⚠ **Lezione hydration**: il serializzatore SSR TRONCA i float negli style (~6 cifre) mentre il client li setta integrali → qualsiasi style numerico da hash va arrotondato a precisione fissa prima del render (fix in GoldenMotes, era latente anche sulla home). **URL prod: `portfolio-jet-eta-24.vercel.app`.**

**LA ROCCIA (`feeefee`, su main+pushato) — footage DRONE REALE su /about:** `FilmScrub` estratto come componente condiviso (CoastInterlude = wrapper); nuova banda tra bio e timeline con il **DJI Air 3S di Gianluca** (folder Drive "ALBE DRONE", 12 clip — ID estratti dalla pagina pubblica del folder; download via `drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`). ⚠ **Il footage è D-Log M**: pipeline `ffmpeg -vf "fps=24,scale=…,lut3d=_air3s.cube,colortemperature=6000:mix=0.35,scale=out_range=limited,format=yuv420p"` con la **LUT ufficiale DJI Air 3S** (in `_air3s.cube` alla root, untracked; URL nel commit). Il clip 0040 rivela la facciata scolpita PORTO FLAVIA·MCMXXIV — caption `dict.journey.film`. Restano 11 clip reali nel Drive per beat futuri.

**WORKS STILLS (`26bc7de`, su main+pushato) — il buco P0 chiuso:** 3 still editoriali generati con **Higgsfield** (nano_banana_pro, 6 crediti, G5 sbloccato da Alberto): mani nella luce dorata (badante24h), onde di voce ambra (doit), patchwork agricolo aereo (agri) — serie coerente coi token, WebP in `public/works/`. **Branch texture** implementato negli shader di ENTRAMBE le superfici works (cover-fit + duotone pull 0.14 verso il mood + placeholder 1px + fallback procedurale per i provisional). Regola pratica: still nuovi = 3:2, 1280w, `ffmpeg -c:v libwebp -quality 82`.

**LA COSTA (`783355d`, su main+pushato) — la banda video-scrub:** `CoastInterlude` tra Works e Tech — drone su Pan di Zucchero alla golden hour scrubbato dallo scroll (pin 260vh, seek con LERP sul ticker condiviso — mai currentTime diretto per evento; byte lazy via IO 900px ma layout dal primo paint = no CLS; caption `dict.coast` EN/IT; reduced-motion = still senza pin). **Il clip finisce SOTT'ACQUA nei raggi teal** — lo scroll esegue il dive del sito. Asset: re-encode scrub-friendly **keyint 6** dai master 4K (`public/video/` resta gitignored; i web-encode vivono in **`public/coast/`** tracked: 1600=8.5MB, 960=3.2MB mobile, poster 120KB; ffmpeg winget disponibile). + **dolly hero** (camera 72→56 col drain beat, camera-only WP-6) + **nubi in deriva** nel cielo hero (CSS 130s/170s). Alberto ha sbloccato anche **G5/Higgsfield** ("pieno controllo") — non speso: il footage reale bastava. Il dev server wedged (500 su /work/[slug], Jest worker) è stato riavviato — fix noto: kill+restart.

**Golden ambience (`cc2312e`, su main+pushato):** GOLDEN MOTES — 14 motes di polline dorato che salgono per la banda About (CSS puro, valori deterministici per indice = zero hydration mismatch, delay negativi, reduced-motion = polvere statica) + HORIZON GLINT — scintilla che corre lungo la hairline dell'orizzonte ogni ~9s (sibling della linea, non figlio: lo scaleX del draw la schiaccerebbe).

**LA RISALITA (`dae3da3`, su main+pushato) — la metà mancante del dive:** LA COSTA finiva sott'acqua e la pagina tornava carta senza spiegazione. Ora dopo il film c'è `AscentSurface` (230vh, sticky): resti sospeso nella luce subacquea REALE (**loop palindromo ritagliato dalla coda dello stesso girato** — `ascent-{1600,960}.mp4` + poster, framerate-blend 0.5x, `-g 120`, zero pixel generati = continuità perfetta), bolle deterministiche (pattern GoldenMotes), sole che fiorisce, e lo scroll esegue la risalita: la pagina scende come **waterline viva** (2 strisce d'onda in controderiva + orlo di schiuma, `.asc-wave-track`) e ROMPI la superficie — goccioline sulla carta (burst GSAP one-shot), "— and breathe." stampato sul foglio. **Ecosistema:** evento `submerge` → l'Escort svuota il cielo (i gabbiani non ti seguono sott'acqua); `surface-break` → lo stormo irrompe scompigliato e si rimette in V; MAREA si ovatta (`setSubmerged`: lowpass su pad+surf, profondità LFO scalate) e si riapre con swell alla rottura (`surfaceBreak`, guardato da `swellHold`). Copy `dict.ascent` EN/IT ("Trattieni il fiato / — e respira."); reduced = still onesto con la frase intera. `FilmScrub` ha ora `tearBottom` (niente strappo di carta tra le due acque) + gate reduced hydration-safe. **Review avversariale 5 lenti × 3 confutatori (62 agenti): 16 finding confermati, tutti fixati** — i CRITICI: ① `reduced && useHydrated()` = hook condizionale (crash al flip reduced-motion runtime — mai short-circuitare un hook col reduced dello store, che è VIVO via Smooth.tsx); ② `useGSAP` deps `[reduced,src]` senza `revertOnUpdate` = trigger DUPLICATI al src-attach (il doppio `surface-break` visto in QA era questo, misurato 2→1); ③ timeline scrub senza duration piena = soglie onUpdate in p-space disallineate dalle position dei tween (pad a duration 1 con tween vuoto); ④ `lastP` sentinel -1 (niente break fantasma su scroll ripristinato); ⑤ play/pause video keyed alla VISIBILITÀ (IO), non alla finestra di pin; ⑥ scrim di profondità AA dietro la caption; ⑦ WebAudio: le profondità LFO vanno scalate con l'immersione o base−LFO va sotto zero (surf in controfase / filtro a 0 Hz). QA probe `_ascent_qa.mjs` (desktop/mobile/reduced, console pulita, seam/deep/rise/break/covered/exit visti a occhio).

**IL RIFLUSSO (`21fffd3`, su main+pushato) — il bookend:** il sito nasce dall'acqua e ora ci FINISCE: al fondo assoluto della pagina (footer, banda night) un corpo d'acqua scura lambisce l'orlo — 2 creste in controderiva (linguaggio waterline della Risalita, geometria estratta in **`src/lib/wave.ts`**, byte-identical, condivisa da entrambe le bande), schiuma illuminata dalla luna, glints stellari, respiro di marea 9s. Al fondo pagina il mare sale a incontrarti: lift one-shot + swell MAREA + evento **`tide-touch`** (hook ecosistema, cooldown con grace 800ms al load). Decorativo aria-hidden; reduced GESTITO SOLO IN CSS (media guards: acqua ferma, glints fissi) = zero branch a render = zero superficie hydration. **Anti-cucitura by construction**: clip statico `overflow-hidden` incollato all'orlo pagina + layer interno sbordato 24px — respiro (-6px) e lift (-10px) non staccano MAI il bordo inferiore (finding della mini-review avversariale, fixato; anche il baseline del cooldown). QA `_tide_qa.mjs`: tide-touch 1/1/0 (desktop/mobile/reduced), console pulita.

**IL CIELO RISPONDE (`e424235`, su main+pushato):** `tide-touch` → la costellazione "A" DIVAMPA (uniform `uFlare` in NightSky: stelle +145%, linee accese, respiro dorato attorno alla lettera gated su `uConst`; decadimento esponenziale ~1.5s nel loop esistente; reduced = nessun listener). Il cerchio dell'ecosistema si chiude: mare→cielo. QA `_flare_qa.mjs` (before/peak/settled visti a occhio, console pulita).

**WP-10 RISOLTO SENZA INTERVENTO (misura 2026-07-15):** Lighthouse mobile prod = **84** (era 77 il 13/07 — i lavori successivi l'hanno risanato). FCP 1.2s · LCP 3.1s (hero line, render delay 2.2s) · TBT 230ms · CLS 0 · SI 6.0s (debole ma inerente al preloader — toccarlo = rischio estetico per pochi punti; lasciato). Budget CLAUDE.md ≥80 ✅. Report: scratchpad `lh-mobile-before.json` della sessione.

**Pendenze:** 🔵 far VEDERE ad Alberto rest/splash/drain + raggi/gabbiani/motes + LA RISALITA + IL RIFLUSSO + flare costellazione a schermo (feel fine con leva — finestra Chrome in primo piano!).

### ▶ PROSSIMI ROUND — candidati valutati (sessione 2026-07-15, in ordine di wow-per-rischio)
1. **IL MENU-PORTALE** — promuovere il MenuOverlay (oggi mobile-only, già ottimo: curtain+SplitText+focus trap) anche su **desktop** (trigger "Menu" nella pill, ADDITIVO — i link pill restano) con **anteprime fotografiche per rotta** al hover (still del mare/Masua/works/notte, strappo TornEdge, parallax). Superficie che ogni giurato apre per prima; asset già tutti in `public/`. Rischio: taste-call sull'IA desktop → prototipa e gate spietato.
2. **CASE STUDY VIVI** — le pagine più asciutte del sito: interludi fotografici tra le sezioni PARC (still + TornEdge + parallax), stack "vivo", eventualmente loop kling per progetto (G5, ~17.5cr/10s — preflight `get_cost`; still soul_2 = gratis).
3. **BEAT DRONE NUOVI** — restano **11 clip reali** nel Drive "ALBE DRONE" (ID dall'HTML pubblico del folder, LUT `_air3s.cube` OBBLIGATORIA, pipeline in §LA ROCCIA). Candidati: banda film su /work, secondo beat /about, o materiale per il menu-portale.
4. **WORKS GALLERY DoF** (PLAN P1) — pass bokeh/depth-of-field sul fly-through home (i ghost title a profondità ci sono già; manca la sfocatura fisica dei piani fuori fuoco).
5. **Ecosistema, estensioni**: nuovi listener per `tide-touch`/`surface-break`/`submerge` (sono eventi window già live); es. motes che reagiscono, marquee che rallenta sott'acqua.
6. 🔵 **Bloccati su Alberto**: contenuti SerSan ×2 (works provvisori), #4 Flip grid (confirm-feel), `NEXT_PUBLIC_SITE_URL` env su Vercel (OG/canonical assoluti), feel-review generale.
7. **Housekeeping**: `DESIGN-SYSTEM.md` ancora "Ocean v1" da archiviare; `docs/*` storici; cache Turbopack se il dev server dà 500 "Jest worker" (kill + `Remove-Item .next`).

**Stato QA/probe (untracked in root):** `_ascent_qa.mjs` (Risalita: desktop/mobile/reduced + surface-break), `_tide_qa.mjs` (Riflusso: tide-touch 1/1/0), `_flare_qa.mjs` (flare costellazione before/peak/settled), `_exitseam.mjs` (cucitura Risalita→Tech). Lighthouse mobile prod **84** (report nello scratchpad di sessione; rimisura: `npx lighthouse <prod> --only-categories=performance --form-factor=mobile`).

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
