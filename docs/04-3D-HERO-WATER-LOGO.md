# 04 — 3D Hero Water Logo (GPGPU AT/A particle mark)

> Scopo: direttive operative complete per costruire il logo `AT/A` della Hero (S1) come nuvola di particelle d'acqua GPGPU a due strati (`body` + `skin`), con doppio backend WebGPU/WebGL2, fisica a molla under-damped (risacca), shading "acqua" (deep teal → foam white), Bloom selettivo + DOF locale, tiering performance e pipeline asset GLB. Questo è il documento tecnico più importante della suite: gli agenti lo seguono alla lettera. Stack e versioni in [`docs/01-TECHSTACK.md`](./01-TECHSTACK.md); token e colori in [`docs/02-DESIGN.md`](./02-DESIGN.md); montaggio scena/store/canvas globale in [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md).

---

## 1. Obiettivo e riferimento

Il logo `AT/A` non è una mesh renderizzata: è una **massa d'acqua viva fatta di particelle**, campionata dalla superficie di un GLB e tenuta in forma da una molla. A riposo "respira" con un moto ondoso lento; al passaggio del puntatore la superficie **schizza, si disperde, indugia e rientra come una risacca**. È lo stesso impianto tecnico di `ParticleDissolve` di Sersan, riadattato dal look "spore ciano" a un look **acqua/oceano della Sardegna**.

Architettura a **due strati sovrapposti** che condividono la stessa geometria di campionamento ma hanno fisica e materiale diversi:

- **`body` (corpo / volume)** — denso, opaco, `NormalBlending`, `depthWrite: true`. È la massa scura/teal della lettera, quasi ferma: molla alta, damping alto (`zeta ~0.5–0.6`, vicino al critico), push/raggio piccoli. Fa da volume solido e scrive il depth.
- **`skin` (pelle / spray)** — superficie offsettata lungo la normale, `AdditiveBlending`, `depthWrite: false`, semitrasparente, punto più grande e luminoso (target del Bloom). **È lo strato protagonista**: molla bassa, damping basso (`zeta ~0.35–0.4`, under-damped), push/raggio grandi → parte per prima, vola lontano, rientra lenta. Sono le goccioline/schiuma ciano-bianca.

**Render order vincolante**: prima il `body` (scrive depth), poi la `skin` additiva sopra. Vedi §3.

Riferimento estetico di qualità: Lusion "Surface Floater" (SDF + curl noise + velocity-color) e i case study Awwwards (vedi [`docs/06-REFERENCES.md`](./06-REFERENCES.md)). Studiare, non copiare.

---

## 2. Architettura target (scene graph)

Gruppo `HeroLogo` montato nel Canvas R3F persistente globale (vedi [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md), sezione Canvas globale + overlay DOM). Struttura:

```
<group name="HeroLogo">           // posizione/scala guidate da scrollStore (parallax leggero)
  <points name="body" />          // renderOrder = 0, NormalBlending,   depthWrite true
  <points name="skin" />          // renderOrder = 1, AdditiveBlending,  depthWrite false
</group>
```

Regole non negoziabili:

- **`frustumCulled = false`** su entrambi i `<points>`: le particelle escono dal bounding box originale quando si disperdono; senza questo flag spariscono a metà schizzo.
- Entrambi gli strati usano una `BufferGeometry` con `size * size` vertici (un vertice = una particella). L'attributo posizione iniziale è irrilevante: la posizione reale arriva dalla simulazione (texture FBO su WebGL2, storage buffer su WebGPU — vedi §5).
- Un solo `HeroLogo` monta **entrambe** le simulazioni con `gpgpuConfig` diverso (`BODY_LAYER` / `SKIN_LAYER`, vedi §8).
- Il puntatore arriva da `pointerStore` (Zustand) già proiettato sul piano della Hero in coordinate mondo; non leggere `window` dentro il loop. Vedi store in [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md).
- Il loop di update (sim + uniform) gira nel **FrameDriver** condiviso, sincronizzato con Lenis in un unico `requestAnimationFrame` (vedi [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md)). La sim non deve registrare un proprio rAF.

---

## 3. Render order, blending, depth

Sequenza per frame (entrambi gli strati nello stesso pass del Canvas globale):

1. **`body`** — `renderOrder = 0`, `NormalBlending`, `depthTest: true`, `depthWrite: true`. Stabilisce il depth della massa.
2. **`skin`** — `renderOrder = 1`, `AdditiveBlending`, `depthTest: true`, `depthWrite: false`. Si somma sopra senza occludere se stessa; il `depthWrite: false` evita l'ordinamento patologico delle particelle additive.

```ts
// estratto materiale (vale per ShaderMaterial GLSL e per il NodeMaterial TSL)
body.material.blending  = THREE.NormalBlending;
body.material.depthWrite = true;
body.renderOrder = 0;

skin.material.blending  = THREE.AdditiveBlending;
skin.material.depthWrite = false;
skin.material.transparent = true;
skin.renderOrder = 1;
```

Motivo: la schiuma additiva deve "accendersi" sopra il volume; se scrivesse depth, le particelle veloci nasconderebbero quelle dietro creando buchi neri nel Bloom.

---

## 4. Sampling del GLB → posizioni "home"

Le posizioni bersaglio della molla ("home") si ottengono campionando la **superficie** del GLB `at-mark.glb` con `MeshSurfaceSampler` (Three.js), front-biased verso la camera. Una passata genera `size * size` campioni; ogni campione produce una `home` + una `normal` usate per derivare l'offset di strato.

Funzione di campionamento condivisa `sampleMarkLayerField`:

- **`frontBias`** — pesa il campionamento verso le facce rivolte alla camera (normale ⋅ viewDir > 0), così la nuvola "guarda" l'utente e non spreca particelle sul retro. Per il `body` il bias è minore (riempie più volume); per la `skin` è maggiore (resta in superficie visibile).
- **`normalOffset`** — spinge la `home` verso l'esterno lungo la normale. **Skin**: offset positivo apprezzabile (la pelle vive sopra il volume). **Body**: offset ~0.
- **`volumeJitter`** — solo per il `body`: piccolo jitter verso l'interno lungo la normale per dare **fake-volume** (la lettera non è una buccia cava ma una massa). Skin: `volumeJitter = 0`.

```ts
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import * as THREE from "three";

type LayerFieldOptions = {
  size: number;          // lato della griglia: 256 / 448 (full), 128 / 224 (lite)
  frontBias: number;     // 0..1 — quanto pesare le facce front-facing
  normalOffset: number;  // offset lungo la normale (world units)
  volumeJitter: number;  // jitter interno per fake-volume (solo body)
  viewDir: THREE.Vector3;
};

/** Ritorna home RGBA float (xyz = posizione, w = seed per-particella) + normali. */
export function sampleMarkLayerField(mesh: THREE.Mesh, o: LayerFieldOptions) {
  const count = o.size * o.size;
  const sampler = new MeshSurfaceSampler(mesh).build();

  const home = new Float32Array(count * 4);   // -> DataTexture RGBA float
  const normals = new Float32Array(count * 3);

  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  let written = 0, guard = 0;
  while (written < count && guard < count * 8) {
    guard++;
    sampler.sample(p, n);
    // front-bias: scarta probabilisticamente le facce rivolte via dalla camera
    const facing = n.dot(o.viewDir);            // >0 = verso camera
    if (Math.random() > THREE.MathUtils.lerp(1 - o.frontBias, 1, (facing + 1) * 0.5)) continue;

    const i4 = written * 4, i3 = written * 3;
    const offset = o.normalOffset - Math.random() * o.volumeJitter; // jitter solo verso l'interno
    home[i4 + 0] = p.x + n.x * offset;
    home[i4 + 1] = p.y + n.y * offset;
    home[i4 + 2] = p.z + n.z * offset;
    home[i4 + 3] = Math.random();               // seed: fase del curl-noise, variazione punto
    normals[i3 + 0] = n.x; normals[i3 + 1] = n.y; normals[i3 + 2] = n.z;
    written++;
  }
  return { home, normals, count };
}
```

**`aRef` — griglia di riferimento per-istanza.** A ogni particella va dato un riferimento stabile `(u, v)` nella griglia `size × size`, usato:
- su **WebGL2** come UV per leggere la propria posizione dalla texture FBO ping-pong;
- su **WebGPU** come `instanceIndex` per indicizzare lo storage buffer.

```ts
// aRef: coordinate di cella normalizzate [0..1], una per particella
const aRef = new Float32Array(count * 2);
for (let i = 0; i < count; i++) {
  aRef[i * 2 + 0] = (i % size) / size;
  aRef[i * 2 + 1] = Math.floor(i / size) / size;
}
geometry.setAttribute("aRef", new THREE.BufferAttribute(aRef, 2));
```

Le `home` vanno caricate in una `DataTexture` RGBA float (`THREE.FloatType`, `nearest`, no mipmaps) lato WebGL2, e nello storage buffer `home` lato WebGPU. La generazione del campo va fatta **una sola volta** dopo il load del GLB (non per frame).

---

## 5. Fisica a molla del 2° ordine (per-particella, sul GPU)

Stessa equazione per i due backend; cambiano solo i numeri (vedi tabella tuning §9). Integrazione esplicita per particella, damping frame-rate-independent:

```
toHome   = home - pos
acc      = SPRING * toHome

fromMouse = pos - mouse
d         = length(fromMouse)
if (d < RADIUS) {
    acc += normalize(fromMouse) * pow(1.0 - d / RADIUS, 2.0) * PUSH
}

acc      += curlNoise(pos * NOISE_SCALE + seed) * (TURB_BASE + TURB_MOVE * dispersion)

vel      += acc * dt
vel      *= exp(-DAMPING * dt)        // damping frame-rate independent
if (length(vel) > MAX_SPEED) vel = normalize(vel) * MAX_SPEED   // clamp
pos      += vel * dt
```

- **`dispersion`** è un fattore 0..1 che misura quanto la particella è lontana da `home` (o un global "agitation" che sale con il movimento del mouse): aumenta la turbolenza quando la nuvola è disturbata, così lo spray "ribolle" mentre vola e si calma quando rientra.
- **`curlNoise`** è il campo curl-noise condiviso in `src/webgl/curves/curlNoise` (divergence-free → moto fluido, non caotico). Lo stesso noise dà il moto ondoso a riposo (vedi §6).

**Feel = `zeta`.** Il carattere della molla è governato dal rapporto di smorzamento:

```
zeta = DAMPING / (2 * sqrt(SPRING))
```

- `zeta ≈ 1` → critico (rientro netto, niente oscillazione).
- **`body`: `zeta ≈ 0.5–0.6`** → quasi critico, massa solida che torna in forma senza ballonzolare.
- **`skin`: `zeta ≈ 0.35–0.4`** → **under-damped**: la pelle **oltrepassa la home, si ritira e rientra ondeggiando** — è esattamente la **risacca**. È ciò che rende il logo "acqua" e non "fumo". Mantieni la skin under-damped; se la regoli, ricalcola `zeta` da `SPRING`/`DAMPING` e verifica che resti in `[0.35, 0.42]`.

`dt` va clampato (es. `min(realDt, 1/30)`) per evitare esplosioni quando la tab perde frame.

---

## 6. Doppio backend (il punto critico)

Il rendering deve essere **identico** tra WebGPU e WebGL2. Cambia solo *dove vive lo stato* delle particelle.

### 6.1 Detection del backend

Il `WebGPURenderer` di three lascia `isWebGLBackend` **`undefined`** (non `false`) quando gira su WebGPU, ed espone `gl.compute`. Detection canonica:

```ts
// src/webgl/renderer/createRenderer.ts (vedi docs/03-ARCHITECTURE.md)
const backend = renderer.backend as any;
const gl = renderer as any;
export const webgpuEnabled =
  backend?.isWebGLBackend !== true && typeof gl.compute === "function";
```

`webgpuEnabled === true` → percorso TSL/compute (§6.2). `false` → percorso GLSL/FBO (§6.3). Questo flag decide quale `gpgpuNodeSim` / `gpgpuSim` montare.

### 6.2 WebGPU — compute shader + storage buffer (TSL) — PERCORSO PREFERITO

Su WebGPU **NON si usa l'FBO ping-pong**. Lo scramble dell'FBO nasce dal leggere la render-target nel **vertex stage** con `textureSample`, che richiede le derivate (dFdx/dFdy): nel vertex stage non esistono, quindi il sampler si comporta in modo non definito e le posizioni si "orientano"/mescolano. La soluzione WebGPU-native elimina il bug alla radice:

- Stato in `instancedArray` (storage buffer): `positionBuffer`, `velocityBuffer`, `homeBuffer`, dimensione `count`.
- La fisica è una `Fn().compute(count)` lanciata con `renderer.compute(simNode)` una volta per frame **prima** del render.
- Il render legge la posizione **direttamente dallo storage** nel vertex stage: `positionBuffer.element(instanceIndex)`. Niente sampler, niente texture, niente orientamento → bug impossibile.

```ts
// src/webgl/gpgpu/gpgpuNodeSim.ts (TSL)
import {
  Fn, instancedArray, instanceIndex, uniform,
  vec3, float, length, normalize, pow, exp, min, max,
} from "three/tsl";

export function makeNodeSim(count: number, home: Float32Array, cfg: LayerConfig) {
  const positionBuffer = instancedArray(count, "vec3");
  const velocityBuffer = instancedArray(count, "vec3");
  const homeBuffer     = instancedArray(count, "vec3");

  const uMouse = uniform(vec3(0));
  const uDt    = uniform(float(0));
  const uDisp  = uniform(float(0)); // dispersion / agitation globale

  // init: copia home nei buffer pos/home (eseguito una volta)
  const init = Fn(() => {
    const h = /* read home[instanceIndex] caricato come attribute/array */ vec3();
    positionBuffer.element(instanceIndex).assign(h);
    homeBuffer.element(instanceIndex).assign(h);
    velocityBuffer.element(instanceIndex).assign(vec3(0));
  })().compute(count);

  const update = Fn(() => {
    const pos  = positionBuffer.element(instanceIndex);
    const vel  = velocityBuffer.element(instanceIndex);
    const home = homeBuffer.element(instanceIndex);

    const toHome = home.sub(pos);
    const acc = toHome.mul(cfg.SPRING).toVar();

    const fromMouse = pos.sub(uMouse);
    const d = length(fromMouse);
    // push radiale ammorbidito quadraticamente
    const f = pow(max(float(0), float(1).sub(d.div(cfg.RADIUS))), float(2));
    acc.addAssign(normalize(fromMouse).mul(f).mul(cfg.PUSH));

    // curl-noise: TURB_BASE + TURB_MOVE * dispersion
    acc.addAssign(curlNoiseTSL(pos.mul(cfg.NOISE_SCALE)).mul(
      float(cfg.TURB_BASE).add(uDisp.mul(cfg.TURB_MOVE))
    ));

    vel.addAssign(acc.mul(uDt));
    vel.mulAssign(exp(float(-cfg.DAMPING).mul(uDt))); // damping FR-indep
    const sp = length(vel);
    vel.assign(sp.greaterThan(cfg.MAX_SPEED).select(normalize(vel).mul(cfg.MAX_SPEED), vel));
    pos.addAssign(vel.mul(uDt));
  })().compute(count);

  return { positionBuffer, velocityBuffer, uMouse, uDt, uDisp, init, update };
}
```

Loop per frame (dentro FrameDriver):

```ts
uMouse.value.copy(pointer.world);
uDt.value = Math.min(dt, 1 / 30);
uDisp.value = agitation;
renderer.compute(sim.update);   // gl.compute()
// poi il render dei <points> legge positionBuffer.element(instanceIndex)
```

Render shader (vertex stage), nessun sampler:

```ts
// posizione della particella letta dallo storage, non da texture
material.positionNode = sim.positionBuffer.element(instanceIndex);
```

### 6.3 WebGL2 — GLSL con FBO ping-pong (fallback)

Su WebGL2 si usa il classico GPGPU stile `GPUComputationRenderer`: due render target float che si scambiano (ping-pong); la fisica gira in un fragment shader; il vertex shader del render legge la posizione dalla texture **usando `aRef` come UV** (lettura puntuale, `texelFetch`/`texture` con filtro nearest — qui siamo nel render, non c'è il problema delle derivate del caso WebGPU).

```glsl
// gpgpuSim.ts — fragment (compute) WebGL2
uniform sampler2D uPos;     // posizioni correnti (RGBA float)
uniform sampler2D uVel;     // velocità correnti
uniform sampler2D uHome;    // posizioni home
uniform vec3  uMouse;
uniform float uDt, uDisp;
uniform float SPRING, DAMPING, PUSH, RADIUS, MAX_SPEED, TURB_BASE, TURB_MOVE, NOISE_SCALE;
varying vec2 vUv;

void main() {
  vec3 pos  = texture(uPos,  vUv).xyz;
  vec3 vel  = texture(uVel,  vUv).xyz;
  vec3 home = texture(uHome, vUv).xyz;

  vec3 acc = SPRING * (home - pos);

  vec3 fromMouse = pos - uMouse;
  float d = length(fromMouse);
  if (d < RADIUS) acc += normalize(fromMouse) * pow(1.0 - d / RADIUS, 2.0) * PUSH;

  acc += curlNoise(pos * NOISE_SCALE) * (TURB_BASE + TURB_MOVE * uDisp);

  vel += acc * uDt;
  vel *= exp(-DAMPING * uDt);
  float sp = length(vel);
  if (sp > MAX_SPEED) vel = normalize(vel) * MAX_SPEED;
  pos += vel * uDt;

  // due MRT / due pass: scrive pos in RT0, vel in RT1
  gl_FragColor = vec4(pos, 1.0);
}
```

```glsl
// render vertex WebGL2 — legge la propria posizione dalla texture via aRef
attribute vec2 aRef;
uniform sampler2D uPos;
void main() {
  vec3 p = texture(uPos, aRef).xyz;   // lettura puntuale: aRef = cella nella griglia size×size
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPointSize * (1.0 / -mvPosition.z); // attenuazione prospettica
}
```

### 6.4 Fallback statico analitico (estremo)

Per GPU senza vertex-texture affidabile o per `prefers-reduced-motion`: **non montare la sim**. I `<points>` restano alle posizioni `home` con dispersione **analitica** calcolata nel vertex shader (billboard alle home + piccolo offset deterministico da `seed`/curl-noise valutato a costo zero, niente stato persistente, niente puntatore). Nessun `compute`, nessun FBO. È statico/quasi-statico ma in forma e leggibile. Vedi gating §10.

---

## 7. Shading acqua

L'obiettivo è leggere come **acqua**, non come polvere: gradiente profondità→superficie, colore per velocità, fresnel sul bordo, accenni di caustiche e micro-rifrazione, moto ondoso a riposo.

### 7.1 Colore per velocità (deep teal → foam white)

Colore guidato dalla velocità: ferma = profondità scura/teal, veloce = schiuma ciano-bianca.

```glsl
// COL_COLD / COL_HOT dal Knowledge Pack (vedi docs/02-DESIGN.md)
const vec3 COL_COLD = vec3(0.06, 0.30, 0.34); // teal scuro (a riposo, profondità)
const vec3 COL_HOT  = vec3(0.75, 0.98, 1.00); // ciano-bianco (in moto, schiuma)

float speed = length(vVel);
vec3 col = mix(COL_COLD, COL_HOT, smoothstep(0.0, MAX_SPEED, speed));
```

`COL_COLD`/`COL_HOT` mappano su `--aqua`/`--aqua-hot`/`--abyss-glow` del sistema token (vedi [`docs/02-DESIGN.md`](./02-DESIGN.md)). Il `--gold` (golden-hour) si usa **solo** per rari picchi sole-su-acqua sulla schiuma più veloce, con estrema parsimonia.

### 7.2 Fresnel + micro-rifrazione sul bordo

Sul bordo del punto e in funzione dell'angolo di vista, alza la luminosità (riflesso speculare/fresnel) e introduci una micro-distorsione dell'alpha per simulare la rifrazione della goccia:

```glsl
float fres = pow(1.0 - max(dot(vNormalView, viewDir), 0.0), 3.0);
col += fres * 0.25 * COL_HOT;                  // bordo luminoso
float edge = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); // punto rotondo soft
float alpha = edge * vAlpha * (0.85 + 0.15 * fres);
```

### 7.3 Caustiche accennate + moto ondoso a riposo

- **Caustiche**: modulazione lieve della luminanza con un noise a bassa frequenza scrollato lentamente (solo accenno, non un pattern marcato).
- **Moto ondoso a riposo**: anche con mouse fermo, applica una spinta lungo la normale guidata dal curl-noise a bassa ampiezza (`TURB_BASE`), così la massa "respira" come acqua ferma mossa dalla corrente. È la stessa `curlNoise` della fisica (§5).

### 7.4 Per strato

| Aspetto | `body` | `skin` |
|---|---|---|
| Blending | `NormalBlending` | `AdditiveBlending` |
| depthWrite | `true` | `false` |
| Point size | piccolo, costante | grande, varia con la velocità |
| Alpha | opaco/alto | semitrasparente |
| Emissive | basso | alto (è il target del Bloom) |
| Ruolo colore | gradiente profondità (più freddo) | foam: salta verso `COL_HOT` |

La **skin** è ciò che brilla nel Bloom; il **body** dà la silhouette leggibile della lettera.

---

## 8. File da creare

Tutti sotto `src/webgl/` (struttura in [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md)):

| File | Contenuto |
|---|---|
| `src/webgl/geometry/atMark.ts` | Load `at-mark.glb`, estrazione mesh, `sampleMarkLayerField`, costruzione `home`/`aRef`/normali per i due strati. |
| `src/webgl/gpgpu/gpgpuConfig.ts` | `BODY_LAYER` e `SKIN_LAYER`: tutti i numeri della tabella §9 + `size` per tier. |
| `src/webgl/gpgpu/gpgpuSim.ts` | Simulazione GLSL FBO ping-pong (percorso WebGL2). |
| `src/webgl/gpgpu/gpgpuNodeSim.ts` | Simulazione TSL compute + storage buffer (percorso WebGPU). |
| `src/webgl/gpgpu/gpgpuRenderShader.ts` | Materiale di render condiviso (vertex legge pos da texture o storage; fragment = shading acqua §7). |
| `src/webgl/HeroLogo.tsx` | Componente R3F: monta GLB, sceglie backend (`webgpuEnabled`), istanzia le due sim + i due `<points>`, applica render order/blending, collega `pointerStore`/`scrollStore`, registra l'update nel FrameDriver. |

`gpgpuConfig.ts` esporta una shape tipizzata:

```ts
export type LayerConfig = {
  SIZE: number; SPRING: number; DAMPING: number; PUSH: number; RADIUS: number;
  MAX_SPEED: number; TURB_BASE: number; TURB_MOVE: number; NOISE_SCALE: number;
  POINT_SIZE: number; POINT_ALPHA: number; EMISSIVE: number;
  blending: "Normal" | "Additive"; depthWrite: boolean;
  COL_COLD: [number, number, number]; COL_HOT: [number, number, number];
};
```

---

## 9. Tabella TUNING (valori di partenza)

Numeri di partenza orientati all'acqua, derivati dai range Sersan. `zeta` calcolato da `DAMPING / (2*sqrt(SPRING))`. Sono **starting points** da rifinire a occhio in `leva` (tree-shaken in prod).

| Parametro | `BODY` (volume) | `SKIN` (spray/foam) | Note |
|---|---|---|---|
| `SIZE` (lato griglia) | 256 (full) / 128 (lite) | 448 (full) / 224 (lite) | skin più densa = look |
| `SPRING` | 36 | 20 | body rigido, skin morbida |
| `DAMPING` | 6.2 | 3.5 | — |
| `zeta` risultante | **0.52** (6.2 / 2√36) | **0.39** (3.5 / 2√20) | body ~critico, skin under-damped |
| `PUSH` | 22 | 62 | skin schizza lontano |
| `RADIUS` | 0.55 | 1.35 | skin reagisce su area ampia |
| `MAX_SPEED` | 6.0 | 14.0 | clamp velocità |
| `TURB_BASE` | 0.15 | 0.45 | moto ondoso a riposo |
| `TURB_MOVE` | 0.4 | 1.6 | ribollio quando disturbata |
| `NOISE_SCALE` | 0.6 | 0.9 | frequenza curl-noise |
| `POINT_SIZE` | 1.5 px | 3.0 px (→ velocità) | skin più grande |
| `POINT_ALPHA` | 0.95 | 0.45 | skin semitrasparente |
| `EMISSIVE` | 0.1 | 0.9 | skin = target Bloom |
| `blending` | `NormalBlending` | `AdditiveBlending` | — |
| `depthWrite` | `true` | `false` | — |
| `COL_COLD` | `[0.04, 0.22, 0.27]` | `[0.06, 0.30, 0.34]` | body più scuro/profondo |
| `COL_HOT` | `[0.40, 0.85, 0.92]` | `[0.75, 0.98, 1.00]` | skin = foam quasi bianco |

Regola di tuning: se il feel "acqua" si perde, **abbassa lo `zeta` della skin** (più under-damped → più risacca) prima di toccare altro; se diventa caotica, alza `DAMPING` skin o abbassa `TURB_MOVE`.

---

## 10. Tier / performance & reduced-motion

Tre tier (lo store `fxStore` espone il tier corrente; vedi [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md)):

| Tier | `body SIZE` | `skin SIZE` | PostFX | Quando |
|---|---|---|---|---|
| **full** | 256 | 448 | Bloom + DOF | desktop recente, 60fps stabili |
| **lite** | 128 | 224 | solo Bloom leggero | mobile / GPU media |
| **off** | — | — | nessuno | reduced-motion o GPU debole → fallback statico §6.4 |

- **Budget**: 60fps su desktop recente. Se non regge, **scala prima la densità della `skin`** (è il costo dominante e il degrado è meno visibile sul body). Poi riduci PostFX, poi il body.
- **`prefers-reduced-motion`** e il toggle "reduce motion": tier `off` → non montare la sim, monta il fallback statico analitico (§6.4), niente push del mouse.
- **Lazy**: la scena Hero e il GLB sono lazy-loaded; il preloader mostra la percentuale (vedi motion language in [`docs/02-DESIGN.md`](./02-DESIGN.md)).
- **A11y**: il Canvas è decorativo → `aria-hidden`; il nome/ruolo testuale vive nell'overlay DOM leggibile dagli screen reader (vedi [`docs/03-ARCHITECTURE.md`](./03-ARCHITECTURE.md)).

---

## 11. Pipeline asset del GLB `AT/A`

Output finale obbligatorio: `public/models/at-mark.glb`. Catena (dettaglio setup MCP e passi manuali in [`docs/09-MCP.md`](./09-MCP.md)):

1. **Genera** la mesh con **Blender MCP** (Hyper3D Rodin / Hunyuan3D text-to-3D). Prompt di riferimento:
   > `A sculpted monogram letter mark combining "A" and "T" (AT), bold geometric serif, solid carved volume like polished stone, smooth closed manifold surface, centered, neutral, no base, no text label.`
   Obiettivo: una lettera/monogramma `AT` **scolpito**, volume pieno, superficie chiusa e pulita (serve per il `MeshSurfaceSampler`).
2. **Pulisci in Blender**: scala normalizzata (~2 unità di altezza), origine al centro, normali coerenti verso l'esterno, mesh manifold, decimazione a una densità ragionevole (il dettaglio fine arriva dalle particelle, non dai poligoni).
3. **Export GLB** da Blender.
4. **Ottimizza** con `gltf-transform`: Draco/Meshopt sulla mesh, KTX2/Basis sulle texture (anche se il sampling usa solo la geometria, mantieni la pipeline standard).
   ```bash
   bunx @gltf-transform/cli optimize at-mark.raw.glb at-mark.glb \
     --compress meshopt --texture-compress ktx2
   ```
5. **Tipizza** con `gltfjsx` per ottenere un componente R3F tipizzato di riferimento (non lo si renderizza come mesh: serve solo per accedere alla geometria in modo tipato).
   ```bash
   bunx gltfjsx public/models/at-mark.glb --types --transform
   ```
6. Colloca il file finale in `public/models/at-mark.glb`.

> **Nota**: Alberto deve eseguire una-tantum i passi manuali di Blender MCP (install `uv`, Blender 3.0+, addon BlenderMCP, "Connect to Claude", chiave Hyper3D/fal.ai). Gli agenti **non possono** installare/avviare Blender da soli. Procedura completa in [`docs/09-MCP.md`](./09-MCP.md).

---

## 12. QA / Done-when

Checklist di accettazione (QA visivo via `claude-in-chrome`, vedi [`docs/11-WORKFLOW.md`](./11-WORKFLOW.md)):

- [ ] Il logo `AT/A` è leggibile come lettera a riposo (silhouette del body chiara).
- [ ] A riposo c'è un **moto ondoso lento** (respira), niente immobilità innaturale.
- [ ] Al passaggio del puntatore la **skin si disperse**, vola lontano, **indugia e rientra** con oscillazione (risacca verificabile: la skin oltrepassa la home prima di assestarsi).
- [ ] Il colore vira da deep teal (fermo) a foam ciano-bianco (veloce); la schiuma veloce **brilla nel Bloom**, il body no.
- [ ] **Render identico** tra WebGPU e WebGL2 (stesso frame, stessa lettura visiva — confronto screenshot affiancati). Nessun "scramble"/orientamento delle particelle su WebGPU.
- [ ] `prefers-reduced-motion`: nessuna sim, fallback statico in forma, niente reazione al mouse.
- [ ] **60fps** su desktop recente (tier full); degrado a `lite`/`off` corretto su mobile.
- [ ] **Console pulita**: nessun warning WebGPU/TSL, nessun errore di shader, nessun `NaN` nelle posizioni.
- [ ] Particelle non spariscono ai bordi quando si disperdono (`frustumCulled = false` verificato).
- [ ] DOF locale alla Hero non sfoca l'overlay DOM (testo nitido).

---

## 13. Riferimenti tecnici (dal Knowledge Pack)

Da citare/consultare anche in [`docs/06-REFERENCES.md`](./06-REFERENCES.md):

- Three.js Journey — **GPGPU Flow Field Particles**
- Three.js Journey — **Particles Morphing Shader**
- Codrops — **"Crafting a Dreamy Particle Effect with Three.js and GPGPU"**
- Codrops — **"Dissolve Effect with Shaders and Particles"**
- Codrops — **"Surface Sampling in Three.js"**
- Codrops — **"WebGPU Gommage Effect (TSL dissolve)"**
- Wawa Sensei — **"GPGPU particles with TSL & WebGPU"**
- Lusion — **"Surface Floater"** (SDF + curl noise + velocity) e il case study Awwwards

Skill da attivare (routing in [`docs/10-SKILLS.md`](./10-SKILLS.md)): `threejs-shaders`, `shader-programming-glsl`, `threejs-postprocessing`, `threejs-loaders`, `threejs-interaction`, `fixing-motion-performance`, `web-performance-optimization`, `ui-visual-validator`. Per le versioni esatte delle API (three 0.184, TSL) consultare Context7 prima di scrivere shader (vedi [`docs/08-CONTEXT7.md`](./08-CONTEXT7.md)).
