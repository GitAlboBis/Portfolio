# HANDOFF — Hero "A" d'acqua (WaterBall MLS-MPM) · 2026-06-26

> Per continuare in un'altra sessione. Stato reale dell'hero, architettura, come girare/
> verificare, cosa funziona, e cosa resta DA FINIRE. Prosa in italiano, codice/
> identificatori in inglese (regola `CLAUDE.md`).

## TL;DR
- **Hero**: embed FEDELE di **matsuoka-601/WaterBall** — solver di fluido **MLS-MPM** in **WebGPU grezzo** (NON R3F), modellato in una **"A" 3D piena d'acqua**, reso via screen-space fluid.
- **Branch `feat/ssf-a-volume` e `main` sono ALLINEATI a questo commit** (pushato su `origin` GitAlboBis/Portfolio). Il checkpoint precedente (firm-wall, **senza** splash) è `69efa96` — resta in git history, recuperabile se serve un fallback.
- **COSA FUNZIONA ora**: la "A" si riempie d'acqua cyan **all'avvio** (fill-on-home, istantaneo, niente più getto da 13s), **SPLASHA** al passaggio veloce del mouse (più veloce = più lontano), **rimbalza** nel box invisibile e si **RICOMPONE** (risacca). Tutto tarabile **dal vivo** con un pannello `leva`. Modello **conservativo** (le stesse particelle escono e rientrano).
- **Vincolo grosso**: l'estensione **claude-in-chrome NON si è connessa** → lavoro **alla cieca** (solo build-verify, mai prova visiva mia). Alberto testa nel suo Chrome e manda screenshot. **Connettere l'estensione accelererebbe enormemente** la taratura visiva.

## Architettura dell'embed
- **`src/webgl/waterball/`** — codice WaterBall vendored:
  - `mls-mpm/mls-mpm.ts` — classe `MLSMPMSimulator` (compute: clearGrid → spawnParticles → p2g_1 → p2g_2 → updateGrid → g2p → copyPosition; 2 sotto-passi/frame). `@ts-nocheck`. Qui: `initFromHomes()` (fill della "A"), i buffer `homeBuffer`/`splashParamsBuffer`, le live-params (`splash*`, `pokeForce`).
  - `mls-mpm/*.wgsl.ts` — gli shader del solver, **convertiti da `.wgsl` a moduli `.ts`** (`export default` + template-string). Si chiamano `X.wgsl.ts` così gli `import from './X.wgsl'` si risolvono senza loader/config Turbopack.
  - `render/fluidRender.ts` + `render/*.wgsl.ts` — screen-space fluid renderer (`@ts-nocheck`). NON toccato.
  - `camera.ts` — orbit camera (aggiunto `dispose()` + opzioni `{orbit,zoom,hoverTarget}`; per l'hero orbit/zoom OFF, hover su `window`). `currentXtheta`=yaw, `currentYtheta`=pitch, `recalculateView()` ricostruisce la view.
  - `common.ts` — uniforms condivisi (`numParticlesMax=200000`, `mlsmpmParticleStructSize=80`).
  - **`WaterBallHero.tsx`** — il `main()` di WaterBall come **React client component**: canvas ref, init async StrictMode-safe, RAF cancelabile, teardown GPU. Qui il **pannello `leva`** e le costanti tarabili.
- **`src/webgl/CanvasHost.tsx`** — monta `<WaterBallHero/>` solo **dopo il mount** (`animate` flip in `useEffect`) → l'hero non viene mai SSR-renderizzato (quindi `leva` è SSR-safe). WebGPU assente / reduced-motion → resta il gradiente CSS.
- **`src/webgl/`** infra R3F TENUTA per la cinematica futura (`FrameDriver`, `SceneErrorBoundary`, `renderer/createRenderer`, `store/*`).
- **Asset**: env cubemap in `public/cubemap/*.png` (cielo+spiaggia da WaterBall) per i riflessi.
- **Deps**: `wgpu-matrix`, `@webgpu/types`, `leva` (già installate).

## Come girare e verificare
> **Toolchain**: node 22 + **bun 1.3.14** (`npm i -g bun`), MA **bun NON è nel PATH**. Richiamalo col prefix:
```bash
# Windows PowerShell:
$prefix = (npm config get prefix).Trim(); $env:Path = "$prefix;$env:Path"
bun run typecheck    # tsc --noEmit — DEVE passare pulito
bun run dev          # http://localhost:3000
```
- **Hero**: `localhost:3000`. WebGPU richiesto (Chrome recente).
- **WGSL validato SOLO a runtime** (gli shader sono stringhe → `tsc` non li valida). Quindi: typecheck pulito + dev server compila (`✓ Compiled`, `GET / 200`, niente errori `[browser]` nel log) = build ok; il render lo verifica l'occhio. Console del browser deve essere pulita.

## Come funziona lo SPLASH (implementato in questa sessione)
- **FILL**: `mls-mpm.ts` → `initFromHomes()` campiona su CPU le **home** che riempiono il volume pieno della "A" (rejection sampling, spacing 0.66 con allargamento se sfora il cap → niente troncamento), semina ogni particella **sulla sua home**, e carica le home (impacchettate 3×f32) in `homeBuffer`. **La geometria DEVE combaciare con `g2p.wgsl`**: apex(40,48), lfoot(26,12), rfoot(54,12), crossbar `tcross`, `halfW=5`, slab z `zh=5`, `zc=box.z/2`. **Niente gravità** nel solver → le particelle sulle home restano ferme.
- **RESTORE + SPLASH** (`g2p.wgsl`): richiamo morbido `v += (home - pos) * restoreK * gate`, con `gate = max(1 - speed/speedGate, leash)`. A riposo (lento) `gate≈1` → tiene la forma (e siccome la particella è GIÀ sulla home, il richiamo è ~0 → non congela). Poke veloce → speed alta → `gate→0` → l'acqua **vola fuori** (splash). Rallentando → `gate` risale → **rientra** (risacca). `leash = clamp((dist-leashRadius)/12)` forza il rientro dei **fuggitivi lontani**.
- **POKE**: `updateGrid.wgsl` usa `mouseInfo.pokeForce` (live), scritto nello slot libero (offset 28) del buffer `mouseInfo` — niente binding nuovo.
- **BORDO**: muro morbido del box (~3 unità in `g2p`) → **rimbalzo** naturale. **UN-STICK**: `updateGrid` AZZERA la velocità delle **celle di bordo** della griglia (condizione muro) → una particella che le raggiunge resta **intrappolata** (la velocità di richiamo viene cancellata prima di advettare). Fix: spinta verso casa **per POSIZIONE** solo nelle celle morte (`< 2.2` unità dal bordo) → non incastra, MA zona stretta = non rompe il rimbalzo.
- **LEVA** (pannello "splash" in `WaterBallHero.tsx`): **5 knob live** spinti nel sim ogni frame via ref —
  `restoreK 0.10`, `speedGate 1.0`, `drag 0`, `pokeForce 0.20`, `leashRadius 50`.
- **INSIGHT CHIAVE**: il restore è *gated*, e `gate≈0` per le particelle VELOCI → **`restoreK` agisce SOLO sull'assestamento/ricomposizione (particelle lente), NON sullo splash**. Si può alzare `restoreK` per una "A" più nitida **senza** cambiare il feel dello splash.

## Manopole di taratura
- **Forma "A"**: `apex/lfoot/rfoot/tcross/halfW/zh` in `g2p.wgsl.ts` — **e identiche** in `initFromHomes()` (mls-mpm.ts) altrimenti fill e confinamento divergono.
- **Densità fill**: `baseSpacing` (0.66) in `initFromHomes()` — più basso = più denso (rischio sovrappressione), più alto = più rado.
- **Splash/feel**: i 5 knob `leva` (sopra). `maxSpeed=60` (clamp di sicurezza) e `leashWidth=12` sono baked in `g2p.wgsl`.
- **Inquadratura/sim**: `WaterBallHero.tsx` → `INIT_BOX [80,60,18]`, `INIT_DISTANCE 72`, `MOUSE_RADIUS 9`, `AUTO_ROTATE false`, `FOV 45°`, `NUM_PARTICLES` (cap del fill).
- **Viscosità**: `mls-mpm.ts` → `dynamic_viscosity: 0.25`.

## Gotcha (leggere — mi sono costati tempo)
- **WGSL nei moduli `.ts`**: MAI backtick o `${` nei commenti/codice → chiudono la template-string → build rotta. **Mi ha colpito DUE volte** in questa sessione (anche un solo backtick attorno a una parola in un commento). Stato incoerente struct/corpo (es. togliere un uniform field ma lasciarne l'uso) → **WGSL non compila → hero scura/sparita**.
- **Griglia MLS-MPM cap 80 celle/lato**; box `[80,60,18]`. `updateGrid` AZZERA la velocità delle celle di bordo (x<2 ecc.) → intrappola le particelle che ci finiscono (vedi UN-STICK).
- **IDLE MOTION va fatto sulla CAMERA, NON sul fluido**: aggiungere moto al fluido (swirl di velocità *oppure* wobble del target-home) lo **DISPERDE** — con `speedGate=1.0` anche un moto gentile alza la velocità sopra il gate → il richiamo si spegne → l'acqua si sparpaglia fino a sparire. **Provato e revertito due volte.** Il moto "circolare 3D" dell'originale è la **camera** che orbita (`rotateFl`→`stepAngle`), non l'acqua (il clone non ha gravità/noise/forze ambientali).
- **bun non nel PATH** (prefix).
- **Non verificabile a vista** senza estensione → ogni modifica al feel va testata da Alberto a piccoli passi.

## DA FINIRE (prossimi passi)
1. **Ricomposizione non perfetta dopo tanti splash.** Dopo molti splash la "A" si ricompone ma **non perfettamente nitida** (alcune particelle restano fuori posto = "ingorgo" da home a **indice fisso** nel fluido incomprimibile). Leva primaria: **alzare `restoreK`** (~0.25–0.4) → assestamento più forte/nitido, e NON tocca lo splash (gated off per le veloci). Altre idee: assegnare la home **più vicina** invece che a indice fisso; oppure un piccolo boost di restore solo per particelle **lente E lontane** dalla home.
2. **Moto iniziale / vita a riposo.** All'avvio (mouse fermo) l'acqua è statica. **NON** aggiungere moto al fluido (disperde — vedi gotcha). Farlo via **CAMERA** (punto 3).
3. **Camera 3D (la "vita" giusta).** Implementare uno **SWAY gentile della camera** in `WaterBallHero.tsx` (frame loop): oscillare `camera.currentXtheta` (yaw) e `camera.currentYtheta` (pitch) in una piccola **ellisse** — es. `cos/sin(performance.now()*0.001*~0.35)`, ampiezza yaw ~0.2 rad, pitch ~0.12 rad — poi `camera.recalculateView()` ogni frame (la view va aggiornata PRIMA di `writeBuffer(renderUniformBuffer,...)`). Esporre un knob `sway` (0 = statico head-on). **Zero rischio fisica**: la "A" resta nitida e "galleggia" in 3D = la motion circolare 3D che Alberto vuole. Tenere le ampiezze piccole → la "A" piatta resta leggibile (rotazione piena = edge-on illeggibile).
4. **(Opzionale, "Option B") foam/decay**: strato separato di particelle **diffuse/schiuma** effimere (sprite, lifetime/opacity) per lo spruzzo che **svanisce** + "A" sempre piena (design `CLAUDE.md` "pelle schiuma" + Unified Eq.28). Decisione aperta vs restare sul conservativo. La SSF attuale non sa dissolvere singole particelle → serve un pass sprite a parte.
5. **Polish acqua** (docs/12): `s_corr` (coesione/bordi tondi), vorticity (splash più vivo), sleeping. **Perf/mobile** (tier, scalare particelle). **Sfondo** dietro la "A".

## Knowledge base
- **`docs/12-PARTICLE-PHYSICS.md`** — PBD / PBF / Unified (algoritmi, equazioni, parametri, note WebGPU) + mapping sul nostro hero + **Parte D-bis = piano splash**.
- **Memoria persistente**: `~/.claude/projects/.../memory/ssf-water-state-2026-06.md` — cronologia dettagliata + tutte le lezioni di questa sessione.
- Cloni reference **UNTRACKED** (locali): `.analysis-clones/WaterBall` (+ `Splash`) — sorgente dell'embed.
