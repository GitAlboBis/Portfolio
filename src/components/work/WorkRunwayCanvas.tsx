"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { works } from "@/content/works";
import { gsap } from "@/lib/gsap";
import { DUR, EASE, VELOCITY_GAIN } from "@/lib/motion";
import { ARTWORK_GLSL, PATTERN_BY_SLUG } from "@/webgl/artwork";

/*
  WorkRunwayCanvas — the GL artwork layer under the /work runway type (LA MAREA
  Pass 2). One generative "still" per project — no fake screenshots: each slide
  gets a distinctive procedural pattern drawn from its own mood tokens
  (map contours for the geospatial PWA, a voice spectrum for the Teams agent,
  field rows for the supply chain, a calm breathing grid for the WIP entries).
  When real stills land (Work.textureSrc) this plane is the frame they mount in.

  Fully ADDITIVE: it reads the runway section's geometry only (same rect-poll →
  progress math as the DOM scrub), so the existing timeline/spotlight/odometer
  choreography is untouched, and killing this file restores today's look.
  Mechanisms ported from the reference dossiers (CLAUDE.md §6 rules):
  smoothed |Δprogress| as the ONE distortion knob → vertex bend (webgl-carousel);
  noise-front tide reveal per slide (r3f-image-reveal); artwork counter-drift
  between title (0.2) and ghost numeral (0.09) depths (horizontal-parallax).

  House conventions: demand frameloop + rect-poll FrameGate (Lenis doesn't fire
  IO reliably), DPR ≤ 1.5, dispose on unmount, aria-hidden, transparent canvas —
  no-WebGL/no-JS leaves the CSS mood slides exactly as they are today.
*/

// Artwork drifts against the track between the two DOM layers (title 0.2, numeral 0.09).
const ART_PARALLAX = 0.13;
// Bend strength as a fraction of plane width at |velocity| = 1 slide/s.
const BEND = 0.055;

const VERT = /* glsl */ `
  varying vec2 vUv;
  uniform float uVel;
  void main(){
    vUv = uv;
    vec3 pos = position;
    // The one velocity deformation: the plane bows against the travel like a
    // sail — middle lags, edges lead. Unit-plane space (scale carries px).
    pos.x += sin(uv.y * 3.14159265) * uVel * ${BEND};
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uBase;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uTime;
  uniform float uFocus;   // 1 = slide centred, 0 = a full slide away
  uniform float uReveal;  // 0 = hidden, 1 = fully risen (tide reveal)
  uniform float uPattern; // 0 contours · 1 voice bars · 2 field rows · 3 dot grid
  uniform float uSeed;

  ${ARTWORK_GLSL}

  void main(){
    vec2 uv = vUv;
    vec3 col = artwork(uv, uPattern, uSeed, uTime, uBase, uA, uB);

    // Focus: out-of-centre slides rest desaturated and quiet (scrub-welded).
    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(mix(vec3(gray), uBase, 0.25), col, 0.35 + 0.65 * uFocus);

    // Vignette + cinematic grain.
    col *= mix(0.93, 1.0, smoothstep(1.05, 0.45, distance(uv, vec2(0.5))));
    col += (aw_hash(uv * vec2(760.0, 540.0) + fract(uTime)) - 0.5) * 0.035;

    // Tide reveal: the artwork rises from below behind a noisy waterline,
    // a golden edge riding the front (r3f-image-reveal, re-themed).
    float n = aw_fbm(uv * 3.5 + uSeed * 3.0);
    float coord = uv.y + (n - 0.5) * 0.3;
    float edge = (1.0 - uReveal) * 1.4 - 0.2;
    float alpha = smoothstep(edge, edge + 0.22, coord);
    col = mix(uA * 1.1, col, smoothstep(0.0, 0.12, abs(coord - (edge + 0.11))));

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), alpha);
  }
`;

/* Demand-loop gate: invalidate only while the runway is on screen (rect-poll —
   Lenis' transform scroll doesn't fire IntersectionObserver reliably). */
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

function Scene({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const { size } = useThree();
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const baseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lastPos = useRef(0);
  const vel = useRef(0);
  const revealed = useRef<boolean[]>(works.map(() => false));
  const n = works.length;

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 6, 28), []);
  // Full-slide base quads — the GL take-over of the CSS slide backgrounds (the
  // li backgrounds go transparent once the context is live; these replace them
  // so the artwork can sit UNDER the type, which stays pure DOM above the canvas).
  const baseMaterials = useMemo(
    () =>
      works.map(
        (w) => new THREE.MeshBasicMaterial({ color: new THREE.Color(w.mood.base), toneMapped: false }),
      ),
    [],
  );
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
              uTime: { value: 0 },
              uVel: { value: 0 },
              uFocus: { value: 0 },
              uReveal: { value: 0 },
              uPattern: { value: PATTERN_BY_SLUG[w.slug] ?? 3 },
              uSeed: { value: i * 1.7 + 0.4 },
            },
          }),
      ),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      baseMaterials.forEach((m) => m.dispose());
    },
    [geometry, materials, baseMaterials],
  );

  useFrame((state, delta) => {
    const sec = sectionRef.current;
    if (!sec) return;
    const W = size.width;
    const H = size.height;
    const rect = sec.getBoundingClientRect();
    const denom = rect.height - window.innerHeight;
    const p = denom > 0 ? Math.min(1, Math.max(0, -rect.top / denom)) : 0;

    // Smoothed slide-space velocity — the ONE distortion signal (webgl-carousel).
    const pos = p * (n - 1);
    const raw = (pos - lastPos.current) / Math.max(delta, 1e-4);
    lastPos.current = pos;
    vel.current += (Math.max(-2.5, Math.min(2.5, raw)) - vel.current) * (1 - Math.exp(-delta * 7));

    const isMobile = W < 768;
    const pw = isMobile ? W * 0.72 : W * 0.3;
    const ph = isMobile ? H * 0.42 : H * 0.54;

    works.forEach((_, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      const off = i - pos; // 0 = this slide is centred
      const visible = Math.abs(off) < 1.6;
      mesh.visible = visible;

      // Base quad rides exactly with its slide (1px overlap kills GL seams).
      const base = baseRefs.current[i];
      if (base) {
        base.visible = visible;
        base.position.set(off * W, 0, -1);
        base.scale.set(W + 2, H + 2, 1);
      }
      if (!visible) return;

      // Slide left edge + in-slide anchor + counter-drift (mid depth layer).
      const cx = off * W + (isMobile ? 0.5 : 0.63) * W + off * W * ART_PARALLAX;
      const cy = (isMobile ? 0.4 : 0.46) * H;
      mesh.position.set(cx - W / 2, H / 2 - cy, 0);
      mesh.scale.set(pw, ph, 1);

      const u = materials[i].uniforms;
      u.uTime.value = state.clock.elapsedTime;
      u.uFocus.value = 1 - Math.min(1, Math.abs(off));
      u.uVel.value = vel.current * VELOCITY_GAIN * (isMobile ? 0.5 : 1);

      // First approach → the artwork rises once, like the tide coming in.
      if (!revealed.current[i] && Math.abs(off) < 1.05) {
        revealed.current[i] = true;
        gsap.to(u.uReveal, { value: 1, duration: DUR.breaker, ease: EASE.tide });
      }
    });
  });

  return (
    <>
      {works.map((w, i) => (
        <mesh
          key={`base-${w.slug}`}
          ref={(el) => {
            baseRefs.current[i] = el;
          }}
          geometry={geometry}
          material={baseMaterials[i]}
          renderOrder={i}
          visible={false}
        />
      ))}
      {works.map((w, i) => (
        <mesh
          key={w.slug}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          geometry={geometry}
          material={materials[i]}
          renderOrder={n + i}
          visible={false}
        />
      ))}
    </>
  );
}

export function WorkRunwayCanvas({
  sectionRef,
  onReady,
  onLost,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  /** Fired once the GL context is live — the DOM slide backgrounds hand over to the base quads. */
  onReady?: () => void;
  /** Fired on webglcontextlost — the CSS backgrounds take back over (failsafe). */
  onLost?: () => void;
}) {
  return (
    <Canvas
      aria-hidden
      orthographic
      camera={{ position: [0, 0, 100], zoom: 1 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        onReady?.();
        gl.domElement.addEventListener("webglcontextlost", () => onLost?.(), { once: true });
      }}
    >
      <FrameGate sectionRef={sectionRef} />
      <Scene sectionRef={sectionRef} />
    </Canvas>
  );
}

export default WorkRunwayCanvas;
