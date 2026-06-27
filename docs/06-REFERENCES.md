# 06 — REFERENCES (riferimenti di qualita e ispirazione)

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence). Riconciliato dal loop docs-driven-build.

> Scopo: fissare i benchmark di livello, le tecniche-sorgente da replicare e le librerie da cui prendere SPUNTO per il portfolio di Alberto Tuveri, con la regola vincolante **studiare-non-copiare**. Questo file e una direttiva: ogni agente che produce UI, motion o 3D deve leggerlo prima di progettare, e mantenere coerenza con i token e l'art direction definiti in `docs/02-DESIGN.md`.

---

## 0. Come usare questo documento

Questo non e un elenco di link da copiare. E una mappa di **cosa guardare** e **perche**, perche il sito raggiunga la qualita di un Awwwards Site of the Day senza essere un clone di nessuno. Tre principi non negoziabili:

1. **Studiare-non-copiare.** Da ogni riferimento si estrae il PATTERN (il "perche funziona"), mai il markup, lo shader o il CSS letterale. Copia-incolla di componenti esterni rompe i token oceano e introduce dipendenze incoerenti.
2. **Coerenza con `docs/02-DESIGN.md`.** Ogni micro-interazione presa altrove va ri-vestita con i token canonici (vedi piu sotto). Se un riferimento usa colori/font/timing diversi, si tiene l'idea e si butta la pelle.
3. **Restraint > effetti.** I siti che vincono fanno POCHE cose, fatte perfette. Meglio una transizione di scena impeccabile che dieci gadget. Ogni effetto deve avere un motivo narrativo (vedi sitemap in `docs/00-PRD.md`).

I token a cui ricondurre tutto (sintesi da `docs/02-DESIGN.md`, fonte di verita la': non duplicare valori, qui solo per memoria operativa — palette "Cinematic Ocean / NatGeo", **gold rimosso**):

```
--color-abyss #07222e · --color-deep #0b2c3a · --color-foam #f4fafb
--color-ink #0b2731 · --color-ink-mute #5c7884 · --color-abyss-glow #0e5a6b
--color-celeste #9bd3ee (accento, in coppia con white) · --color-celeste-soft #c7e6f4
(--color-sun e alias di celeste; --color-gold e dead back-compat)
Display/serif "Fraunces" · Sans "Hanken Grotesk" (via next/font/google)
```

---

## 1. Benchmark di livello (il metro di giudizio)

### lusion.co — il riferimento primario
Quando si valuta se una scena e "abbastanza buona", la domanda e: *reggerebbe accanto a lusion.co?* Cosa guardare, in ordine di importanza:

- **Smooth scroll virtualizzato.** Lo scroll non muove il DOM in modo nativo: una libreria (per noi Lenis, vedi `docs/01-TECHSTACK.md` e `docs/03-ARCHITECTURE.md`) interpola la posizione e GUIDA le transizioni di scena. Risultato: inerzia continua, zero scatti, le scene reagiscono allo stesso valore di scroll del contenuto.
- **Transizioni di scena.** Non c'e mai un taglio secco tra sezioni: crossfade, curtain, zoom continui. L'utente non "cambia pagina", "attraversa" lo spazio. Studiare il TIMING (lungo, mai nervoso) e il fatto che lo sfondo persiste mentre l'overlay DOM cambia.
- **Qualita del 3D.** Materiali fisicamente plausibili, depth cinematografico, glint selettivo solo sui punti caldi, niente aliasing. Il 3D non e un widget incastonato: e l'ambiente.
- **Restraint.** Palette ristretta, tipografia grande e sicura, moltissimo spazio negativo, pochissimi elementi a schermo per volta. Imparare cosa NON c'e.

### Awwwards "Site of the Day" — il livello target
Sfogliare la categoria SOTD (e Honorable Mentions) come calibrazione continua. Cosa estrarre, non cosa imitare:
- **Preloader con intenzione** (percentuale, reveal coreografato) — noi: preloader con % e reveal, vedi motion language in `docs/02-DESIGN.md`.
- **Split-text reveal** su heading display, parallax leggero, magnetic hover sui CTA, cursore custom desktop opzionale.
- **Coerenza del sistema**: i siti premiati hanno UN linguaggio (un'idea, un colore-segnale, un tipo di motion) ripetuto ovunque. Per noi: ACQUA. Tutto deve leggersi come acqua.
- Criterio di auto-valutazione, per ogni sezione costruita: *Design / Usability / Creativity / Content*. Se una sezione non spinge almeno due di questi, e da rifare.

---

## 2. Il fluido hero di riferimento (il cuore tecnico)

> **Nota di stato (codice spedito).** L'hero NON e piu un sistema GPGPU a due strati di particelle (niente ParticleDissolve / AdditiveBlending corpo+pelle / `instancedArray` / `MeshSurfaceSampler`). Il cuore tecnico spedito e un **fluido MLS-MPM su griglia, raw-WebGPU**, vendorizzato da **matsuoka-601/WaterBall** in `src/webgl/waterball/*` (solver `mls-mpm/*.wgsl.ts` + `mls-mpm.ts`; chain di render `render/*.wgsl.ts` + `fluidRender.ts`). La "A" non viene caricata da un GLB a runtime: e riempita proceduralmente via `initFromHomes()` (3 tratti a capsula) e confinata sul proprio asse mediale. Spec completa in `docs/04-3D-HERO-WATER-LOGO.md`; fisica del solver in `docs/12-PARTICLE-PHYSICS.md`. I tutorial particellari qui sotto restano come **riferimento storico/estetico**, non come architettura attuale.

Il marchio hero e la lettera **"A"** (non "AT/A"). Cosa rende un fluido del genere di classe mondiale, e che dobbiamo continuare a perseguire nel feel:

- **Acqua viva, mai congelata.** Il solver tiene un fluido LIBERO che si auto-anima: dentro il "tubo" della A una forza `inflate` spinge verso fuori a riempire la sezione, mentre `gravity` + `restoreK` richiamano l'acqua all'asse mediale; l'incomprimibilita trasforma quella coppia in circolazione perpetua (il `g2p.wgsl` modifica la VELOCITA, non la posizione). E il dettaglio che fa la differenza tra "particelle" e "acqua viva".
- **Splash gated dalla velocita.** Un poke veloce del mouse arriva dalla griglia, supera lo `speedGate` e apre il confinamento (`leashRadius`) cosi lo spruzzo esce dal modello; l'acqua lenta/lontana viene riavvolta verso la A (la risacca/undertow). I valori sono **live-tuned via leva, soggetti a sign-off GATE-6** (vedi `docs/04` e `docs/12`).
- **Render Screen-Space-Fluid (SSF).** La superficie d'acqua nasce dalla chain `sphere -> depth -> bilateral -> thickness -> gaussian -> fluid`, con reflect/refract da cubemap e composizione premultiplied SOPRA la `VideoBackdrop`. Per il look "premiato" il punto e qui: profondita/spessore -> Beer-Lambert teal, fresnel sul bordo, glint sui colmi. Tecniche-sorgente del look in sezione 5; benchmark di shading in `matsuoka-601/Splash`.

> **openQuestion (Bloom/DOF).** La pipeline spedita e SSF raw-WebGPU: `postprocessing` + `@react-three/postprocessing` sono installati ma **UNUSED** e non c'e un EffectComposer attivo. Un eventuale "bloom selettivo sulla schiuma" o "DOF locale all'hero" andrebbe ottenuto dentro la chain SSF (es. boost di luminosita gated dalla velocita nel `fluid.wgsl`), NON tramite un postprocessing R3F. Da confermare con Alberto a GATE-6 se serve davvero o se il glint SSF basta.

Link tecnici da citare/studiare come **riferimento storico/estetico** (NON copiare gli shader; molti sono su GPGPU a particelle WebGL2 — utili per estetica e flow-field, non per l'architettura MLS-MPM attuale):

- **Three.js Journey — GPGPU Flow Field Particles.** Base canonica del ping-pong FBO e del flow-field con curl noise. Storico: utile per capire il moto a riposo, non implementato cosi nell'hero.
- **Three.js Journey — Particles Morphing Shader.** Morphing fluido tra set di posizioni; spunto estetico per reveal/transizioni di stato.
- **Codrops — "Crafting a Dreamy Particle Effect with Three.js and GPGPU".** Look etereo, soft, additivo: vicino allo spray luminoso desiderato.
- **Codrops — "Dissolve Effect with Shaders and Particles".** Dissoluzione/ricomposizione: spunto estetico per esplosione/rientro.
- **matsuoka-601/WaterBall** (repo sorgente vendorizzato). E la base reale del solver hero: MLS-MPM su griglia + chain SSF. Studiare la struttura del solver e l'ordine dei pass.
- **matsuoka-601/Splash** (benchmark di shading). Da qui si ruba SOLO il look dell'acqua SSF (env/Beer-Lambert/fresnel/glint), non la sim. Vedi `docs/04`.
- **Lusion — "Surface Floater".** SDF + curl noise + velocity-driven color: l'estetica del moto a riposo (moto ondoso) che vogliamo leggere sull'acqua.
- **Lusion — Awwwards case study.** Per capire le scelte di restraint, performance e direzione artistica dietro a quelle scene.

Regola sul backend: l'hero spedito e **raw WebGPU compute (WGSL), WebGPU-only** (guard `navigator.gpu` -> ritorna null; il fallback NON e WebGL2 ma il gradiente "sea" CSS in `CanvasHost`). Loop RAF proprio + `IntersectionObserver` per idle. Dettaglio e detection in `docs/04-3D-HERO-WATER-LOGO.md`.

---

## 3. Librerie di componenti/effetti — da cui prendere SPUNTO (mai copia-incolla)

Queste librerie sono **cataloghi di idee** per micro-interazioni e pattern, non dipendenze da installare. Regola ferrea: si guarda l'idea, si ri-costruisce con i nostri token, le nostre librerie (GSAP / CSS, e WGSL dove serve) e la nostra tipografia. Mai incollare il loro JSX/CSS: porterebbe palette, font e timing estranei che rompono il sistema oceano (`docs/02-DESIGN.md`).

| Fonte | Cosa rubare (come pattern) | Cosa NON portare mai |
|---|---|---|
| **magicui.design** | Marquee, animated beam, text reveal, number ticker, border-beam | Colori/gradienti default, shadcn theming estraneo |
| **uiverse.io** | Micro-interazioni su button/toggle/card, idee di hover | CSS letterale, palette, ombre fuori-token |
| **ui-layout.com** | Strutture di sezione, scroll-snap, sticky reveal | Spacing scale e font non nostri |
| **aceternity.com (Aceternity UI)** | Spotlight, parallax cards, sticky scroll reveal, background gradients | Tailwind class soup pre-fatta, gradienti viola/indaco tipici |
| **reactbits.dev** | Effetti testo (decrypt, shuffle), backgrounds animati, hook di interazione | Implementazioni canvas pesanti non ottimizzate, colori default |

Checklist di adozione di QUALSIASI pattern esterno:

```
[ ] Il pattern serve la narrativa di una sezione (S1-S6 in docs/00-PRD.md)? Se no, scartare.
[ ] Ri-vestito con i token canonici (colori, font, radius, timing)?
[ ] Implementato con le NOSTRE librerie (GSAP / CSS, e WGSL dove serve), non con dipendenze nuove?
[ ] Rispetta prefers-reduced-motion e il budget perf (60fps desktop, Lighthouse mobile >= 80)?
[ ] Accessibile (focus state, contrasto AA, decorativo => aria-hidden)?
[ ] Niente stringhe/markup copiati 1:1 dalla fonte?
```

Per generare/adattare questi pattern usare le skill di catalogo (vedi routing in `docs/10-SKILLS.md`): `magic-ui-generator`, `magic-animator`, `react-ui-patterns`, `tailwind-patterns`, `frontend-design`, `high-end-visual-design`, sempre filtrate dai token di `docs/02-DESIGN.md`.

---

## 4. Riferimenti scroll-storytelling e frame-sequence

> **Nota di stato (codice spedito).** La cinematica e gia costruita ed e **FUSA nell'hero** (`src/components/sections/hero.tsx`, timeline GSAP sticky ~600vh). Non e un `<video>` scrubbato ne un overlay WebGL: e una **WebP frame-sequence** — `public/frames/f_000..f_135.webp` (136 frame) disegnata su un canvas 2D in `src/components/video-backdrop.tsx`, indicizzata da `heroStore.video` (preload concurrency 6, DPR clamp 1.5). `reduced-motion` congela un frame a meta sequenza (~0.5). NON esiste piu una sezione S3 separata, ne lo zoom-into-clip, ne il VideoPlane WebGL; `cinematic-placeholder.tsx` e stato eliminato. Spec in `docs/05-CINEMATIC-SCROLL.md`.

Per il motion scroll-driven e per il polish della frame-sequence, lo stato dell'arte da studiare:

- **Apple product pages (image-sequence on scroll).** Il benchmark diretto del nostro approccio: una sequenza di frame indicizzata dallo scroll progress, fluida perche i frame sono pre-decodati. Studiare il decode progressivo / preload a finestra e la gestione del DPR. E il modello del nostro `video-backdrop.tsx`.
- **GSAP ScrollTrigger — showcase e demo ufficiali.** Riferimento per pin, scrub, snap, e per il `scrub` legato a una timeline. Per noi lo scroll lo guida Lenis (via `ScrollProvider` + `gsap.ticker`) e GSAP ci si aggancia (UN solo requestAnimationFrame, vedi `docs/03-ARCHITECTURE.md`).
- **Lenis — esempi ufficiali (darkroom.engineering).** Smooth scroll virtualizzato fatto bene; come sincronizzare l'inerzia con il rendering.
- **Codrops — articoli "scroll animation" / "image sequence on scroll".** Tecniche concrete per legare l'indice di frame allo scroll progress (il pattern che usiamo). La variante `<video>` `currentTime` resta solo come path secondario di studio.
- **Awwwards "scrollytelling" / "WebGL" collections.** Per il livello di transizione e il color grade della sequenza descritti in `docs/05-CINEMATIC-SCROLL.md`.

Nota su asset e sorgenti: i frame WebP sono l'asset spedito. Le clip **Higgsfield** raw (`public/video/hf_20260624_*.mp4`, backflip di Alberto a Pan di Zucchero) sono **SOURCE-ONLY e untracked**: servono a estrarre/encodare la frame-sequence (skill `remotion`/`remotion-best-practices`), non vanno servite a runtime. Un `<video>` con poster + lazy-load + fallback statico resta come **path secondario** documentato (reduced-motion / device deboli), ma quello attivo e la frame-sequence. Dettagli e budget in `docs/05-CINEMATIC-SCROLL.md`.

---

## 5. Riferimenti per acqua / onde (citare tecniche, non per forza URL)

L'obiettivo non e un classico `Water` da oceano infinito, ma una superficie SSF che legga come acqua. Tecniche da studiare e adattare nel `fluid.wgsl` (vedi `docs/04`):

- **Profondita/spessore -> tinta.** Mappare lo spessore (thickness pass) su un assorbimento Beer-Lambert verso il teal: piu spesso = piu scuro/saturo, piu sottile = piu chiaro. E il cuore del look see-through translucent teal. Riferimento concettuale: i depth/thickness-fade dei water shader SSF (es. `matsuoka-601/Splash`).
- **Fresnel sul bordo.** Edge-glow fresnel sul bordo della "A" per la sensazione di superficie bagnata. Studiare il termine `pow(1 - dot(N,V), p)` e applicarlo come boost di luminosita/reflect sul bordo.
- **Reflect + refract da cubemap.** L'ambiente si specchia e rifrange nell'acqua via cubemap (`public/cubemap`). Studiare il blend fresnel-pesato tra raggio riflesso e rifratto.
- **Schiuma / glint.** Highlight dove la velocita supera una soglia (smoothstep su `length(vel)` proveniente dal solver), come glint sui colmi. Allineato al color-by-velocity descritto in `docs/04`.
- **Moto ondoso a riposo.** NON serve un campo curl-noise separato: il moto continuo a riposo viene **dal solver MLS-MPM stesso** (la coppia `inflate`/`gravity` che genera circolazione perpetua, vedi sezione 2 e `g2p.wgsl`). E la risacca che non si ferma mai, ancorata alla sim, non a un noise esterno.

> **openQuestion.** Il vecchio pointer `src/webgl/curves/curlNoise` per il moto a riposo NON esiste/NON e usato nell'hero spedito: il moto a riposo e ri-ancorato al solver MLS-MPM. Caustiche animate restano un'aggiunta opzionale da valutare a GATE-6, non presente in codice.

Per implementare/comprendere questi shader, attivare le skill 3D pertinenti (routing in `docs/10-SKILLS.md`): `threejs-shaders`, `threejs-materials`, `threejs-postprocessing`, `shader-programming-glsl` (adattando i concetti a WGSL/WebGPU). La pipeline di asset (cubemap, frame-sequence) e descritta in `docs/04-3D-HERO-WATER-LOGO.md` e `docs/05-CINEMATIC-SCROLL.md`.

---

## 6. Regola d'uso finale (vincolante)

```
STUDIARE, NON COPIARE.
  - Da ogni riferimento si estrae il PERCHE, non il COSA letterale.
  - Tutto viene ri-vestito coi token di docs/02-DESIGN.md.
  - Niente dipendenze nuove per un effetto: usare GSAP / CSS / WGSL gia in stack.
  - Nessun frammento di codice/markup/CSS incollato 1:1 da una fonte esterna.
  - Se un pattern non serve la narrativa (docs/00-PRD.md), non entra nel sito.
  - Restraint: meno effetti, fatti perfetti. Il metro e lusion.co / Awwwards SOTD.
```

Catena di coerenza da rispettare quando si applica un riferimento:
`docs/06-REFERENCES.md (idea)` -> `docs/02-DESIGN.md (token & art direction)` -> `docs/03-ARCHITECTURE.md (dove vive nel codice)` -> file di scena/effetto specifico (`docs/04-3D-HERO-WATER-LOGO.md`, `docs/05-CINEMATIC-SCROLL.md`, `docs/12-PARTICLE-PHYSICS.md`). Le regole d'oro generali e i gate di qualita stanno in `CLAUDE.md` e `docs/11-WORKFLOW.md`.
