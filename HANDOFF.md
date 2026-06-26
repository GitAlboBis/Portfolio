# HANDOFF — Hero "A" d'acqua (WaterBall MLS-MPM) · 2026-06-26

> Per continuare in un'altra sessione. Stato reale dell'hero, architettura, come girare/
> verificare, cosa funziona, e cosa resta DA FINIRE. Prosa in italiano, codice/
> identificatori in inglese (regola `CLAUDE.md`).

## TL;DR
- **Hero**: embed FEDELE di **matsuoka-601/WaterBall** — solver di fluido **MLS-MPM** in **WebGPU grezzo** (NON R3F), modellato in una **"A" 3D piena d'acqua**, reso via screen-space fluid.
- **Branch `feat/ssf-a-volume` e `main` sono ALLINEATI** (pushati su `origin` GitAlboBis/Portfolio). Checkpoint precedenti recuperabili in git history: `69efa96` (firm-wall, senza splash) e `058e109` (home-lock + splash, **prima** del refactor churn).
- **COSA FUNZIONA ora** (modello NUOVO — "fluido libero confinato"): la "A" si riempie d'acqua cyan all'avvio e **SI MUOVE DA SOLA in continuo** (churn interno, come l'originale WaterBall — niente camera-trick), **SPLASHA** in **slow-motion** al passaggio del mouse (nuvola morbida che si allarga) e **rientra lentamente** (risacca dolce). Forma "A" tonda/leggibile. Tutto tarabile **dal vivo** col pannello `leva` (folder `splash` + `camera`).
- **Verifica visiva**: l'estensione **claude-in-chrome ORA si connette** → screenshot/GIF desktop verificati di persona (churn, splash, ricomposizione, console pulita). Su mobile resta da provare.

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

## Come funziona l'ACQUA (modello "fluido libero confinato" — refactor di questa sessione)
> Sostituisce il vecchio **home-lock** (ogni particella inchiodata a un punto fisso): quello rendeva l'acqua MORTA a riposo e faceva "ingorgo" in ricomposizione. Ora la "A" è un **fluido libero confinato al suo asse mediale**, fedele al motore dell'originale WaterBall (`.analysis-clones/WaterBall/mls-mpm/g2p.wgsl:82-95`).
- **FILL**: `mls-mpm.ts` → `initFromHomes()` semina le particelle dentro il volume della "A" (rejection sampling, spacing 0.66). `homeBuffer`/`homePositions` restano per il seeding ma **NON sono più letti da g2p** (binding `homes` + `sphereRadius` rimossi da g2p; `splash` ora è il binding 5).
- **CHURN ENGINE (il moto autonomo)** (`g2p.wgsl`): trapianto delle 2 forze dell'originale ma attorno all'**asse mediale della "A"**. Per ogni particella si trova il punto più vicino `m` sui 3 segmenti (apex-lfoot, apex-rfoot, crossbar) → `axis`/`toAxis`/`dAxis`. **INFLATE**: dentro il tubo (`dAxis<halfW`) `v += -(halfW-dAxis)*dirIn*inflate` (spinta OUTWARD) → riempie la sezione e, contro l'incomprimibilità, **non si assesta mai = circolazione perpetua**. **GRAVITY**: `v += dirIn*gravity*hold` (pull gentile verso la centerline = risacca lenta).
- **SPLASH + CONFINAMENTO (lo `hold`)**: si misura `speed = length(v)` dalla griglia **PRIMA** delle forze (lì arriva il poke). `conf = clamp(1 - speed/speedGate)`, `leash = clamp(overflow/leashRadius)`, `hold = max(conf, leash)`. Gravità e richiamo (`dAxis>halfW`: `v += dirIn*overflow*restoreK*hold`) sono **scalati da `hold`**: particella LENTA/lontana → `hold≈1` → confinata (A nitida + risacca); poke VELOCE → `hold≈0` → **vola fuori libera** (splash). **Chiave**: misurare speed PRIMA delle forze separa il churn lento (grid-v piccola perché la pressione bilancia l'inflate → resta confinato) dal poke veloce (grid-v grande → scappa). `speedGate` deve stare TRA la velocità del churn e quella del poke (troppo alto → lo splash non esce; troppo basso → il churn fa leak).
- **SLOW-MOTION**: `dt=0.13` (era 0.20) + `dynamic_viscosity=0.45` (era 0.25) rallentano e ispessiscono tutto. Il rientro lento si tara con `restoreK` basso + `gravity` bassa + `leashRadius` ampio.
- **POKE**: `updateGrid.wgsl` usa `mouseInfo.pokeForce` (live, offset 28). **BORDO**: muro morbido del box in `g2p` (rimbalzo) + **UN-STICK** (spinta per POSIZIONE `toAxis*0.05` solo nelle celle morte di bordo).
- **LEVA** (folder `splash`, 7 knob live spinti nel sim ogni frame via ref): `inflate 4.0`, `gravity 0.05`, `drag 0`, `restoreK 0.10`, `speedGate 2.5`, `leashRadius 60`, `pokeForce 1.0`. Folder `camera`: `sway 0.18` (oscillazione 3D gentile della camera — ellisse yaw+pitch), `swaySpeed 0.35`.
- **SplashParams** (uniform g2p binding 5, 6×f32 ordine: `inflate, gravity, drag, restoreK, speedGate, leashRadius`, buffer 32B) — l'ordine in `mls-mpm.ts execute()` DEVE combaciare con lo struct in `g2p.wgsl`.

## Manopole di taratura
- **Forma "A"**: `apex/lfoot/rfoot/tcross/halfW/zh` in `g2p.wgsl.ts` — **e identiche** in `initFromHomes()` (mls-mpm.ts) altrimenti fill e confinamento divergono.
- **Densità fill**: `baseSpacing` (0.66) in `initFromHomes()` — più basso = più denso (rischio sovrappressione), più alto = più rado.
- **Acqua/feel**: i 7 knob `leva` folder `splash` (sopra). `maxSpeed=60` (clamp di sicurezza) e `halfW=5` sono baked in `g2p.wgsl`. Mappa rapida: rientro più lento → `restoreK`/`gravity` ↓; splash più ampio/lontano → `leashRadius`/`pokeForce` ↑; splash più dolce → `pokeForce` ↓; acqua più densa/smorzata → `drag` ↑ (occhio: smorza anche il churn); churn più/meno vivo → `inflate`.
- **Slow-motion globale (NON in leva, solo codice)**: `mls-mpm.ts` constants → `dt: 0.13` (più basso = più lento) e `dynamic_viscosity: 0.45` (più alta = più densa). Per renderli live serve ricostruire le 3 pipeline (p2g_2/updateGrid/g2p) al cambio.
- **Camera**: folder `camera` → `sway`/`swaySpeed` (oscillazione 3D). `sway 0` = head-on statico.
- **Inquadratura/sim**: `WaterBallHero.tsx` → `INIT_BOX [80,60,18]`, `INIT_DISTANCE 72`, `MOUSE_RADIUS 9`, `AUTO_ROTATE false`, `FOV 45°`, `NUM_PARTICLES` (cap del fill).

## Gotcha (leggere — mi sono costati tempo)
- **WGSL nei moduli `.ts`**: MAI backtick o `${` nei commenti/codice → chiudono la template-string → build rotta. **Mi ha colpito DUE volte** in questa sessione (anche un solo backtick attorno a una parola in un commento). Stato incoerente struct/corpo (es. togliere un uniform field ma lasciarne l'uso) → **WGSL non compila → hero scura/sparita**.
- **Griglia MLS-MPM cap 80 celle/lato**; box `[80,60,18]`. `updateGrid` AZZERA la velocità delle celle di bordo (x<2 ecc.) → intrappola le particelle che ci finiscono (vedi UN-STICK).
- **IL MOTO AUTONOMO VA SUL FLUIDO (corretto in questa sessione — il gotcha precedente era SBAGLIATO).** Le vecchie note dicevano "muovere il fluido lo disperde, fallo sulla camera": era falso. Disperdeva perché si aggiungeva uno swirl al vecchio **home-lock** con `speedGate=1.0` → il moto alzava la speed sopra il gate → il richiamo si spegneva. La soluzione giusta è il modello **confinamento (non attaccamento) + churn engine** (inflate+gravità) preso dall'originale: l'acqua circola DA SOLA dentro il tubo e resta confinata. La camera-sway resta come parallasse gentile extra, ma **non è** la sorgente del moto.
- **`speedGate` è l'asse delicato**: deve stare TRA la velocità del churn (bassa, pressione-bilanciata) e quella del poke (alta). Troppo alto → lo splash non esce (sintomo "acqua incollata alla A"); troppo basso → il churn fa leak e la A si sparpaglia. Misurare `speed` PRIMA delle forze di confinamento è ciò che rende pulita la separazione.
- **bun non nel PATH** (prefix).
- **Non verificabile a vista** senza estensione → ogni modifica al feel va testata da Alberto a piccoli passi.

## DA FINIRE (prossimi passi)
> Risolti in questa sessione: **moto autonomo** (churn engine), **ricomposizione** (ora il fluido è libero, niente più ingorgo da indice fisso), **camera sway**, **splash slow-motion**. Verifica visiva desktop fatta.
1. **Finalizzare il feel slow-motion** (in corso con Alberto via leva). Trovare i valori definitivi di `inflate/gravity/restoreK/speedGate/leashRadius/pokeForce` + `dt/viscosity` e bakearli come default. Se Alberto vuole dosare lo slow-mo dal vivo, aggiungere un knob **`timeScale`** live (richiede di ricostruire le 3 pipeline del solver al cambio — nessun edit shader).
2. **(Opzionale, "Option B") foam/spray effimero**: strato separato di particelle diffuse/schiuma (sprite, lifetime/opacity) per lo spruzzo che **svanisce** (design `CLAUDE.md` "pelle schiuma"). La SSF attuale non dissolve singole particelle → serve un pass sprite a parte.
3. **Polish acqua** (docs/12): `s_corr` (coesione/bordi tondi), vorticity, sleeping. **Perf/mobile** (tier, scalare particelle) + **verifica visiva mobile**. **Sfondo** dietro la "A".
4. **Nit minori** (da review avversariale): `swaySpeed=0` dà un tilt fisso invece di head-on (default 0.35 non lo raggiunge); `AUTO_ROTATE`+sway in conflitto se riabilitato (oggi dead-code, `AUTO_ROTATE=false`).

## Knowledge base
- **`docs/12-PARTICLE-PHYSICS.md`** — PBD / PBF / Unified (algoritmi, equazioni, parametri, note WebGPU) + mapping sul nostro hero + **Parte D-bis = piano splash**.
- **Memoria persistente**: `~/.claude/projects/.../memory/ssf-water-state-2026-06.md` — cronologia dettagliata + tutte le lezioni di questa sessione.
- Cloni reference **UNTRACKED** (locali): `.analysis-clones/WaterBall` (+ `Splash`) — sorgente dell'embed.
