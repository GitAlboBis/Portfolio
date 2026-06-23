# 06 — REFERENCES (riferimenti di qualita e ispirazione)

> Scopo: fissare i benchmark di livello, le tecniche-sorgente da replicare e le librerie da cui prendere SPUNTO per il portfolio di Alberto Tuveri, con la regola vincolante **studiare-non-copiare**. Questo file e una direttiva: ogni agente che produce UI, motion o 3D deve leggerlo prima di progettare, e mantenere coerenza con i token e l'art direction definiti in `docs/02-DESIGN.md`.

---

## 0. Come usare questo documento

Questo non e un elenco di link da copiare. E una mappa di **cosa guardare** e **perche**, perche il sito raggiunga la qualita di un Awwwards Site of the Day senza essere un clone di nessuno. Tre principi non negoziabili:

1. **Studiare-non-copiare.** Da ogni riferimento si estrae il PATTERN (il "perche funziona"), mai il markup, lo shader o il CSS letterale. Copia-incolla di componenti esterni rompe i token oceano e introduce dipendenze incoerenti.
2. **Coerenza con `docs/02-DESIGN.md`.** Ogni micro-interazione presa altrove va ri-vestita con i token canonici (vedi piu sotto). Se un riferimento usa colori/font/timing diversi, si tiene l'idea e si butta la pelle.
3. **Restraint > effetti.** I siti che vincono fanno POCHE cose, fatte perfette. Meglio una transizione di scena impeccabile che dieci gadget. Ogni effetto deve avere un motivo narrativo (vedi sitemap in `docs/00-PRD.md`).

I token a cui ricondurre tutto (sintesi da `docs/02-DESIGN.md`, fonte di verita la': non duplicare valori, qui solo per memoria operativa):

```
--abyss #05131A · --deep #0A2430 · --surface-elev #103240
--foam #EAF6F6 · --ink-mute #88A2A8 · --rule rgba(234,246,246,0.10)
--aqua #1FC8C8 · --aqua-hot #7DF9FF · --abyss-glow #0E5A6B · --gold #FFC27A
COL_COLD [0.06, 0.30, 0.34] · COL_HOT [0.75, 0.98, 1.0]
Display "Editorial New" · Body "Switzer" · Mono "JetBrains Mono"
```

---

## 1. Benchmark di livello (il metro di giudizio)

### lusion.co — il riferimento primario
Quando si valuta se una scena e "abbastanza buona", la domanda e: *reggerebbe accanto a lusion.co?* Cosa guardare, in ordine di importanza:

- **Smooth scroll virtualizzato.** Lo scroll non muove il DOM in modo nativo: una libreria (per noi Lenis, vedi `docs/01-TECHSTACK.md` e `docs/03-ARCHITECTURE.md`) interpola la posizione e GUIDA le transizioni di scena. Risultato: inerzia continua, zero scatti, le scene 3D reagiscono allo stesso valore di scroll del contenuto.
- **Transizioni di scena.** Non c'e mai un taglio secco tra sezioni: crossfade, curtain, zoom continui. L'utente non "cambia pagina", "attraversa" lo spazio. Studiare il TIMING (lungo, mai nervoso) e il fatto che il 3D persiste mentre l'overlay DOM cambia.
- **Qualita del 3D.** Materiali fisicamente plausibili, depth of field cinematografico, bloom selettivo solo sui punti caldi, niente aliasing. Il 3D non e un widget incastonato: e l'ambiente.
- **Restraint.** Palette ristretta, tipografia grande e sicura, moltissimo spazio negativo, pochissimi elementi a schermo per volta. Imparare cosa NON c'e.

### Awwwards "Site of the Day" — il livello target
Sfogliare la categoria SOTD (e Honorable Mentions) come calibrazione continua. Cosa estrarre, non cosa imitare:
- **Preloader con intenzione** (percentuale, reveal coreografato) — noi: preloader con % e reveal, vedi motion language in `docs/02-DESIGN.md`.
- **Split-text reveal** su heading display, parallax leggero, magnetic hover sui CTA, cursore custom desktop opzionale.
- **Coerenza del sistema**: i siti premiati hanno UN linguaggio (un'idea, un colore-segnale, un tipo di motion) ripetuto ovunque. Per noi: ACQUA. Tutto deve leggersi come acqua.
- Criterio di auto-valutazione, per ogni sezione costruita: *Design / Usability / Creativity / Content*. Se una sezione non spinge almeno due di questi, e da rifare.

---

## 2. L'effetto particellare di riferimento (il cuore tecnico)

Il logo hero di Alberto (AT/A in particelle d'acqua) replica l'architettura del **ParticleDissolve di Sersan**, a sua volta ispirato al **footer particellare di Lusion (DDD)**. Specifica fisica/render completa in `docs/04-3D-HERO-WATER-LOGO.md`; qui i riferimenti di studio e il *perche* dell'architettura.

Cosa rende quell'effetto di classe mondiale, e che dobbiamo replicare:

- **Due strati, corpo + pelle.** Il CORPO (denso, opaco, NormalBlending, molla alta, quasi fermo) e la massa solida; la PELLE (offset lungo la normale, AdditiveBlending, molla bassa under-damped) e lo strato protagonista che schizza e rientra. Render order: prima il corpo (scrive depth), poi la pelle additiva.
- **Momentum / risacca.** Il feel under-damped (zeta ~0.35-0.4 sulla pelle) fa partire le particelle lontano e rientrare lente: per noi questo legge esattamente come una risacca marina. E il dettaglio che fa la differenza tra "particelle" e "acqua viva".
- **DOF + Bloom selettivo.** Bloom HDR solo sulle particelle veloci/calde (la schiuma), depth of field locale all'hero per il look cinematografico.

Link tecnici da citare/studiare (NON copiare gli shader; capire la struttura GPGPU e ri-derivarla coi nostri token e col backend WebGPU/TSL descritto in `docs/04-3D-HERO-WATER-LOGO.md`):

- **Three.js Journey — GPGPU Flow Field Particles.** Base canonica del ping-pong FBO su WebGL2 e del flow-field con curl noise. E il riferimento per il fallback GLSL.
- **Three.js Journey — Particles Morphing Shader.** Morphing fluido tra set di posizioni; utile per il reveal del logo e per le transizioni di stato.
- **Codrops — "Crafting a Dreamy Particle Effect with Three.js and GPGPU".** Look eteree, soft, additivo: vicino al nostro spray luminoso.
- **Codrops — "Dissolve Effect with Shaders and Particles".** La dissoluzione/ricomposizione che ispira il comportamento corpo->pelle.
- **Codrops — "Surface Sampling in Three.js".** MeshSurfaceSampler: come distribuire punti sulla superficie del GLB (front-biased) — base del nostro sampling delle posizioni "home".
- **Codrops — "WebGPU Gommage Effect (TSL dissolve)".** Riferimento TSL/WebGPU-native: come scrivere l'effetto con compute + storage buffer invece del ping-pong FBO. Allinea al nostro backend WebGPU.
- **Wawa Sensei — "GPGPU particles with TSL & WebGPU".** Walkthrough pratico di `instancedArray` pos/vel/home, `Fn().compute()`, lettura `positionBuffer.element(instanceIndex)` nel vertex stage. E il riferimento operativo per il path WebGPU.
- **Lusion — "Surface Floater".** SDF + curl noise + velocity-driven color: l'estetica del moto a riposo (moto ondoso) che vogliamo sulla pelle.
- **Lusion — Awwwards case study.** Per capire le scelte di restraint, performance e direzione artistica dietro a quelle scene.

Regola sul backend: studiare i tutorial WebGL2/GLSL per la *fisica e l'estetica*, ma l'implementazione di default e **WebGPU + compute shader via TSL** (niente ping-pong FBO nel vertex stage). Dettaglio e detection del backend in `docs/04-3D-HERO-WATER-LOGO.md`.

---

## 3. Librerie di componenti/effetti — da cui prendere SPUNTO (mai copia-incolla)

Queste librerie sono **cataloghi di idee** per micro-interazioni e pattern, non dipendenze da installare. Regola ferrea: si guarda l'idea, si ri-costruisce con i nostri token, le nostre librerie (GSAP / R3F / TSL, e CSS) e la nostra tipografia. Mai incollare il loro JSX/CSS: porterebbe palette, font e timing estranei che rompono il sistema oceano (`docs/02-DESIGN.md`).

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
[ ] Implementato con le NOSTRE librerie (GSAP / R3F / TSL, e CSS), non con dipendenze nuove?
[ ] Rispetta prefers-reduced-motion e il budget perf (60fps desktop, Lighthouse mobile >= 80)?
[ ] Accessibile (focus state, contrasto AA, decorativo => aria-hidden)?
[ ] Niente stringhe/markup copiati 1:1 dalla fonte?
```

Per generare/adattare questi pattern usare le skill di catalogo (vedi routing in `docs/10-SKILLS.md`): `magic-ui-generator`, `magic-animator`, `react-ui-patterns`, `tailwind-patterns`, `frontend-design`, `high-end-visual-design`, sempre filtrate dai token di `docs/02-DESIGN.md`.

---

## 4. Riferimenti scroll-storytelling e video-scrub

Per la cinematica (S3: Pan di Zucchero + backflip Higgsfield, dettaglio in `docs/05-CINEMATIC-SCROLL.md`) e per il motion scroll-driven in generale, lo stato dell'arte da studiare:

- **GSAP ScrollTrigger — showcase e demo ufficiali.** Riferimento per pin, scrub, snap, e per il `scrub` legato a una timeline. Per noi lo scroll lo guida Lenis e ScrollTrigger ci si aggancia (UN solo requestAnimationFrame, vedi `docs/03-ARCHITECTURE.md`).
- **Lenis — esempi ufficiali (darkroom.engineering).** Smooth scroll virtualizzato fatto bene; come sincronizzare l'inerzia con il rendering.
- **Apple product pages (scroll-scrubbed video / sequenze frame).** Il benchmark del video-scrub: una clip scrubbata frame-by-frame dallo scroll, con poster e fallback. Studiare il decode progressivo e il fatto che lo scrub e fluido perche i frame sono pre-decodati. Per asset pesanti valutare frame-sequence (skill `remotion`/`remotion-best-practices` per esportare/encodare, vedi `docs/10-SKILLS.md`).
- **Codrops — articoli "scroll animation" / "image sequence on scroll".** Tecniche concrete per legare currentTime di un `<video>` o l'indice di frame allo scroll progress.
- **Awwwards "scrollytelling" / "WebGL" collections.** Per il livello di transizione-zoom dentro la clip e gli overlay WebGL (DOF, color grade, particelle) descritti in `docs/05-CINEMATIC-SCROLL.md`.

Nota tecnica vincolante: il video DEVE avere poster, lazy-load, e fallback statico se lo scrub non regge (reduced-motion o GPU debole). Niente autoplay rumoroso. Dettagli e budget in `docs/05-CINEMATIC-SCROLL.md`.

---

## 5. Riferimenti per acqua / onde in Three.js (citare tecniche, non per forza URL)

L'obiettivo non e un classico `Water` da oceano infinito, ma un MATERIALE che legga come acqua sulle particelle e sugli overlay. Tecniche da studiare e adattare ai nostri `COL_COLD`/`COL_HOT`:

- **Gradiente profondita -> superficie.** Mappare la "profondita" (o la velocita della particella) su un gradiente `deep teal -> foam white`. E il cuore del look: COL_COLD a riposo (profondita), COL_HOT in moto (schiuma). Riferimento concettuale: i classici depth-fade dei water shader (es. il pattern di three.js `Water`/`Water2` e gli esempi Codrops sui water shader).
- **Fresnel sul bordo.** Micro-rifrazione/edge-glow fresnel sul bordo delle lettere AT/A per dare la sensazione di superficie d'acqua bagnata. Studiare il termine fresnel `pow(1 - dot(N,V), p)` e applicarlo come boost di luminosita/alpha sul bordo.
- **Caustiche (accenni).** Pattern di caustiche animate (voronoi/curl) per micro-dettaglio luminoso sul corpo. Riferimento: tecniche caustics di Codrops / shadertoy (studiare il pattern, ri-derivare in TSL/GLSL, non incollare).
- **Schiuma / foam.** Foam dove la velocita supera una soglia (smoothstep su `length(vel)`), con bloom selettivo. Allineato al color-by-velocity gia descritto in `docs/04-3D-HERO-WATER-LOGO.md`.
- **Moto ondoso a riposo.** Flusso lungo la normale guidato da **curl noise** (vedi `src/webgl/curves/curlNoise` in `docs/03-ARCHITECTURE.md`) per dare moto continuo anche senza interazione del mouse — la risacca che non si ferma mai.

Per implementare/comprendere questi shader, attivare le skill 3D pertinenti (routing in `docs/10-SKILLS.md`): `threejs-shaders`, `threejs-materials`, `threejs-postprocessing`, `shader-programming-glsl`. La pipeline di asset (GLB del logo, HDRI) e descritta in `docs/04-3D-HERO-WATER-LOGO.md` e `docs/09-MCP.md` (Blender MCP).

---

## 6. Regola d'uso finale (vincolante)

```
STUDIARE, NON COPIARE.
  - Da ogni riferimento si estrae il PERCHE, non il COSA letterale.
  - Tutto viene ri-vestito coi token di docs/02-DESIGN.md.
  - Niente dipendenze nuove per un effetto: usare GSAP / R3F / TSL (e CSS) gia in stack.
  - Nessun frammento di codice/markup/CSS incollato 1:1 da una fonte esterna.
  - Se un pattern non serve la narrativa (docs/00-PRD.md), non entra nel sito.
  - Restraint: meno effetti, fatti perfetti. Il metro e lusion.co / Awwwards SOTD.
```

Catena di coerenza da rispettare quando si applica un riferimento:
`docs/06-REFERENCES.md (idea)` -> `docs/02-DESIGN.md (token & art direction)` -> `docs/03-ARCHITECTURE.md (dove vive nel codice)` -> file di scena/effetto specifico (`docs/04-3D-HERO-WATER-LOGO.md`, `docs/05-CINEMATIC-SCROLL.md`). Le regole d'oro generali e i gate di qualita stanno in `CLAUDE.md` e `docs/11-WORKFLOW.md`.
