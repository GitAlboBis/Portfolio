# HANDOFF — Hero SSF Water "A" (faithful port from matsuoka-601) · 2026-06-24

> Branch di lavoro: **`fix/ssf-water-faithful-port`**. Prosa in italiano, codice/identificatori in inglese (regola CLAUDE.md).

## Stato in una frase

La hero "A" è una **simulazione SSF (screen-space fluid) di particelle d'acqua** su WebGPU+TSL.
Renderizzava ma sembrava **roccia marrone, non acqua**. Diagnosi completa fatta; rendering
rifatto **fedele a `waterball`** (reference più pulito di `Splash`). Manca verificare in
browser l'ultimo step (billboard imposters) + tuning del colore.

## Reference (clonati in locale, gitignored, read-only)

| Repo | Cos'è | Lancio |
|---|---|---|
| `Splash-main/` | matsuoka-601/Splash — MLS-MPM dam-break, SSF | `cd Splash-main && npm run serve` → http://localhost:5173 (deps installati) |
| `waterball/` + `WaterBall-main/` | matsuoka-601/waterball — SSF **più pulito**, palla d'acqua. **Target scelto.** | (stessa struttura, non ancora lanciato) |
| Articolo Codrops (stesso autore) | pipeline SSF 5-pass + half-res | https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/ |

App nostra: `next dev` → http://localhost:3000. Hero: **`?hero=ssf`** (default), `?hero=mesh` (PBR mesh A/B).
**`?bg=off`** nasconde il photo-backdrop per QA pulito del water su nero.

## Diagnosi (workflow multi-agente + verifica avversariale su sorgente three@0.184 + QA Chrome)

Lo shading in `materials.ts` era una traduzione **fedele e CORRETTA** di `fluid.wgsl`. La "A" sembrava
roccia per **3 motivi reali**:
1. **cubemap marrone** (canyon di Splash in `public/cubemap/`) → riflessi/rifrazione marroni.
2. **superficie sfaccettata/rumorosa** — imposter `IcosahedronGeometry(1,1)` + blur masked-Gaussian su depth half-float.
3. **niente glint**.

**FALSE PISTE refutate leggendo node_modules/three (NON toccare):**
- `pmremTexture(CubeTexture grezza)` è uso **corretto** in r184 (PMREMNode rigenera quando le 6 facce decodificano; auto-heal dopo flash iniziale).
- Color-space **già lineare** (PMREM baked in target LinearSRGB) → **NON** aggiungere `pow(2.2)` manuale (doppio-decode).
- `backdropRT` è NoColorSpace/lineare con **un solo** encode sRGB in present — corretto.
- In SSF **non esistono cast-shadows**; la profondità del corpo = thickness + Beer-Lambert.

## Insight chiave da waterball (il target di look)

- **Il BLU dell'acqua = ASSORBIMENTO (Beer-Lambert su thickness), NON l'ambiente.** waterball usa l'env
  solo per il **riflesso**; la **rifrazione** è un **grigio piatto × assorbimento**, con diffuse **blu saturo**
  `(0, 0.7375, 0.95)`, `transmittance = exp(-density·thickness·(1-diffuse))`.
- **EDGE HIGHLIGHTING**: ai salti di profondità (`maxDeltaZ > 1.5·sphereSize`) si fa `mix(color, white(0.9), 0.4)`
  → **schiuma bianca pulita**, nasconde il bordo SSF frastagliato **senza** dover fare i billboard.
- **SPECULAR spento** in entrambe le reference (`0.0 * specular`).
- **Billboard imposters**: quad camera-facing + normale analitica `sqrt(1-r²)` + fragDepth, con **stretch lungo la velocità** e **size × densità** (schizzi liquidi).
- **Filtro**: bilateral standard ×4 (spatial × range Gaussian) — più semplice del narrow-range di Splash.

## Decisioni prese da Alberto (questa sessione)

- **Rifrazione = tinta piatta** (waterball-clean), NON foto see-through, NON env.
- **Sì** ai billboard imposters + velocity-stretch (port fedele completo).
- Env riflesso = **cielo/mare PMREM procedurale** (`createSkyEnvironment`), non il cubemap marrone.

## Commit fatti (branch `fix/ssf-water-faithful-port`)

Tutti verificati in Chrome (console pulita, 144fps, screenshot) **tranne l'ultimo (WIP, non verificato)**:

| Commit | Cosa |
|---|---|
| `c12d51c` | env = PMREM cielo/mare (`createSkyEnvironment`) al posto del cubemap marrone; flag `?bg=off`; `Splash-main` escluso da tsconfig/gitignore |
| `1916953` | narrow-range bilateral depth filter (port di `narrowRangeFilter.wgsl`) + depth **r32float** (FloatType); thickness resta half-float |
| `e983453` | glint speculare Splash (poi spento di default in `64da28f`) |
| `64da28f` | **edge-foam** (waterball) + **diffuse blu saturo** + **glint off** di default |
| `77cd3c3` | **rifrazione tinta piatta** (`uRefractBg`) — env usato solo per il riflesso fresnel |
| **WIP (non verificato)** | **billboard imposters round** (`vertexNode`/`depthNode`/`Discard`) al posto degli icosaedri; geometry → `PlaneGeometry(1,1)`. **typecheck OK, MA NON verificato in browser** (navigate interrotto) |

## DA FARE (prossima sessione, in ordine)

1. **VERIFICARE i billboard in Chrome** su `?hero=ssf&bg=off`: reload → **muovi il mouse sul canvas** (gotcha sotto)
   → console pulita → screenshot. Rischi: convenzione `depthNode` (fragDepth `clip.z/clip.w`, deve essere [0,1] su WebGPU),
   `Discard()` deve sopprimere anche la depth, occlusione tra particelle. **Se rotto → debuggare o tornare a `IcosahedronGeometry(1,1)`**
   (il foam-edge da solo già pulisce i bordi, quindi i billboard NON sono obbligatori per la qualità minima).
2. **Velocity-stretch (B2)**: esporre `velocities` da `useFluidSim` (esiste come instancedArray, non è nel return);
   stirare il quad in `billboardClip` lungo la velocità proiettata in view-space, scala col `speed` (a riposo speed~0 → round),
   area-preserve ~`1/sqrt(1+amt)`. **Lo stretch DEVE essere identico tra depth e thickness** (stessa footprint) → uniform condiviso o costante.
3. **Tuning colore**: la A è **pallida** (lettera sottile → poca thickness → assorbimento debole). Alzare `density` via leva
   per blu più profondo; tunare `edgeFoam` (più basso = bordo schiuma più sottile), `refractBg`, `roughness`.
4. **Ripristinare il photo-backdrop** (togliere `?bg=off`) e validare la A sul mare di Pan di Zucchero (desktop + mobile).
5. (Opzionale) swap narrow-range → bilateral standard di waterball (più semplice/fedele).

## File chiave (nostri, in `src/webgl/liquid/ssf/`)

- **`materials.ts`** — TUTTO lo shading TSL: `billboardClip`, `makeDepthMaterial`/`makeThicknessMaterial` (imposter),
  `makeDepthBlurMaterial` (narrow-range filter), `makeGaussianMaterial` (thickness blur), `makeCompositeMaterial`
  (reconstruct + normali + Beer-Lambert + fresnel + edge-foam). Primitivi TSL aliasati `Node`(any): `PLOCAL/CAM_VIEW/CAM_PROJ`.
- **`SSFHero.tsx`** — render manager: 7 pass a `useFrame` priority **1** (take-over del loop), RT, env PMREM, `PlaneGeometry`, resize.
- **`useFluidSim.ts`** — compute sim condivisa (spring-to-glyph "A" + ejection direzionale dal mouse). Ritorna `{positions, uRadius}` (aggiungere `velocities` per lo stretch).
- **`SSFControls.tsx`** — pannello leva dev: `diffuseColor / density / roughness / specular / edgeFoam / refractBg`.
- `../FluidParticles.tsx` — fallback teal spheres (WebGL2 / tier non-`full` / SSF-fail).
- `../../CanvasHost.tsx` — selezione hero: `useSSF = webgpu && tier==="full" && !ssfFailed`; flag `?bg=off`, `?hero`.

## Gotchas (costati ore)

- **Chrome screenshot WebGPU**: il canvas compone nello screenshot **solo dopo un pointer event** → fai `hover` sul canvas prima di screenshottare, altrimenti vedi solo il gradiente CSS dietro (sembra che la A sia sparita).
- **Turbopack `.next` stale**: durante edit sequenziali HMR logga `ReferenceError` intermedi (uniform rinominata a metà) con timestamp vecchi → reload pulito prima di fidarsi della console.
- **TSL typing scalar-only**: i primitivi tipati (`positionLocal`, `cameraViewMatrix`, `vec3`/`vec4`) rompono gli overload se composti direttamente → aliasarli come `Node`(=`any`).
- **`render()`/`compute()` SINCRONI** in r184 (no `await` nel useFrame).
- **Depth stored NEGATIVO** (eye-z): il filtro lavora su `|d|` e ri-negate in output; composite BG test `abs(eyeZ) < BG_TEST(100)`, sentinel 1000.
- **Canvas R3F resta 300×150** per ~qualche secondo durante l'init async del WebGPURenderer (non è un bug).

## Come girare e verificare

```bash
bun run dev                       # http://localhost:3000  (hero: ?hero=ssf&bg=off per QA)
./node_modules/.bin/tsc --noEmit  # typecheck (Splash-main/waterball esclusi)
cd Splash-main && npm run serve   # reference live → http://localhost:5173
```
Regola CLAUDE.md: **niente "fatto" senza prova visiva** — screenshot desktop+mobile + console pulita.

Memoria persistente correlata: `ssf-fluid-hero-wip` (aggiornata), `hero-water-realism-reference`, `hero-pivoted-to-liquid-mesh-webgpu`, `hero-mark-is-letter-a`.
