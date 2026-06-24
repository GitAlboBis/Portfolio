# HANDOFF — Hero "A" liquid (WebGPU) · 2026-06-24

> Per continuare in un'altra sessione. Stato reale del lavoro sull'hero, cosa è
> live, cosa è in panchina, e i prossimi passi. Prosa in italiano, codice/identificatori
> in inglese (regola CLAUDE.md).

## TL;DR

- **Branch**: `feat/hero-liquid-mesh-webgpu` — pushato su `origin` (GitHub `GitAlboBis/Portfolio`).
- **Ultimo commit**: `c41a5a2` — *feat(hero): WebGPU fluid-particle "A" on photo backdrop*.
- **NON ancora aperta la PR** (link suggerito da GitHub: `…/pull/new/feat/hero-liquid-mesh-webgpu`).
- **Cosa vede l'utente ora** (verificato live su Chrome da Alberto): foto Pan di Zucchero a tutto schermo (dritta) + la "A" come **nuvola di particelle teal** che tiene la forma e schizza al passaggio del mouse.

## Stato runtime (cosa è montato)

`src/webgl/CanvasHost.tsx` monta, dentro il `<Canvas gl={createWebGPURenderer}>`:
1. `<FrameDriver/>` — un solo frame-loop, sincronizza pointer/Lenis.
2. `<PhotoBackdrop/>` (in `<Suspense>` + `<SceneErrorBoundary>`) — **placeholder**, sostituisce il vecchio `SeaBackdropTSL`.
3. `<FluidParticles/>` (in `<Suspense>` + `<SceneErrorBoundary>`) — la "A".

### `PhotoBackdrop.tsx` (placeholder, NON definitivo)
- Sfondo foto cover-fit via `screenUV`, `MeshBasicNodeMaterial`, `depthTest/Write=false`, `renderOrder=-10`.
- **V flippata** (`screenUV.y.oneMinus()`) perché screenUV è y-up → senza flip la foto era capovolta. ← bug già risolto.
- Sorgente: `/images/AdobeStock_1294278468.jpeg`. **Sarà sostituita da un `VideoTexture`** quando Alberto fornisce la clip dell'hero (vedi sotto).

### `FluidParticles.tsx` (la "A" — baseline VISIBILE su cui iterare)
- Compute sim WebGPU: `COUNT=42000` particelle, `instancedArray` per pos/vel.
- Le home position sono campionate dal glyph `a-liquid.glb` via `sampleGlyph.ts` → la lettera tiene la forma.
- Molla verso home (`uSpring=16`, `uDampK=3.5`) + spinta radiale dal mouse (`uPushRadius=0.6`, `uPushStrength=16`) = splash che poi rientra.
- Render **diretto**: `IcosahedronGeometry(1,1)` instanziata, `MeshBasicNodeMaterial`, `colorNode=color(0x49c6dd)`, `positionNode = positionLocal*uRadius + positions[i]`.
- Il mouse è proiettato sul piano z=0 (`unproject`) in `useFrame` priority-0.

## Cosa è IN PANCHINA (shelved, ma il codice c'è)

- **Screen-space fluid (SSF)** stile `matsuoka-601/Splash`: era implementato in `FluidParticles.tsx` (depth RT + thickness RT → blur → composite con normali ricostruite, Fresnel, Beer-Lambert). **L'ho tolto** perché il composite *nascondeva* il modello (la "A" si fondeva nello sfondo → l'utente vedeva solo mare sfocato). La versione attuale è il render diretto delle sfere.
- **`HeroLiquidLogo.tsx`** — la vecchia versione MESH (glass/water "A" con env sky + splash). Funzionante e rivista, ma NON montata. Tenuta in repo come riferimento/fallback.
- File di supporto degli esperimenti (in repo, alcuni inutilizzati ora): `SeaBackdropTSL.tsx`, `liquid/liquidWaterMaterial.ts`, `liquid/liquidConfig.ts`, `liquid/LiquidControls.tsx`, `liquid/SplashSystem.tsx`, `liquid/skyEnvironment.ts`.

## Asset (IMPORTANTE)

- **Foto**: `public/images/AdobeStock_1294278468.jpeg` — **9,64 MB**. Committata perché è il placeholder live, ma è PESANTE per il web → da ottimizzare/risponsivizzare prima del go-live.
- **Video**: `public/video/*.mp4` — **5 file, ~208 MB totali** (il maggiore 56 MB). **GITIGNORATI** (`/public/video/` in `.gitignore`): NON committarli come blob git (limiti GitHub: warning 50 MB, hard 100 MB; bloat permanente della history). Quando si integra la clip → **Git LFS** (`git lfs track "*.mp4"`) oppure CDN/Vercel Blob. I file sono comunque sul disco di Alberto in `public/video/`.
- **Modello**: `public/models/a-liquid.glb` (0,61 MB) — glyph "A", text→solidify→voxel remesh in Blender, ~2.0 alto × 0.36 profondo, glTF Y-up. `a-mark.glb` (0,11 MB) è il vecchio mark.

## Prossimi passi (ordine suggerito)

1. **Far leggere la "A" come ACQUA, non come palline.** Opzioni: (a) ri-tentare il composite SSF ma assicurando che resti VISIBILE sopra lo sfondo (problema noto: i pass extra in `useFrame` sporcavano lo stato del renderer → sfondo nero; serve salva/ripristina di `autoClear`/render target o un loop di render manuale con take-over a priority 1); (b) metaball/raymarch; (c) tornare alla mesh trasmissiva `HeroLiquidLogo` su sfondo foto. **Decidere con Alberto.**
2. **Splash fuori dal modello in direzione del mouse, in base alla velocità** (richiesta esplicita di Alberto, rimandata): particelle che escono dalla "A" e si propagano verso il mouse, schizzi/onde. Oggi la spinta è solo radiale e rientra.
3. **Integrare la clip hero**: sostituire `PhotoBackdrop` (texture foto) con `VideoTexture` della clip che Alberto fornirà; i riflessi/ambiente verranno da lì (per questo l'env non va perfezionato ora).
4. **Ottimizzare la foto** (9,6 MB → WebP/AVIF responsive) finché resta placeholder.
5. **Degrado mobile + budget perf** (60fps desktop, scalare densità particelle su mobile/`prefers-reduced-motion`, Lighthouse ≥80 mobile). `createRenderer.ts` ha già `detectTier`.
6. **Aprire la PR** quando l'hero è confermato.

## Gotcha WebGPU/tooling (mi sono costati ore — leggere prima di toccare)

- `THREE.Points` su WebGPU rende **max 1px** → invisibile. Usare **instanced spheres/billboards** (già fatto).
- `InstancedMesh.instanceMatrix` parte a **zeri** → three moltiplica il `positionNode` per esso → tutto collassa nell'origine. **Seedare matrici identità** (già fatto in un `useEffect`).
- L'estensione Chrome **compone il canvas WebGPU nello screenshot SOLO dopo un evento pointer** → muovere il cursore prima di screenshottare, altrimenti sembra vuoto/nero (ha causato falsi "non renderizza").
- **Turbopack `.next` serve moduli STALE tra i restart** → errori del browser che non combaciano col codice su disco. Per una verifica affidabile: `rm -rf .next` + restart (non solo HMR). Una modifica → build pulita → verifica.
- TSL `exp()`/`oneMinus()` sono tipati scalar-only → cast `as any` per vec3, o usare uniform `vec3` (non `color`) per le math di tint.
- `WebGPURenderer.getClearColor/setClearColor` vogliono `Color4`, non `Color`.
- Renderer R3F WebGPU async: `gl={async (props)=>{ const r=new THREE.WebGPURenderer(props); await r.init(); return r; }}` (vedi `createRenderer.ts`).
- Import split: renderer + node-materials da `three/webgpu`, nodi TSL da `three/tsl`. TSL: `Fn` (non `tslFn`).
- Blender pilotato via **socket TCP 9876** (il MCP spesso non carica).

## Come girare e verificare

```bash
# build pulita (obbligatoria per evitare cache stale)
# Windows PowerShell:
#   stop dev su :3000, poi: Remove-Item -Recurse -Force .next
bun run dev          # http://localhost:3000
bun run typecheck    # deve passare pulito
```
Regola CLAUDE.md: **niente "fatto" senza prova visiva** — screenshot desktop+mobile + console pulita. (Muovi il cursore prima dello screenshot, vedi gotcha.)

## Memoria persistente correlata

`~/.claude/projects/.../memory/`: `ssf-fluid-hero-wip.md` (aggiornata a questo stato),
`hero-pivoted-to-liquid-mesh-webgpu.md`, `hero-water-realism-reference.md`,
`hero-mark-is-letter-a.md`, `drive-blender-via-socket-9876.md`.
