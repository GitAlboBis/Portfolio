"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useEffect, useState, type RefObject } from "react";
import { works as WORKS, type Work } from "@/content/works";
import { ARTWORK_GLSL, PATTERN_BY_SLUG } from "@/webgl/artwork";

/*
  WorksGalleryCanvas — the R3F half of the home depth gallery (three + @react-three/fiber).
  Split out of WorksGallery so this chunk (three/R3F) stays OFF the initial bundle and is
  loaded via next/dynamic({ssr:false}) only once the gallery nears the viewport (see
  WorksGallery's `near` gate). The shell (tall section + caption) always renders, so the
  page height and the sticky-scroll math are unaffected by whether this has mounted yet.

  Project planes stacked along -Z; the camera flies through as the sticky-pinned section
  scrolls, cross-fading by depth. A MOOD BACKGROUND quad (sunset blobs + caustics + grain)
  follows the camera and lerps its colours to the focused project. Pointer adds parallax;
  scroll velocity lifts the caustics.
*/

const GAP = 4.2;
const VIEW = 5.5;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// Project plane: the REAL still (Work.textureSrc, cover-fit + a gentle duotone
// pull toward the slide's mood so the series stays one system) or the shared
// generative artwork per slug (src/webgl/artwork.ts) while a still is absent/
// loading. Cross-faded by depth; out-of-focus planes rest desaturated.
const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uBase;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPattern;
  uniform float uSeed;
  uniform sampler2D uTex;
  uniform float uHasTex;
  uniform float uTexAspect;

  ${ARTWORK_GLSL}

  void main(){
    vec3 c;
    if (uHasTex > 0.5) {
      // cover-fit: crop the overflowing axis (plane is 5.2 x 3.3)
      vec2 tuv = vUv;
      float rx = 1.5757576 / max(uTexAspect, 1e-3);
      if (rx < 1.0) { tuv.x = 0.5 + (tuv.x - 0.5) * rx; }
      else { tuv.y = 0.5 + (tuv.y - 0.5) / rx; }
      c = texture2D(uTex, tuv).rgb;
      // marry the photograph to the slide's mood (duotone pull, subtle)
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(c, mix(uBase, uA, smoothstep(0.12, 0.88, lum)), 0.14);
    } else {
      c = artwork(vUv, uPattern, uSeed, uTime, uBase, uA, uB);
    }
    // depth focus: opacity doubles as the focus signal (1 = centred).
    float gray = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(mix(vec3(gray), uBase, 0.25), c, 0.4 + 0.6 * uOpacity);
    float v = smoothstep(1.15, 0.25, distance(vUv, vec2(0.5)));
    c *= mix(0.92, 1.0, v);
    c += (aw_hash(vUv * vec2(820.0, 600.0) + fract(uTime)) - 0.5) * 0.03;
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), uOpacity);
  }
`;

// Mood background: drifting blobs of the focused project's mood over a warm base,
// cheap caustics gated to the upper field, a depth gradient, and faint grain.
const FRAG_BG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uBase;
  uniform vec3 uB1;
  uniform vec3 uB2;
  uniform float uVel;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    float t = uTime * 0.06;
    vec2 c1 = vec2(0.50 + sin(t) * 0.18, 0.46 + cos(t * 0.8) * 0.12);
    vec2 c2 = vec2(0.40 + cos(t * 0.9) * 0.16, 0.60 + sin(t * 1.1) * 0.10);
    float b1 = smoothstep(0.55, 0.0, distance(vUv, c1));
    float b2 = smoothstep(0.50, 0.0, distance(vUv, c2));
    vec3 col = uBase;
    col = mix(col, col * 1.05, smoothstep(0.0, 1.0, vUv.y));      // depth gradient
    col = mix(col, uB1, b1 * 0.55);
    col = mix(col, uB2, b2 * 0.50);
    float ca = sin((vUv.x + t * 2.0) * 16.0) * sin((vUv.y - t * 1.4) * 13.0);
    ca = smoothstep(0.6, 1.0, ca * 0.5 + 0.5) * smoothstep(0.1, 0.85, vUv.y);
    col += ca * (0.025 + uVel * 0.05) * vec3(1.0, 0.86, 0.62);     // caustic light, warm
    col += uVel * 0.05;                                            // velocity luminance lift
    col += (h(vUv * vec2(920.0, 700.0)) - 0.5) * 0.02;            // cinematic grain
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

function smooth(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* ── Type at scene depth (the Everswap sky-writing insight) ────────────────
   Each project's title lives BETWEEN the planes as a giant ghost billboard
   (Bricolage outline, ember) — the camera flies TOWARD it and the nearer
   artwork paints over it, so the type reads at real depth instead of as a
   flat DOM overlay. Canvas-texture, fit-to-width, redrawn on fonts.ready. */
const TITLE_W = 8.4;
const TITLE_CANVAS = { w: 2048, h: 320 };

function drawTitle(c: HTMLCanvasElement, text: string) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const family =
    getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() ||
    '"Bricolage Grotesque", sans-serif';
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 100px ${family}`;
  const at100 = ctx.measureText(text).width || 1;
  const size = Math.min(230, ((c.width - 140) / at100) * 100);
  ctx.font = `600 ${size}px ${family}`;
  ctx.lineWidth = Math.max(2, size * 0.014);
  ctx.strokeStyle = "rgba(238, 91, 35, 0.55)"; // ember outline — ghost, decorative
  ctx.strokeText(text, c.width / 2, c.height / 2);
}

/*
  Visibility gate. The Canvas runs frameloop="demand", so the scene only renders when
  we call invalidate(). This poll invalidates every frame ONLY while the (very tall,
  sticky) section is on screen — so the two full-screen fragment shaders stop rendering
  while the hero, About, Tech and the night band are in view. rect-poll rather than
  IntersectionObserver: Lenis' smoothed scroll doesn't fire IO reliably here.
*/
function FrameGate({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const sec = sectionRef.current;
      if (!sec || document.hidden) return;
      const r = sec.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, sectionRef]);
  return null;
}

function Scene({
  works,
  sectionRef,
  onActive,
}: {
  works: Work[];
  sectionRef: RefObject<HTMLElement | null>;
  onActive: (i: number) => void;
}) {
  const { camera, pointer } = useThree();
  const prevActive = useRef(-1);
  const lastCamZ = useRef(VIEW);
  const bgRef = useRef<THREE.Mesh>(null);

  // 1px placeholder so uTex is always a valid binding (uHasTex gates sampling)
  const placeholderTex = useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    t.needsUpdate = true;
    return t;
  }, []);

  const materials = useMemo(
    () =>
      works.map(
        (w, i) =>
          new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            depthWrite: false,
            uniforms: {
              uBase: { value: new THREE.Color(w.mood.base) },
              uA: { value: new THREE.Color(w.mood.blob1) },
              uB: { value: new THREE.Color(w.mood.blob2) },
              uOpacity: { value: 0 },
              uTime: { value: 0 },
              uPattern: { value: PATTERN_BY_SLUG[w.slug] ?? 3 },
              uSeed: { value: i * 1.7 + 0.4 },
              uTex: { value: placeholderTex },
              uHasTex: { value: 0 },
              uTexAspect: { value: 1.5 },
            },
          }),
      ),
    [works, placeholderTex],
  );

  // Real stills: load async, swap in when ready (artwork keeps the seat warm —
  // no pop: the still fades in with the next depth cross-fade anyway).
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];
    works.forEach((w, i) => {
      if (!w.textureSrc) return;
      loader.load(w.textureSrc, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        loaded.push(tex);
        const u = materials[i].uniforms;
        u.uTex.value = tex;
        u.uTexAspect.value = (tex.image?.width ?? 3) / (tex.image?.height ?? 2);
        u.uHasTex.value = 1;
      });
    });
    return () => {
      loaded.forEach((t) => t.dispose());
    };
  }, [works, materials]);

  const bgMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG_BG,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uBase: { value: new THREE.Color(works[0].mood.base) },
          uB1: { value: new THREE.Color(works[0].mood.blob1) },
          uB2: { value: new THREE.Color(works[0].mood.blob2) },
          uVel: { value: 0 },
        },
      }),
    [works],
  );

  // Reused target colors (avoid per-frame allocation).
  const targets = useMemo(
    () => works.map((w) => ({
      base: new THREE.Color(w.mood.base),
      b1: new THREE.Color(w.mood.blob1),
      b2: new THREE.Color(w.mood.blob2),
    })),
    [works],
  );

  // Depth titles: one canvas-texture billboard per project, redrawn once the
  // display font is really loaded (same pattern as the murmuration glyph).
  const [titleMats, setTitleMats] = useState<THREE.MeshBasicMaterial[] | null>(null);
  useEffect(() => {
    const canvases = works.map((w) => {
      const c = document.createElement("canvas");
      c.width = TITLE_CANVAS.w;
      c.height = TITLE_CANVAS.h;
      drawTitle(c, w.title);
      return c;
    });
    const mats = canvases.map((c) => {
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
    });
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      canvases.forEach((c, i) => {
        drawTitle(c, works[i].title);
        if (mats[i].map) (mats[i].map as THREE.CanvasTexture).needsUpdate = true;
      });
    });
    setTitleMats(mats);
    return () => {
      alive = false;
      mats.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    };
  }, [works]);

  useFrame((state) => {
    const sec = sectionRef.current;
    if (!sec) return;
    const rect = sec.getBoundingClientRect();
    const denom = rect.height - window.innerHeight;
    const progress = denom > 0 ? Math.min(1, Math.max(0, -rect.top / denom)) : 0;

    const camZ = VIEW - progress * ((works.length - 1) * GAP);
    camera.position.z += (camZ - camera.position.z) * 0.12;
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.05;
    camera.position.y += (pointer.y * 0.4 - camera.position.y) * 0.05;

    const dzCam = camera.position.z - lastCamZ.current;
    const vel = Math.min(1, Math.abs(dzCam) * 4);
    lastCamZ.current = camera.position.z;

    // Banking: the camera leans into the dive and settles level at rest —
    // the fly-through reads as a turn, not an elevator (transform-only).
    const bank = Math.max(-0.04, Math.min(0.04, dzCam * 0.55));
    camera.rotation.z += (bank - camera.rotation.z) * 0.06;

    let best = 0;
    let bestD = Infinity;
    works.forEach((_, i) => {
      const target = -i * GAP + VIEW;
      const dz = Math.abs(camera.position.z - target);
      materials[i].uniforms.uOpacity.value = 1 - smooth(0, GAP * 0.95, dz);
      materials[i].uniforms.uTime.value = state.clock.elapsedTime;
      if (dz < bestD) {
        bestD = dz;
        best = i;
      }
    });

    // mood background follows the camera + lerps to the focused project
    const tg = targets[best];
    const u = bgMat.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    (u.uBase.value as THREE.Color).lerp(tg.base, 0.05);
    (u.uB1.value as THREE.Color).lerp(tg.b1, 0.05);
    (u.uB2.value as THREE.Color).lerp(tg.b2, 0.05);
    u.uVel.value += (vel - u.uVel.value) * 0.1;
    if (bgRef.current) {
      bgRef.current.position.set(camera.position.x, camera.position.y, camera.position.z - 22);
    }

    // depth titles: swell as the camera approaches, snuff fast once passed —
    // the type is always BETWEEN you and the next work, never on the glass
    if (titleMats)
      for (let i = 0; i < titleMats.length; i++) {
        const rel = camera.position.z - (-(i * GAP) - GAP * 0.55);
        titleMats[i].opacity =
          rel >= 0
            ? 0.5 * (1 - smooth(0.4, GAP * 2.8, rel))
            : 0.5 * (1 - smooth(0, GAP * 0.4, -rel));
      }

    if (best !== prevActive.current) {
      prevActive.current = best;
      onActive(best);
    }
  });

  return (
    <>
      <mesh ref={bgRef} material={bgMat} renderOrder={-1}>
        <planeGeometry args={[90, 56]} />
      </mesh>
      {works.map((w, i) => (
        <mesh
          key={w.slug}
          position={[((i % 2) * 2 - 1) * 1.25, 0, -i * GAP]}
          /* a slight inward tilt gives each plane real dimensionality in the dive */
          rotation={[0, ((i % 2) * 2 - 1) * -0.09, 0]}
          material={materials[i]}
          renderOrder={works.length - i}
        >
          <planeGeometry args={[5.2, 3.3]} />
        </mesh>
      ))}
      {/* ghost titles at depth: opposite side of their plane, half a GAP deeper,
          renderOrder .5 UNDER the nearer plane so the artwork occludes the type */}
      {titleMats &&
        works.map((w, i) => (
          <mesh
            key={`title-${w.slug}`}
            material={titleMats[i]}
            position={[
              -((i % 2) * 2 - 1) * 1.7,
              i % 2 ? -0.85 : 0.85,
              -i * GAP - GAP * 0.55,
            ]}
            renderOrder={works.length - i - 0.5}
          >
            <planeGeometry args={[TITLE_W, (TITLE_W * TITLE_CANVAS.h) / TITLE_CANVAS.w]} />
          </mesh>
        ))}
    </>
  );
}

export function WorksGalleryCanvas({
  sectionRef,
  onActive,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  onActive: (i: number) => void;
}) {
  return (
    <Canvas
      aria-hidden
      camera={{ position: [0, 0, VIEW], fov: 45 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <FrameGate sectionRef={sectionRef} />
      <Scene works={WORKS} sectionRef={sectionRef} onActive={onActive} />
    </Canvas>
  );
}

export default WorksGalleryCanvas;
