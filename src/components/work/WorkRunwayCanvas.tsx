"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { works } from "@/content/works";
import { gsap } from "@/lib/gsap";
import { DUR, EASE, VELOCITY_GAIN } from "@/lib/motion";
import { ARTWORK_GLSL, PATTERN_BY_SLUG } from "@/webgl/artwork";
import { CNOISE_GLSL } from "@/webgl/noise";

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
  the radial domain-warped torn reveal per slide (r3f-image-reveal, MIT — see the
  block at the end of FRAG); artwork counter-drift between title (0.2) and ghost
  numeral (0.09) depths (horizontal-parallax).

  ⚠ NOT ported from r3f-image-reveal: its vertex wave, `position.z += (1 - p) *
  sin(distanceToCenter * 20.0 - p * 5.0)`. That reference renders under a
  PERSPECTIVE camera, where a z displacement is visible as foreshortening. This
  canvas is ORTHOGRAPHIC (`<Canvas orthographic>`), so displacing z produces
  exactly zero pixels of change — porting it would be dead code wearing the
  effect's name. The reveal itself carries the whole gesture here.

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

  uniform sampler2D uTex;
  uniform float uHasTex;
  uniform float uTexAspect;
  uniform float uPlaneAspect;

  ${ARTWORK_GLSL}
  ${CNOISE_GLSL}

  void main(){
    vec2 uv = vUv;
    vec3 col;
    if (uHasTex > 0.5) {
      // cover-fit the real still (plane aspect follows the live layout)
      vec2 tuv = uv;
      float rx = uPlaneAspect / max(uTexAspect, 1e-3);
      if (rx < 1.0) { tuv.x = 0.5 + (tuv.x - 0.5) * rx; }
      else { tuv.y = 0.5 + (tuv.y - 0.5) / rx; }
      col = texture2D(uTex, tuv).rgb;
      // duotone pull toward the slide's mood — one series, one system
      float tl = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, mix(uBase, uA, smoothstep(0.12, 0.88, tl)), 0.14);
    } else {
      col = artwork(uv, uPattern, uSeed, uTime, uBase, uA, uB);
    }

    // Focus: out-of-centre slides rest desaturated and quiet (scrub-welded).
    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(mix(vec3(gray), uBase, 0.25), col, 0.35 + 0.65 * uFocus);

    // Vignette + cinematic grain.
    col *= mix(0.93, 1.0, smoothstep(1.05, 0.45, distance(uv, vec2(0.5))));
    col += (aw_hash(uv * vec2(760.0, 540.0) + fract(uTime)) - 0.5) * 0.035;

    // ── THE REVEAL — colindmg/r3f-image-reveal-effect (MIT), ported for real ──
    // This block previously claimed that reference but implemented a vertical
    // wipe with an fbm-jittered horizontal front: a Y coordinate, one un-warped
    // fbm, a smoothstepped 0.22-wide band, and an edge that froze the moment
    // uReveal hit 1. The actual technique is radial, domain-warped, linear-ramped
    // and never stops moving. Reproduced from the source, verbatim:
    //
    //   displacedUv = vUv + cnoise(vec3(vUv * 5.0, uTime * 0.1));
    //   strength    = cnoise(vec3(displacedUv * 5.0, uTime * 0.2));
    //   strength   += distance(vUv, vec2(0.5)) * 12.5 - 7.0 * uProgress;
    //   strength    = 1.0 - clamp(strength, 0.0, 1.0);
    //   alpha       = strength * smoothstep(0.0, 0.7, uProgress);
    //
    // Why each number matters (dossier §5):
    //  • the warp is applied BEFORE the x5, so it displaces the lookup by up to a
    //    whole UV span — that total scramble is what makes the edge churn instead
    //    of forming smooth blobs;
    //  • 0.1 vs 0.2 time scales: the two fields drift at different rates so they
    //    never lock into a repeating pattern;
    //  • 12.5 sets the transition band to exactly 1/12.5 = 0.08 UV, and the noise
    //    jitters the boundary radius by +-0.08 — jitter ~= band width is precisely
    //    what reads as TORN rather than blurred. No smoothstep on this edge: the
    //    linear ramp between the clamp bounds is the effect;
    //  • at uReveal = 1 the open radius is d <= 0.56, so the CORNERS never open.
    //    That permanent noisy vignette is deliberate upstream, and here it is also
    //    the fix for the runway's hard-rectangle problem: the still dissolves into
    //    the paper instead of ending on a clipped edge;
    //  • uTime keeps advancing after the reveal completes, so the frontier goes on
    //    churning forever. That ambient motion is most of why the frame feels
    //    alive at rest, and it is exactly what the old wipe lost.
    vec2 displacedUv = uv + rv_cnoise(vec3(uv * 5.0, uTime * 0.1));
    float strength = rv_cnoise(vec3(displacedUv * 5.0, uTime * 0.2));
    strength += distance(uv, vec2(0.5)) * 12.5 - 7.0 * uReveal;
    strength = clamp(strength, 0.0, 1.0);
    strength = 1.0 - strength;
    float alpha = strength * smoothstep(0.0, 0.7, uReveal);

    // Ours, not theirs: an ember lift riding the frontier. It is derived from the
    // SAME strength field, so it tracks the real torn edge rather than being a
    // second, invented front — Golden Hour theming of the reference's own
    // boundary, not a different mechanism.
    // Narrow + weak on purpose: at 0.5 weight over a half-unit band it read as a
    // milky halo sitting ON the photograph rather than a rim lighting its torn
    // edge. 0.26 over a 0.22-wide band keeps it a whisper — and the band is
    // deliberately narrower than the reference's 0.08 UV transition so the lift
    // stays inside the frontier instead of bleeding into the opaque interior.
    col = mix(col, uA * 1.1, smoothstep(0.28, 0.06, abs(strength - 0.5)) * 0.26);

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
  // 1px placeholder keeps uTex bound while stills load (uHasTex gates sampling)
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
              uTime: { value: 0 },
              uVel: { value: 0 },
              uFocus: { value: 0 },
              uReveal: { value: 0 },
              uPattern: { value: PATTERN_BY_SLUG[w.slug] ?? 3 },
              uSeed: { value: i * 1.7 + 0.4 },
              uTex: { value: placeholderTex },
              uHasTex: { value: 0 },
              uTexAspect: { value: 1.5 },
              uPlaneAspect: { value: 1 },
            },
          }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placeholderTex],
  );
  // Real stills (Work.textureSrc) — swap in over the procedural artwork.
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
  }, [materials]);
  useEffect(
    () => () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      baseMaterials.forEach((m) => m.dispose());
      placeholderTex.dispose();
    },
    [geometry, materials, baseMaterials, placeholderTex],
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
      u.uPlaneAspect.value = pw / ph; // live layout aspect for the still's cover-fit

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
