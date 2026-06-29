"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useState, type RefObject } from "react";
import { works as WORKS, type Work } from "@/content/works";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";

/*
  Selected Works — "atmospheric depth gallery" (original R3F reimplementation of
  the codrops/houmahani idea). Project planes stacked along -Z; the camera flies
  through as the sticky-pinned section scrolls, cross-fading by depth. A MOOD
  BACKGROUND quad (sunset blobs + caustics + grain) follows the camera and lerps
  its colours to the focused project — so flying through the work walks an
  atmospheric ramp. Pointer adds parallax; scroll velocity lifts the caustics.
  Reduced-motion → a plain editorial list.
*/

const GAP = 4.2;
const VIEW = 5.5;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// Project plane: duotone sunset gradient + soft highlight + vignette. (Placeholder
// until real stills are wired via Work.textureSrc.)
const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uOpacity;
  void main(){
    vec3 c = mix(uB, uA, smoothstep(0.0, 1.0, vUv.y));
    float d = distance(vUv, vec2(0.30, 0.72));
    c = mix(c, uA * 1.12, smoothstep(0.55, 0.0, d) * 0.4);
    float v = smoothstep(1.15, 0.25, distance(vUv, vec2(0.5)));
    c *= mix(0.92, 1.0, v);
    gl_FragColor = vec4(c, uOpacity);
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

  const materials = useMemo(
    () =>
      works.map(
        (w) =>
          new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            depthWrite: false,
            uniforms: {
              uA: { value: new THREE.Color(w.mood.blob1) },
              uB: { value: new THREE.Color(w.mood.blob2) },
              uOpacity: { value: 0 },
            },
          }),
      ),
    [works],
  );

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

    const vel = Math.min(1, Math.abs(camera.position.z - lastCamZ.current) * 4);
    lastCamZ.current = camera.position.z;

    let best = 0;
    let bestD = Infinity;
    works.forEach((_, i) => {
      const target = -i * GAP + VIEW;
      const dz = Math.abs(camera.position.z - target);
      materials[i].uniforms.uOpacity.value = 1 - smooth(0, GAP * 0.95, dz);
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
          material={materials[i]}
          renderOrder={works.length - i}
        >
          <planeGeometry args={[5.2, 3.3]} />
        </mesh>
      ))}
    </>
  );
}

export function WorksGallery() {
  const t = useDict();
  const reduced = useUI((s) => s.reducedMotion);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);

  if (reduced) {
    return (
      <section id="works" className="scroll-anchor container-edit">
        <p className="t-eyebrow eyebrow-tick mb-6">{t.works.eyebrow}</p>
        <h2 className="t-display mb-10">{t.works.title}</h2>
        <ol className="flex flex-col">
          {WORKS.map((w, i) => (
            <li key={w.slug} className="border-t border-[var(--color-rule)] py-7">
              <p className="t-index mb-1">{String(i + 1).padStart(2, "0")}</p>
              <p className="t-title">{w.title}</p>
              <p className="t-meta mt-2">
                {w.role} · {w.year} · {w.stack.join(" / ")}
              </p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const w = WORKS[active];
  return (
    <section
      id="works"
      ref={sectionRef}
      className="scroll-anchor relative"
      style={{ height: `${(WORKS.length + 1) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="container-edit absolute inset-x-0 top-[calc(var(--nav-h)+1rem)] z-10">
          <p className="t-eyebrow eyebrow-tick">{t.works.eyebrow}</p>
        </div>

        <Canvas
          aria-hidden
          camera={{ position: [0, 0, VIEW], fov: 45 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          style={{ position: "absolute", inset: 0 }}
        >
          <Scene works={WORKS} sectionRef={sectionRef} onActive={setActive} />
        </Canvas>

        <div className="container-edit pointer-events-none absolute inset-x-0 bottom-[9vh] z-10">
          <p className="t-index mb-2">
            {String(active + 1).padStart(2, "0")} / {String(WORKS.length).padStart(2, "0")}
          </p>
          <h3 className="t-title">{w.title}</h3>
          <p className="t-meta mt-2">
            {w.role} · {w.year} · {w.stack.join(" / ")}
          </p>
        </div>

        <ol className="sr-only">
          {WORKS.map((work) => (
            <li key={work.slug}>
              {work.title} — {work.role}, {work.year}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
