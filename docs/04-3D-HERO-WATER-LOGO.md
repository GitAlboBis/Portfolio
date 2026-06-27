# 04 — 3D Hero Water Logo (MLS-MPM WebGPU fluid "A")

> Aggiornato 2026-06-27 per riflettere il codice (hero MLS-MPM WebGPU + cinematica frame-sequence). Riconciliato dal loop docs-driven-build.

> Scopo: direttive operative per la Hero (S1) come **fluido vivo a griglia MLS-MPM** che disegna e tiene in forma la lettera **"A"**, reso in **Screen-Space-Fluid** su **WebGPU raw** (non R3F, non particelle GPGPU a due strati). L'impianto è vendorizzato da `matsuoka-601/WaterBall` (i loro `.ts` + `.wgsl` esatti) sotto `src/webgl/waterball/`, riadattato al monogramma "A" e composto **sopra** la cinematica `VideoBackdrop`. Stack e versioni in [`docs/01-TECHSTACK.md`](./01-TECHSTACK.md); token e colori in [`docs/02-DESIGN.md`](./02-DESIGN.md); montaggio runtime in [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md); fisica del solver in [`docs/12-PARTICLE-PHYSICS.md`](./12-PARTICLE-PHYSICS.md).

---

## 0. Cosa è cambiato (nota di riconciliazione)

La spec storica descriveva un logo "AT/A" a **particelle GPGPU a due strati** (`body` + `skin`), campionate da `at-mark.glb` con `MeshSurfaceSampler`, con doppio backend WebGPU-TSL / WebGL2-FBO, molla per-particella (`zeta`), point-sprite colorati per velocità e Bloom/DOF. **Quel design non è ciò che è stato spedito.**

La realtà spedita (branch `feat/hero-scroll-narrative`) è:

- La marca è **"A"** (non "AT/A").
- È un **fluido MLS-MPM a griglia** (Material Point Method) renderizzato in **Screen-Space-Fluid**, vendorizzato da `matsuoka-601/WaterBall`. Niente particelle a due strati, niente molla per-particella, niente Bloom/DOF.
- **Nessun GLB caricato a runtime**: la "A" è riempita **proceduralmente** via `initFromHomes()` (3 tratti capsulari). `a-mark.glb` / `a-liquid.glb` esistono ma non vengono caricati.
- Backend **solo WebGPU**: guard `navigator.gpu` → se assente il componente ritorna `null` e il fallback è il **gradiente mare CSS** in `CanvasHost`. **Non** c'è un percorso WebGL2.
- Non gira nel Canvas R3F persistente: ha un **proprio loop RAF** + `IntersectionObserver` per andare idle fuori vista.

Le sezioni che seguono descrivono questo impianto. Tutti i numeri di tuning sono **valori live-tuned via leva, soggetti a sign-off GATE-6**: non trattarli come finali.

---

## 1. Obiettivo e riferimento

La "A" della Hero non è una mesh né una nuvola di punti pinnati: è una **massa d'acqua che circola in continuazione** confinata dentro la sagoma della lettera. A riposo "ribolle" da sola (churn perpetuo, come la sfera confinata originale di WaterBall); al passaggio veloce del puntatore una porzione **schizza fuori** dalla sagoma e viene poi **riportata a casa** lentamente (undertow / risacca). Scorrendo, un beat di **explode** la fa esplodere e svanire in ~1s, e risalendo si ricompone.

Riferimento estetico e tecnico: **`matsuoka-601/WaterBall`** (Splash SSF: env cubemap reflect/refract, Beer-Lambert, fresnel). Vedi anche [`docs/06-REFERENCES.md`](./06-REFERENCES.md). Studiare, non reinventare: il solver e la catena di render sono una copia fedele (`@ts-nocheck`, "do not lint"); l'unico lavoro nostro è il **confinement sulla "A"**, il **fill procedurale**, l'**embed React** e la **composizione sopra il video**.

---

## 2. Inventario file (cosa esiste davvero)

Tutto sotto `src/webgl/waterball/` (vendor) + il montaggio in `CanvasHost`.

| File | Ruolo |
|---|---|
| `src/webgl/waterball/WaterBallHero.tsx` | Componente client React. Re-implementa il `main()` del demo: canvas ref, init async abortabile (StrictMode-safe), loop RAF cancelabile, teardown GPU completo su unmount. Guard `navigator.gpu`, `IntersectionObserver` idle, pannelli `leva` `splash` + `camera`, entry GSAP focus-pull + camera sway, lettura `heroStore`. |
| `src/webgl/waterball/camera.ts` | Camera con orbit/zoom **disabilitati** (la pagina deve scrollare); resta solo il poke del cursore + lo sway. Round-trip coordinate mouse. |
| `src/webgl/waterball/common.ts` | `numParticlesMax`, `renderUniformsViews` / `renderUniformsValues` (uniform buffer di render condiviso). |
| `src/webgl/waterball/mls-mpm/mls-mpm.ts` | `MLSMPMSimulator`: pipeline compute, buffer, `reset()`, `initFromHomes()` (fill "A"), `execute()` (step del solver). |
| `src/webgl/waterball/mls-mpm/*.wgsl.ts` | Gli step del solver MLS-MPM come stringhe WGSL: `clearGrid`, `spawnParticles`, `p2g_1`, `p2g_2`, `updateGrid`, **`g2p`** (il motore di confinement/churn), `copyPosition`. |
| `src/webgl/waterball/render/fluidRender.ts` | `FluidRenderer`: catena Screen-Space-Fluid (pipeline + texture + bind group), compone in `alphaMode: premultiplied`. |
| `src/webgl/waterball/render/*.wgsl.ts` | Shader della catena SSF: `sphere`, `depthMap`, `bilateral`, `thicknessMap`, `gaussian`, `fluid`, `fullScreen`. |
| `src/webgl/store/heroStore.ts` | Bus FX non-reattivo (zustand): `explode` / `reveal` / `video`. Scritto dalla timeline GSAP in `hero.tsx`, letto dal loop RAF via `getState()`. |
| `src/webgl/CanvasHost.tsx` | Monta il gradiente mare CSS (fallback), `VideoBackdrop` (cinematica 2D) e — solo se non `prefers-reduced-motion` — `WaterBallHero`. |

> **openQuestion**: `a-mark.glb` / `a-liquid.glb` restano in `public/models` ma **non sono caricati a runtime**. Da decidere a GATE-6 se rimuoverli del tutto o tenerli come asset sorgente per ricavare le costanti geometriche della "A".

---

## 3. Riempimento procedurale della "A" (`initFromHomes`)

Nessun `MeshSurfaceSampler`, nessun GLB. La "A" è definita **analiticamente** come 3 segmenti (asse mediale) + un raggio di tratto, in `mls-mpm.ts → initFromHomes()`; la **stessa geometria** è ridefinita in `g2p.wgsl` e le due **DEVONO restare in sync**.

Geometria della "A" (in unità di griglia, dentro `INIT_BOX = [80, 60, 18]`):

- `apex = (40, 48)`, `lfoot = (26, 12)`, `rfoot = (54, 12)` — i due montanti.
- crossbar `cl→cr`, calcolato a `tcross = (48-26)/(48-12)` lungo i montanti.
- `halfW = 5` (mezza larghezza del tratto), `zh = 5` (mezzo spessore dello slab Z), centrato a `zc = box.z/2`.
- Un punto è "dentro la A" se è entro `halfW` dal segmento più vicino dei tre **e** entro `zh` da `zc`.

Procedura:

1. `reset(INIT_BOX, SPHERE_RADIUS)` inizializza griglia/uniform.
2. `initFromHomes(INIT_BOX, NUM_PARTICLES)`:
   - sceglie uno **spacing** del fill così che un riempimento **uniforme** del volume della "A" stia sotto il cap (`numParticlesMax`); se lo spacing base sovraffolla, lo allarga una volta (densità ~ `1/s³`) invece di troncare spazialmente (che lascerebbe mezza lettera vuota);
   - scandisce il bounding box della "A", per ogni cella `inA` semina **una particella sulla sua "home"** (con piccolo jitter), velocità e matrice `C` a zero;
   - carica le **home** in un buffer GPU (`homeBuffer`, 3× f32 per particella) e ne tiene una copia CPU (`homePositions`). **NB — codice in flux:** questo `homeBuffer` è di fatto **seed-only**. Il `g2p` spedito **non lo lega** (bind group a 6 voci, `binding 0–5`, con `splash` a `binding 5`); il restore è **velocity-based verso l'asse mediale**, non verso le home fisse (vedi `g2p.wgsl` riga ~104 — i punti-home fissi sono stati rimossi perché «congelavano» il moto — e [`docs/12-PARTICLE-PHYSICS.md`](./12-PARTICLE-PHYSICS.md)). I commenti in `mls-mpm.ts` che citano «`g2p binding 6/7`» sono **stale**: `homeBuffer` è orfano. Da verificare/pulire a GATE-6.
3. La camera è puntata **head-on** (+Z) e inquadra il centro della lettera (`INIT_DISTANCE`).

Conseguenza chiave: il solver **non ha gravità reale**, quindi le particelle seminate sulle loro home **tengono la forma da sole**; il jet di spawn temporizzato dell'originale WaterBall è **disattivato** (il count è già al target).

> **Regola di sync vincolante**: se cambi `apex` / `lfoot` / `rfoot` / `halfW` / `zh` / `zc`, aggiorna **entrambi** `initFromHomes` (in `mls-mpm.ts`) e il blocco confinement di `g2p.wgsl`, altrimenti fill e confinamento divergono e la "A" si sfalda. Valori live-tuned, soggetti a sign-off GATE-6.

---

## 4. Confinement + churn: il motore in `g2p.wgsl`

Il cuore "vivo" è nello stage **`g2p`** (grid-to-particle) del solver, **dopo** l'integrazione MLS-MPM standard. Non è una molla che muove la **posizione**: è un insieme di forze che **modificano la velocità** della particella, sfruttando l'incomprimibilità del fluido per produrre circolazione perpetua. È fedele al "confined sphere" di WaterBall, ma il **centro** è l'**asse mediale della "A"** invece del centro di una sfera.

Per ogni particella, `g2p`:

1. ricostruisce la `position`/`v` dal grid (P2G→grid→G2P canonico), clampa la posizione dentro `real_box_size`;
2. trova il punto più vicino sull'asse mediale della "A" (i 3 segmenti, in XY) → `axis`, `toAxis`, `dAxis`, `dirIn`;
3. misura la `speed` dal grid (il **poke del mouse arriva qui** come velocità di griglia) **prima** delle forze di confinamento, così un poke veloce "apre il cancello";
4. calcola due fattori di tenuta:
   - `conf = clamp(1 - speed/speedGate)` — il churn lento resta confinato; un poke veloce → `conf≈0`;
   - `leash = clamp(overflow/leashRadius)` con `overflow = max(dAxis - halfW, 0)` — più lontano dalla sagoma, più forte il richiamo;
   - `hold = max(conf, leash)` — scala **sia** la gravità verso l'asse **sia** il recall;
5. applica le forze (tutte gated da `calm = 1 - explode`):
   - **inflate** (churn): dentro il tubo (`dAxis < halfW`) spinge **verso l'esterno** per riempire la sezione — questa forza non si assesta mai → moto perpetuo;
   - **gravity**: pull gentile verso l'asse, scalato da `hold` (l'undertow);
   - **restoreK**: recall dell'acqua strayata (`dAxis > halfW`), scalato da `overflow * hold`;
   - **drag** opzionale (default 0 per non spegnere il churn);
6. **EXPLODE burst**: quando `splash.explode > 0`, il confinamento è spento (`calm→0`) e ogni particella riceve una spinta **radiale verso l'esterno** dal centroide (+ jitter) → la "A" si disperde come uno splash;
7. **safety**: cap di velocità (`maxSpeed = 60`), un "un-stick" per le particelle finite nelle celle di bordo morte, e le wall force del box.

`SplashParams` (uniform, ordine vincolante condiviso da `mls-mpm.ts` e `g2p.wgsl`):
`inflate, gravity, drag, restoreK, speedGate, leashRadius, explode`.

> Mantra di tuning (live, GATE-6): il feel "acqua viva" sta nel rapporto `speedGate` ↔ churn. `speedGate` **alto** = il churn interno NON viene mai richiamato (solo i poke veloci scappano e poi rientrano); `restoreK` **basso** = il recall è un pull lento e morbido (non uno snap). Se il churn muore, alza `inflate`; se l'acqua scappa da sola a riposo, alza `speedGate`.

---

## 5. Render: Screen-Space-Fluid sopra il video

Il rendering è la catena SSF di WaterBall in `FluidRenderer.execute()` (percorso `sphereRenderFl = false`), eseguita per frame **dopo** lo step del solver:

```
sphere/depthMap  -> depth dei "blob" delle particelle (r32float)
bilateral (x4)   -> smoothing edge-preserving del depth (X/Y ping-pong)
thicknessMap     -> spessore accumulato (r16float, blend additivo)
gaussian (x1)    -> blur dello spessore (X/Y)
fluid            -> shading finale: ricostruisce la normale dal depth,
                    cubemap reflect + refract, Beer-Lambert sullo spessore,
                    fresnel; scrive nel canvas in alphaMode premultiplied
```

Composizione **sopra** la cinematica:

- il contesto WebGPU è configurato `alphaMode: "premultiplied"`; il pass `fluid` pulisce a `clearValue` **trasparente** (`a: 0`) → tutti i pixel non-fluido lasciano passare il `VideoBackdrop` sottostante.
- `WaterBallHero` è `position: fixed; inset-0; z-0; pointer-events:none; aria-hidden`. La cinematica frame-sequence (`VideoBackdrop`) sta **dietro** (vedi [`docs/05-CINEMATIC-SCROLL.md`](./05-CINEMATIC-SCROLL.md)); il testo liquido e i contenuti DOM stanno **sopra**.
- **Cubemap**: `public/cubemap/{posx,negx,posy,negy,posz,negz}.png` caricata in una texture cube per reflect/refract. Costanti di render (rest density, stretch, ecc.) live-tuned, soggette a sign-off GATE-6.

Non ci sono Bloom né DOF: la lettura "acqua" viene interamente dalla SSF (refract + Beer-Lambert + fresnel).

---

## 6. Backend, loop e idle (solo WebGPU)

- **Detection / fallback**: `if (typeof navigator === "undefined" || !navigator.gpu) { setUnsupported(true); return; }`. In assenza di adapter/device/context il componente ritorna `null`. Il fallback visivo è il **gradiente mare CSS** (`#sea-backdrop`) in `CanvasHost`. **Non esiste un percorso WebGL2/FBO.**
- **Loop proprio**: la sim+render girano in un `requestAnimationFrame` interno al componente (non nel FrameDriver R3F, che è dead code nel tree attivo — vedi [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md)). Il loop è cancelabile (`cancelled` + `cancelAnimationFrame`).
- **Idle fuori vista**: `IntersectionObserver` su `#hero`; quando la Hero esce dallo schermo il frame fa solo `requestAnimationFrame` e **salta del tutto compute + render** (GPU idle). Anche dopo che l'explode ha dissolto il canvas (`opacity ≈ 0`) il frame va idle finché non viene ri-armato.
- **DPR clamp**: backing resolution = `min(devicePixelRatio, 1.5)`; `canvas.width/height` settati **prima** che simulator/renderer leggano le dimensioni (servono a dimensionare texture e round-trip del mouse).
- **Teardown**: su unmount → `cancelled = true`, `cancelAnimationFrame`, `io.disconnect()`, `camera.dispose()`, `device.destroy()`.
- **StrictMode**: init async abortabile (controlli `if (cancelled) { dev.destroy(); return; }` dopo ogni await).

---

## 7. Beat letti da `heroStore`

Il loop legge `useHeroStore.getState()` una volta per frame (nessun re-render React):

- **`explode` (0..1)** — scritto dalla timeline GSAP di `hero.tsx` mentre si scrolla dentro. Il loop ne rileva il **fronte di salita** e fa scattare un **burst one-shot real-time ~1s** (NON scrubbato): l'acqua si spruzza via (`splashExplode 0→1` su ~0.6s) e il canvas svanisce (smoothstep su ~1s) sul proprio clock. Scrollando indietro (`explode ≤ 0.02`) si ri-arma: `splashExplode = 0`, `initFromHomes()` ricarica la "A", `canvas.opacity = 1`.
- **`reveal` (0..1)** — progresso del reveal del testo liquido (letto da `LiquidText`, vedi [`docs/05-CINEMATIC-SCROLL.md`](./05-CINEMATIC-SCROLL.md)); non tocca il solver.
- **`video` (0..1)** — progresso grezzo di scroll che pilota lo scrub della frame-sequence Pan di Zucchero (`VideoBackdrop`, dietro l'acqua). Vedi [`docs/05-CINEMATIC-SCROLL.md`](./05-CINEMATIC-SCROLL.md).

---

## 8. Entry animation + camera sway

Due gesti, **solo CSS/camera** (mai muovere il fluido a riposo — qualsiasi moto del fluido alza la `speed` oltre `speedGate` e disattiva il restore, disperdendo l'acqua; gotcha provato/revertito due volte):

- **Focus-pull (entry, una volta)**: GSAP anima il wrapper da `scale 1.14` + `blur(16px)` + `opacity 0` a nitido, con una lens-vignette che si schiarisce. **Critico per la nitidezza**: a fine animazione `clearProps: "filter,transform"` — un filtro/transform CSS residuo forzerebbe il canvas su un layer composito riscalato → "A" molle.
- **Camera sway (continuo)**: yaw via `sin`, pitch via `cos` (ampiezza pitch più bassa, ~0.55×) tracciano una piccola ellisse → la lettera piatta "galleggia" in 3D restando leggibile. Eased-in su ~2.5s così parte esattamente head-on. Orbita la **camera**, mai la sim. `sway = 0` → statico head-on.

Parametri (`leva` panel `camera`: `sway`, `swaySpeed`) live-tuned, soggetti a sign-off GATE-6.

---

## 9. Parametri live (leva) — soggetti a GATE-6

Tutti i numeri sotto sono **valori live-tuned via leva** (pannelli `splash` e `camera`, letti per frame via ref). Sono **soggetti a sign-off GATE-6**: NON sono finali, NON hardcodarli come definitivi altrove.

| Pannello / parametro | Ruolo | Note |
|---|---|---|
| `splash.inflate` | forza di churn verso l'esterno dentro il tubo | il motore del moto perpetuo |
| `splash.gravity` | undertow verso l'asse mediale | gentile → l'acqua indugia e rientra lenta |
| `splash.drag` | smorzamento opzionale | default basso per non spegnere il churn |
| `splash.restoreK` | recall dell'acqua strayata | basso → pull morbido, non snap |
| `splash.speedGate` | soglia di velocità che "apre il cancello" | alto → solo i poke veloci scappano |
| `splash.leashRadius` | distanza oltre cui il recall sale a pieno | ampio → splash vola lontano e drifta indietro |
| `splash.pokeForce` | intensità del poke del cursore | — |
| `camera.sway` / `camera.swaySpeed` | ampiezza/velocità dell'ellisse di sway | `sway = 0` = statico |

Costanti non-leva rilevanti (in `WaterBallHero.tsx` / `mls-mpm.ts`), anch'esse soggette a GATE-6: `INIT_BOX = [80,60,18]`, `NUM_PARTICLES` (cap del fill), `SPHERE_RADIUS`, `MOUSE_RADIUS`, `FOV`, `MLS_RADIUS`, `dt`/`viscosity`/`stiffness` del solver, `maxSpeed = 60` (safety hard nel `g2p`).

---

## 10. Performance, a11y, reduced-motion

- **WebGPU-only**: nessun render se manca `navigator.gpu` → fallback gradiente CSS. Niente budget WebGL2 da mantenere.
- **Idle aggressivo**: `IntersectionObserver` mette la GPU a riposo fuori dalla Hero; dopo l'explode il canvas dissolto va idle. È la leva perf primaria.
- **DPR clamp 1.5**: tetto alla risoluzione di backing.
- **`prefers-reduced-motion`**: `CanvasHost` **non monta affatto** `WaterBallHero` (mostra solo il gradiente mare CSS). Quindi reduced-motion = nessuna sim, nessun poke, zero GPU.
- **A11y**: il canvas è `aria-hidden` + `pointer-events:none`; nome/ruolo testuale vivono nell'overlay DOM leggibile (vedi [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md)).
- **Budget**: 60fps su desktop recente; se non regge, scala prima `NUM_PARTICLES` (densità del fill) e poi il DPR. Vedi budget in [`docs/01-TECHSTACK.md`](./01-TECHSTACK.md).

> **openQuestion**: nessun "tier" `full/lite/off` esplicito è implementato (la spec storica lo prevedeva). Il degrado attuale è binario: WebGPU full ↔ gradiente CSS. Se serve un tier mobile intermedio, da definire a GATE-6 (probabilmente abbassando `NUM_PARTICLES`/DPR per GPU deboli).

---

## 11. QA / Done-when

Checklist di accettazione (QA visivo via `claude-in-chrome`, vedi [`docs/11-WORKFLOW.md`](./11-WORKFLOW.md)). Vale la regola d'oro: niente "fatto" senza prova visiva (desktop + mobile) e console pulita.

- [ ] La marca è leggibile come **lettera "A"** head-on a riposo (sagoma chiara, fill uniforme dei 3 tratti).
- [ ] A riposo l'acqua **ribolle/circola** da sola (churn perpetuo), senza disperdersi né congelarsi.
- [ ] Un **poke veloce** del cursore fa **schizzare** una porzione fuori dalla sagoma; l'acqua poi **rientra lentamente** (undertow), senza congestione di ricomposizione.
- [ ] Il **camera sway** fa "galleggiare" la lettera restando leggibile (mai edge-on); parte esattamente head-on.
- [ ] L'acqua legge come **fluido SSF** (reflect/refract da cubemap, spessore Beer-Lambert, fresnel), composta **sopra** la cinematica `VideoBackdrop` (i pixel non-fluido sono trasparenti).
- [ ] Beat **explode**: scrollando dentro la "A" esplode e svanisce in ~1s sul proprio clock; risalendo si **ricompone** (`initFromHomes` rifill).
- [ ] **Fallback**: senza WebGPU (o con `prefers-reduced-motion`) si vede il **gradiente mare CSS**, nessun errore in console, nessuna sim montata.
- [ ] **Idle**: scrollando fuori dalla Hero la GPU va a riposo (frame-rate del resto della pagina invariato).
- [ ] **Nitidezza**: nessun filtro/transform CSS residuo dopo l'entry (la "A" non è molle/riscalata).
- [ ] **Console pulita**: nessun warning WebGPU/WGSL, nessun `NaN`/blow-up delle posizioni (il cap `maxSpeed` regge).
- [ ] **Teardown**: navigando via / unmount, nessun warning di device/resource leak.

---

## 12. Riferimenti tecnici

- **`matsuoka-601/WaterBall`** — fonte vendorizzata del solver MLS-MPM + catena SSF (env reflect/refract, Beer-Lambert, fresnel). Vedi anche `matsuoka-601/Splash`.
- MLS-MPM (Moving Least Squares Material Point Method) — P2G / grid update / G2P; mappatura sul nostro confinamento in [`docs/12-PARTICLE-PHYSICS.md`](./12-PARTICLE-PHYSICS.md).
- Screen-Space Fluid Rendering (depth → bilateral smooth → thickness → shading) — letteratura classica SSF.

Skill da attivare (routing in [`docs/10-SKILLS.md`](./10-SKILLS.md)): `threejs-shaders`, `shader-programming-glsl`, `fixing-motion-performance`, `web-performance-optimization`, `ui-visual-validator`. Per le API WebGPU/WGSL version-specific consultare Context7 prima di scrivere shader (vedi [`docs/08-CONTEXT7.md`](./08-CONTEXT7.md)).
