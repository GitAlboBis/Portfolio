# 05 — Cinematic Scroll (Pan di Zucchero → Backflip)

> Scopo: definire alla lettera la sezione cinematica S3 del portfolio — due clip video generate con Higgsfield (establishing aereo dello scoglio Pan di Zucchero al tramonto, poi backflip/tuffo di Alberto dallo scoglio), guidate dallo scroll (scroll-scrub), unite da una transizione-zoom, con overlay WebGL (DOF, spray, color grade, vignette) coerente con l'hero. Questo file e la fonte di verita per chiunque costruisca S3: contiene storyboard, prompt Higgsfield concreti, specifiche asset, snippet di scrub e di piano video WebGL, budget di performance, fallback e checklist done-when.

Documenti correlati (usare i path del MANIFEST):
- Stack e versioni vincolanti: `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/01-TECHSTACK.md`
- Art direction, token oceano, color grade: `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/02-DESIGN.md`
- Canvas globale, sync Lenis↔R3F, store, mappa scena↔sezione: `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/03-ARCHITECTURE.md`
- Materiale acqua / particelle hero da cui ereditare il look: `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/04-3D-HERO-WATER-LOGO.md`
- Riferimenti di qualita (Lusion, Codrops, ecc.): `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/06-REFERENCES.md`
- Routing MCP (Higgsfield, Vercel, claude-in-chrome): `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/09-MCP.md`
- Routing skill (remotion, scroll-experience, video/asset): `C:/Users/alber/Desktop/PortfolioAlbertoTuveri/docs/10-SKILLS.md`

---

## 1. Concept e storyboard (S3)

S3 e il cuore emotivo del portfolio: lega il tema marino della Sardegna alla persona di Alberto. La sezione e **pinnata** (GSAP ScrollTrigger pin) e occupa un tratto di scroll esteso; tutto cio che accade dentro e funzione di `scrollStore.progress` della sezione (0 → 1), non dell'altezza naturale del DOM.

Mappa narrativa (progress locale 0 → 1):

| Beat | progress | Cosa accade | Layer protagonista |
|------|----------|-------------|--------------------|
| B0 — Open Sea | 0.00 → 0.12 | Si entra sul mare aperto. Clip A parte dal frame 0 (mare, orizzonte, luce dorata). Eyebrow EN/IT fade-in. | Clip A (video) |
| B1 — Approach | 0.12 → 0.45 | Avvicinamento aereo allo scoglio Pan di Zucchero. `video.currentTime` di A scrubbato linearmente. Parallax leggero overlay. | Clip A (video) |
| B2 — Arrival | 0.45 → 0.58 | "Arrivo" allo scoglio: la camera/quad si avvicina al punto-scoglio. Inizia la transizione-zoom. | Clip A → transizione |
| B3 — Zoom-cut | 0.58 → 0.66 | Zoom-transition DENTRO la clip B: scale/FOV push verso il punto-scoglio + crossfade A→B + spray peak. | Crossfade A↔B |
| B4 — Backflip | 0.66 → 0.92 | Clip B scrubbata: la figura esegue il backflip e si tuffa, slow-motion cinematografico. Color grade oceano al massimo. | Clip B (video) |
| B5 — Splash-out | 0.92 → 1.00 | Tuffo/impatto in acqua; spray peak; crossfade verso S4 (curtain + scene crossfade, vedi 03-ARCHITECTURE). | Uscita → S4 Work |

Regole di beat:
- I tagli sono **guidati dallo scroll**, mai temporizzati. Se l'utente si ferma, il frame si ferma. Se scrolla indietro, l'animazione torna indietro fluidamente (reversibile, no stati one-shot non reversibili).
- Le label di testo (eyebrow/heading EN/IT) entrano con split-text GSAP (vedi 02-DESIGN) ancorate ai beat, non al tempo.
- Lo spray dell'overlay WebGL deve "battere" sui due picchi: B3 (zoom-cut) e B5 (splash-out). Stesso vocabolario visivo delle particelle dell'hero (04-3D-HERO-WATER-LOGO): `COL_HOT` `[0.75, 0.98, 1.0]` per la schiuma luminosa.

---

## 2. Generazione video con Higgsfield (MCP)

Decisione bloccata: i video sono **generati con Higgsfield** (MCP, vedi `09-MCP.md`). Alberto puo fornire footage reale come riferimento o come sostituto (specie per clip B, il backflip): se fornito footage reale, lo si usa al posto del generato e si saltano i prompt sotto. Trattare i video generati come placeholder sostituibili: i nomi file e le specifiche tecniche restano identici.

### 2.1 Clip A — Establishing / avvicinamento aereo

- **Soggetto**: faraglione mediterraneo (proxy di Pan di Zucchero / Masua, Sulcis-Iglesiente) che emerge dal mare aperto, ripresa aerea in avvicinamento, ora dorata.
- **Durata**: 6 s. **Risoluzione**: 1440p (2560×1440) se disponibile, altrimenti 1080p. **FPS**: 24 (look cinematografico) o 30. **Aspect**: 16:9.
- **Movimento**: dolly/drone in avvicinamento lento e costante (no stacchi), cosi `currentTime` mappa linearmente sul progress senza salti percettivi.

Prompt EN per Higgsfield (clip A):

```text
Cinematic aerial drone shot, slow forward push toward a tall limestone sea
stack rising out of the open Mediterranean, golden-hour light, Sardinian
coastline (Sulcis-Iglesiente vibe, Pan di Zucchero), deep teal water with
gentle swell and foam, warm rim light on the rock, soft volumetric haze,
shallow depth of field, color graded teal-and-gold, ultra-detailed,
35mm anamorphic look, no people, no text, no logos, steady continuous motion,
6 seconds, 24fps, 16:9.
```

Negative / da evitare: testo, watermark, persone, tagli di camera, motion-blur eccessivo, look HDR finto.

### 2.2 Clip B — Backflip / tuffo dallo scoglio

- **Soggetto**: figura singola che esegue un backflip tuffandosi da uno scoglio nel mare, slow-motion cinematografico. Coerente con il faraglione di clip A (stessa palette, stessa luce dorata).
- **Durata**: 5 s. **Risoluzione**: 1440p / 1080p. **FPS**: 24. **Aspect**: 16:9.
- **Movimento**: camera semi-fissa o orbita lenta; il movimento principale e il salto. Slow-motion garantisce abbastanza frame per uno scrub fluido.

Prompt EN per Higgsfield (clip B):

```text
Cinematic slow-motion shot of a single athletic figure performing a backflip
dive off a coastal rock cliff into deep teal Mediterranean water, golden-hour
side light, water spray and foam catching the light, Sardinian sea-stack in
the background, shallow depth of field, dramatic silhouette, color graded
teal-and-gold to match an aerial establishing shot, 35mm anamorphic look,
no text, no logos, 5 seconds, 24fps, 16:9, high frame count for smooth scrub.
```

Negative / da evitare: morphing degli arti, piu di una figura, testo/watermark, stacchi di camera, sfondo incoerente con clip A.

### 2.3 Continuita tra A e B (obbligatoria per la transizione-zoom)

Per far funzionare lo zoom-cut B3 le due clip devono condividere: stessa palette teal-and-gold, stessa direzione della luce (golden-hour da lato), il punto-scoglio di A allineabile col punto di stacco di B. Se Higgsfield non garantisce continuita, fissarla in post (color match) o usare lo shader di grading dell'overlay (sezione 6) per uniformare.

---

## 3. Specifiche asset (`public/video/`)

Tutti gli asset video vivono in `public/video/`. Encoding obbligatorio in **doppio formato** (AV1/WebM preferito, H.264/MP4 fallback) + poster JPG. Naming canonico:

```text
public/video/
  clip-a-approach.mp4        # H.264 high, yuv420p, faststart
  clip-a-approach.webm       # AV1 (o VP9 fallback)
  clip-a-approach.poster.jpg # primo frame rappresentativo, ~1600px
  clip-b-backflip.mp4
  clip-b-backflip.webm
  clip-b-backflip.poster.jpg
  # frame-sequence opzionale (solo se serve scrub ultra-fluido, vedi 3.2):
  frames/clip-a/0001.webp ... 0144.webp
  frames/clip-b/0001.webp ... 0120.webp
```

### 3.1 Encoding (ffmpeg)

H.264 MP4 (compatibilita massima, `+faststart` per streaming/seek immediato):

```bash
ffmpeg -i clip-a-source.mov \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 \
  -preset slow -movflags +faststart -an \
  public/video/clip-a-approach.mp4
```

AV1 WebM (peso minore a parita di qualita; fallback VP9 se l'encoder e lento):

```bash
ffmpeg -i clip-a-source.mov \
  -c:v libaom-av1 -crf 30 -b:v 0 -cpu-used 4 -an \
  public/video/clip-a-approach.webm
```

Poster:

```bash
ffmpeg -i public/video/clip-a-approach.mp4 -vf "select=eq(n\,0)" \
  -q:v 3 -frames:v 1 public/video/clip-a-approach.poster.jpg
```

Note: `-an` rimuove l'audio (nessun audio nella cinematica, vedi a11y sezione 8). `keyint`/GOP corto migliora il seeking: per scrub via `currentTime` aggiungere `-g 12 -keyint_min 12` cosi i keyframe sono fitti e `fastSeek` atterra vicino al frame voluto.

### 3.2 Frame-sequence vs `video.currentTime` (tradeoff)

Due strategie di scrub. Scegliere in base al test su hardware target.

| Strategia | Pro | Contro | Quando |
|-----------|-----|--------|--------|
| `video.currentTime` (seek su `<video>`) | banda bassa, un solo file, decode hardware, semplice | seek non e frame-accurate su tutti i browser; micro-stutter se GOP lungo; Safari/iOS capriccioso | DEFAULT. Usare con GOP corto (`-g 12`) e `fastSeek`. |
| Frame-sequence (WebP/JPG numerati, draw su canvas/texture) | scrub frame-perfect, fluidissimo, nessun decode-seek | banda alta (decine di immagini), gestione preload, piu memoria | SOLO se il test mostra stutter inaccettabile su desktop target e il budget banda lo consente. |

Regola operativa: **partire con `video.currentTime`**. Passare a frame-sequence solo se il QA visivo (sezione 9) rileva stutter sui beat B1/B4. Per estrarre la frame-sequence usare ffmpeg o la skill `remotion`/`remotion-best-practices` (vedi `10-SKILLS.md`):

```bash
# Estrazione frame a 24fps in WebP (qualita/peso bilanciati)
ffmpeg -i public/video/clip-a-approach.mp4 -vf fps=24 \
  -c:v libwebp -q:v 78 public/video/frames/clip-a/%04d.webp
```

Per il portfolio, dato il budget banda mobile, la frame-sequence va caricata solo su desktop e solo per la clip che ne ha bisogno; mai su mobile.

---

## 4. Implementazione scroll-scrub

Principio: lo scrub mappa `progress` (0→1 della sezione pinnata) su `video.currentTime` (o indice frame), e gira **nel frame loop unico** condiviso con Lenis e R3F (vedi `03-ARCHITECTURE.md` — un solo `requestAnimationFrame`, niente loop concorrenti). GSAP ScrollTrigger gestisce solo il pin e produce `progress`; lo scrub vero e applicato nel tick.

### 4.1 Pin della sezione (GSAP ScrollTrigger)

```ts
// src/components/sections/CinematicSection.tsx (estratto)
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCinematicStore } from "@/webgl/store/cinematicStore";

gsap.registerPlugin(ScrollTrigger);

useGSAP(
  () => {
    const setProgress = useCinematicStore.getState().setProgress;
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "+=400%", // lunghezza dello scrub: 4 viewport-height di scroll
      pin: true,
      scrub: true, // sincronizza al moto, smussato da Lenis
      onUpdate: (self) => setProgress(self.progress), // 0..1
    });
  },
  { scope: sectionRef },
);
```

`end: "+=400%"` da quattro schermate di scroll alla cinematica: abbastanza per leggere tutti i beat senza fretta. Tarare con Alberto (apertura: vedi sezione 10).

### 4.2 Scrub fluido di `currentTime`

Lo scrub diretto su `currentTime` e a scatti se chiamato grezzo. Tecniche, in ordine di efficacia:

1. **Damping**: non assegnare `progress` crudo; interpolare il tempo target con lerp nel tick (segue Lenis, smussa il rumore dello scroll).
2. **`fastSeek`** (dove esiste) per seek approssimato a basso costo, riservando `currentTime` ai frame finali.
3. **`requestVideoFrameCallback`** per sapere quando il frame e effettivamente presentato (utile per gating dei beat e per evitare di forzare seek su frame non pronti).
4. **Pre-decode**: tenere il video in `readyState >= 2`, `preload="auto"`, e fare un "warm seek" iniziale per popolare la pipeline di decode.

```ts
// src/webgl/cinematic/useVideoScrub.ts
import { useEffect, useRef } from "react";

type Opts = { lerp?: number };

export function useVideoScrub(
  video: HTMLVideoElement | null,
  getProgress: () => number, // legge cinematicStore.progress (0..1) per QUESTA clip
  range: [number, number], // sotto-range del beat in cui questa clip e attiva
  { lerp = 0.12 }: Opts = {},
) {
  const target = useRef(0);
  const current = useRef(0);

  useEffect(() => {
    if (!video) return;
    let raf = 0;
    const supportsFastSeek = typeof video.fastSeek === "function";

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!video.duration || Number.isNaN(video.duration)) return;

      // map progress globale -> 0..1 locale alla clip
      const [a, b] = range;
      const p = getProgress();
      const local = Math.min(1, Math.max(0, (p - a) / (b - a)));

      target.current = local * video.duration;
      // damping frame-rate-naive ma sufficiente: segue Lenis che e gia smussato
      current.current += (target.current - current.current) * lerp;

      const delta = Math.abs(current.current - video.currentTime);
      if (delta > 1 / 60) {
        // soglia ~1 frame: evita seek inutili
        if (supportsFastSeek && delta > 0.25) {
          video.fastSeek(current.current); // seek grezzo per salti grandi
        } else {
          video.currentTime = current.current; // seek preciso per rifinire
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [video, getProgress, range, lerp]);
}
```

Nota integrazione: se la cinematica e renderizzata su un quad WebGL (sezione 5/6), questo loop NON deve essere un secondo `requestAnimationFrame` parallelo al frame loop R3F. Spostare la logica di `tick` dentro un `useFrame` di R3F (vedi `03-ARCHITECTURE.md`), leggendo `cinematicStore.progress`. Lo snippet sopra e la versione standalone per chiarezza; in produzione vive in `useFrame`.

### 4.3 Sincronia con Lenis

Lenis e gia la sorgente del moto smussato (vedi `03-ARCHITECTURE.md`): `ScrollTrigger.scrub: true` consuma il moto Lenis-virtualizzato. NON aggiungere un secondo smoothing pesante sopra Lenis (doppio lerp = latenza percepita). Il lerp in `useVideoScrub` (0.10–0.14) e volutamente leggero: assorbe solo il jitter residuo del seek, non rallenta lo scroll.

---

## 5. Transizione-ZOOM tra clip A e clip B (B3)

Obiettivo: tra il beat B2 (arrivo allo scoglio) e B4 (backflip) c'e un **zoom-cut**: la camera "entra" nel punto-scoglio di clip A e ne esce dentro clip B. Tecniche disponibili, da combinare:

1. **Crossfade A→B** su `mix` (progress B3 0→1).
2. **Scale/FOV push**: durante il crossfade, clip A scala verso il punto-scoglio (origine dello scale = coordinata UV dello scoglio), clip B parte leggermente sovra-scalata e rientra. Da' la sensazione di tuffarsi dentro l'immagine.
3. **Mascheratura** opzionale (radial mask centrata sullo scoglio) per guidare l'occhio.
4. **Spray peak**: le particelle overlay esplodono sul taglio (riusa il sistema dell'hero).

Decisione raccomandata: **renderizzare entrambe le clip su un piano/quad WebGL** (sezione 6) e fare scale + crossfade + grading **in shader**. E piu controllabile di CSS transform su `<video>`, permette DOF/distorsione acqua, e sincronizza alla camera R3F. Lo zoom puo essere fatto sull'UV nel fragment (scale attorno al punto-scoglio) senza muovere geometria.

```glsl
// frammento dello shader del quad cinematico (concetto)
// uZoomCenter = UV dello scoglio (es. vec2(0.62, 0.40)), tarata sul frame
// uZoomA = scala applicata a clip A (1.0 -> ~1.8 durante B3)
// uZoomB = scala applicata a clip B (~1.25 -> 1.0 durante B3)
// uMix   = crossfade A->B (0..1)
vec2 zoomedUv(vec2 uv, vec2 center, float scale) {
  return (uv - center) / scale + center;
}
vec4 a = texture2D(uVideoA, zoomedUv(vUv, uZoomCenter, uZoomA));
vec4 b = texture2D(uVideoB, zoomedUv(vUv, uZoomCenter, uZoomB));
vec4 col = mix(a, b, smoothstep(0.0, 1.0, uMix));
```

`uZoomCenter`, `uZoomA`, `uZoomB`, `uMix` sono guidati da `cinematicStore.progress` rimappato sul range B3 (0.58→0.66). Tarare `uZoomCenter` sul frame reale di clip A (apertura: il punto esatto dipende dalla clip generata, vedi sezione 10).

---

## 6. Overlay WebGL (piano video + post)

La cinematica e una scena R3F dedicata, montata nel Canvas globale persistente (vedi `03-ARCHITECTURE.md`). Il video e una `VideoTexture` su un quad full-bleed; sopra passano i layer di post coerenti con l'hero.

Stack overlay (in ordine di applicazione):
1. **Quad video** con shader di grading + zoom (sezione 5).
2. **Color grade oceano**: spinge i mezzitoni verso `--deep` `#0A2430` / `--abyss` `#05131A`, alte luci verso `--aqua-hot` `#7DF9FF`; uso parsimonioso di `--gold` `#FFC27A` solo sui picchi sole-su-acqua. Coerente con la palette di `02-DESIGN.md`.
3. **Distorsione acqua / micro-rifrazione**: leggero displacement UV con curl-noise (lo stesso `curlNoise` di `src/webgl/curves`, vedi 04-3D-HERO) per far "respirare" la superficie.
4. **Spray particles**: stesso sistema dell'hero (GPGPU/particelle), `COL_HOT` sui picchi B3/B5, densita ridotta rispetto all'hero.
5. **DOF/Bokeh** locale (postprocessing `@react-three/postprocessing`), profondita fittizia per dare resa cinematografica. Disattivabile su tier basso.
6. **Vignette** soft per chiudere il frame.

```ts
// src/webgl/cinematic/VideoPlane.tsx (estratto)
import { useVideoTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCinematicStore } from "@/webgl/store/cinematicStore";

export function VideoPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const texA = useVideoTexture("/video/clip-a-approach.mp4", {
    muted: true, loop: false, start: false, crossOrigin: "anonymous",
  });
  const texB = useVideoTexture("/video/clip-b-backflip.mp4", {
    muted: true, loop: false, start: false, crossOrigin: "anonymous",
  });

  useFrame(() => {
    const p = useCinematicStore.getState().progress;
    const m = matRef.current;
    if (!m) return;
    // crossfade B3: 0.58 -> 0.66
    m.uniforms.uMix.value = THREE.MathUtils.clamp((p - 0.58) / 0.08, 0, 1);
    // zoom push durante B3
    const z = THREE.MathUtils.clamp((p - 0.45) / 0.21, 0, 1);
    m.uniforms.uZoomA.value = THREE.MathUtils.lerp(1.0, 1.8, z);
    m.uniforms.uZoomB.value = THREE.MathUtils.lerp(1.25, 1.0, z);
    // spray peak su B3 e B5 (passato alle particelle via store/uniform)
    useCinematicStore.getState().setSprayBurst(
      Math.max(pulse(p, 0.62, 0.04), pulse(p, 0.96, 0.04)),
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        uniforms={{
          uVideoA: { value: texA },
          uVideoB: { value: texB },
          uMix: { value: 0 },
          uZoomA: { value: 1 },
          uZoomB: { value: 1.25 },
          uZoomCenter: { value: new THREE.Vector2(0.62, 0.4) },
          uTime: { value: 0 },
        }}
        // vertexShader / fragmentShader: grading + zoom + curl displacement
      />
    </mesh>
  );
}

// piccolo impulso triangolare attorno a center con larghezza w
function pulse(x: number, center: number, w: number) {
  return Math.max(0, 1 - Math.abs(x - center) / w);
}
```

Le `VideoTexture` partono con `start: false` e `muted: true`: il decode/seek e pilotato dallo scrub (sezione 4), non dalla riproduzione. Aggiornare `texA.needsUpdate`/`texB.needsUpdate` dopo ogni seek se il browser non lo fa in automatico per video in pausa (verificare su Safari).

---

## 7. Performance

Budget vincolante (da `01-TECHSTACK.md`): 60fps desktop recente, degrado elegante su mobile, Lighthouse perf ≥ 80 mobile. La cinematica e l'elemento piu pesante del sito dopo l'hero: trattarla con disciplina.

Checklist performance:
- [ ] **Lazy mount**: la scena cinematica (quad + post) si monta solo quando la sezione entra in viewport (IntersectionObserver / ScrollTrigger), si smonta quando esce. Non tenere il decode attivo fuori schermo.
- [ ] **Preload mirato**: `preload="auto"` solo per la clip imminente; poster mostrato finche `readyState < 2`. Warm-seek iniziale per popolare la decode pipeline.
- [ ] **Decode budget**: un solo video in seek attivo per volta dove possibile; durante B3 entrambi sono attivi brevemente — accettabile sul taglio, non tenerli entrambi vivi per tutta la sezione.
- [ ] **Risoluzione adattiva**: 1440p solo su desktop con buona GPU; servire 1080p (o 720p) su mobile via `<source media>` o scelta runtime. Mai 1440p su mobile.
- [ ] **Post tiering**: DOF/Bokeh e distorsione attivi su tier full; su tier lite ridurre DOF e densita spray; su tier off niente post.
- [ ] **Spray coerente ma piu leggero** dell'hero (meno particelle): la sim non deve competere col costo del video decode.
- [ ] **Niente doppio rAF**: tutto nel frame loop unico Lenis↔R3F (sezione 4.2, e `03-ARCHITECTURE.md`).
- [ ] **frame-sequence solo se misurata necessaria** e solo desktop (sezione 3.2).

Degrado mobile/reduced-motion: vedi sezione 8.

---

## 8. Fallback e accessibilita

`prefers-reduced-motion: reduce`, mobile lento, o assenza di WebGPU/WebGL affidabile → niente scrub. Fallback in scala decrescente:

1. **Reduced-motion / mobile lento**: NIENTE scroll-scrub. Mostrare clip A e clip B come `<video autoplay muted loop playsinline>` a risoluzione ridotta, oppure — se anche l'autoplay e troppo — il **poster statico** (`*.poster.jpg`) con un breve testo descrittivo. La transizione-zoom si riduce a un crossfade CSS o e omessa.
2. **No WebGL/WebGPU**: niente quad/overlay/post; usare i `<video>` o i poster diretti nel DOM, grading via CSS `filter` minimale.
3. **Connessione lenta** (`navigator.connection.saveData` / effectiveType `2g`/`3g`): poster statico, nessun video caricato finche l'utente non interagisce.

Regole a11y (vincolanti, da `01-TECHSTACK.md`):
- [ ] Video e canvas WebGL della cinematica sono **decorativi**: `aria-hidden="true"`. La narrativa va resa accessibile via testo reale nel DOM (heading/paragrafo EN/IT leggibili da screen reader) accanto/sotto al layer visivo.
- [ ] **Nessun audio in autoplay**. Tutti i video `muted`; nessuna traccia audio nella cinematica (encode con `-an`). Sound design onda resta off di default (audioStore, vedi 03-ARCHITECTURE).
- [ ] Nel fallback con `<video autoplay loop>`, fornire comunque controlli accessibili o almeno rispettare reduced-motion fermando l'autoplay.
- [ ] La sezione pinnata non deve intrappolare il focus da tastiera: il pin e visivo, lo scroll da tastiera (frecce/PageDown) deve continuare ad avanzare normalmente. Verificare con tastiera.
- [ ] Contrasto AA per ogni testo sovrapposto al video (overlay scuro/scrim dietro al testo se il frame e chiaro nei picchi golden-hour).

```tsx
// fallback gate (concetto)
const reduced = useReducedMotion();
const slow = useSaveData(); // navigator.connection
if (reduced || slow) {
  return <CinematicPoster />; // poster statico + testo descrittivo, aria-hidden sul media
}
return <CinematicScrub />; // quad WebGL + scrub
```

---

## 9. QA visivo / done-when

QA visivo obbligatorio con **claude-in-chrome** (sostituisce Playwright per la verifica visiva, vedi `09-MCP.md`): screenshot a progress fissi, lettura console/network, controllo che il seek non saturi la rete.

Procedura QA:
1. Caricare la pagina, scrollare la sezione cinematica a step di progress noti (es. 0.05, 0.30, 0.52, 0.62, 0.80, 0.97) e catturare screenshot per ogni beat (B0…B5).
2. Verificare assenza di stutter sui beat B1 (approach) e B4 (backflip): lo scrub deve seguire lo scroll senza scatti percepibili.
3. Verificare la transizione-zoom B3: crossfade pulito, scale centrato sullo scoglio, spray peak presente.
4. Leggere la console: nessun errore di decode/seek, nessun warning di texture non aggiornata.
5. Leggere il network: i video si caricano lazy alla viewport, non al primo paint; nessun doppio fetch.
6. Throttle CPU/rete in Chrome per simulare mobile lento → verificare che scatti il fallback poster/autoplay.
7. Forzare `prefers-reduced-motion: reduce` → niente scrub, poster o autoplay-muted, nessun audio.

Done-when (tutte le caselle vere):
- [ ] Clip A e clip B presenti in `public/video/` in MP4 + WebM + poster, encodate con GOP corto per il seek.
- [ ] Scroll-scrub funziona reversibile (avanti/indietro) e segue Lenis senza doppio rAF.
- [ ] Pin GSAP attivo per `+=400%` (o valore tarato), `progress` scritto in `cinematicStore`.
- [ ] Transizione-zoom B3 leggibile, centrata sullo scoglio, crossfade + spray peak.
- [ ] Overlay WebGL (grading oceano + DOF + spray + vignette) coerente coi token di `02-DESIGN.md` e col look dell'hero (`04-3D-HERO`).
- [ ] 60fps su desktop target durante l'intero scrub; nessun jank misurabile sui beat.
- [ ] Mobile: risoluzione ridotta, post alleggerito, ≥ 80 Lighthouse perf.
- [ ] Fallback reduced-motion/mobile-lento/no-WebGL verificati; nessun audio autoplay.
- [ ] A11y: media `aria-hidden`, testo narrativo leggibile da screen reader, focus/tastiera ok, contrasto AA.
- [ ] QA visivo claude-in-chrome eseguito su tutti i beat, console e network puliti.
- [ ] Preview deploy su Vercel verificato (vedi `09-MCP.md`).

---

## 10. Decisioni aperte (confermare con Alberto)

- Footage reale del backflip di Alberto: usare il reale (preferito) o il generato Higgsfield come placeholder? Se reale, fornire sorgente in alta qualita.
- Faraglione: generare un proxy generico o cercare/usare footage reale di Pan di Zucchero / Masua per fedelta al luogo d'origine.
- Lunghezza dello scrub (`end: "+=400%"`): tarare sul feel desiderato (piu lungo = piu contemplativo).
- `uZoomCenter`: coordinata UV esatta dello scoglio, da fissare sul frame reale di clip A una volta generata.
- Risoluzione master: 1440p vs 1080p in funzione del peso accettabile e di cosa Higgsfield produce in modo affidabile.
- Frame-sequence: attivarla solo se il QA mostra stutter su desktop target (default: `video.currentTime`).
