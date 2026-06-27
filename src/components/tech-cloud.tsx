"use client";

/*
  TechCloud — "Tech Constellation" (WP-4)

  A real three.js icon cloud: the stack rendered as luminous brand marks
  suspended in the abyss. Each tech is a billboarded Sprite carrying a canvas
  texture drawn from a simple-icons path (no CDN), backed by an additive celeste
  halo so the marks read like bioluminescent plankton. A perspective camera gives
  true 3D foreshortening; a depth pass tints + dims marks toward the deep as they
  rotate away (near = bright foam, far = cool celeste). The sphere auto-drifts,
  follows the cursor, takes inertial drag, and flicks a clicked mark to face you.

  Architecture matches the repo's WebGL conventions: a section-scoped raw renderer
  (NOT R3F), one persistent rAF gated by a level `inView` flag (set by an
  IntersectionObserver AND a passive-scroll recompute — robust against smooth-
  scroll edge races), DPR capped at 1.5, full dispose. It is DECORATIVE
  (aria-hidden) — the accessible, complete skill list is the bento beneath it.
  prefers-reduced-motion → one static frame, no loop, no input. no-WebGL → the
  cloud quietly unmounts and the bento stands alone.
*/

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { techIcons } from "@/data/skill-icons";

// @theme ocean tokens (globals.css) as three colors.
const FOAM = new THREE.Color("#f4fafb");
const CELESTE = new THREE.Color("#9bd3ee");
const CELESTE_DEEP = new THREE.Color("#3f7f97"); // celeste pushed toward the deep

const SPHERE_R = 4.0;
const ICON_SCALE = 1.05; // world units at rest
const HALO_SCALE = 2.45;
const FOV = 45;

/** Draw a simple-icons 24×24 path to a white canvas texture (tinted by material.color). */
function makeIconTexture(path: string, size = 144): THREE.CanvasTexture | null {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  const pad = size * 0.15;
  const scale = (size - pad * 2) / 24;
  ctx.translate(pad, pad);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  try {
    ctx.fill(new Path2D(path));
  } catch {
    return null;
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Soft radial gradient for the additive glow behind each mark. */
function makeHaloTexture(size = 128): THREE.CanvasTexture | null {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.85)");
  g.addColorStop(0.4, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type Node = {
  base: THREE.Vector3; // unit-sphere position
  icon: THREE.Sprite;
  halo: THREE.Sprite;
  label: string;
  highlight: number; // eased 0..1 hover state
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function TechCloud({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- renderer (guarded: no-WebGL → unmount cloud) ---
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.touchAction = "none";
    canvas.style.cursor = reduced ? "default" : "grab";
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = 13;

    const group = new THREE.Group();
    group.rotation.order = "YXZ"; // Y (azimuth) then X (tilt) — matches flick math
    scene.add(group);

    // --- build nodes on a Fibonacci (golden-angle) sphere ---
    const haloTex = makeHaloTexture();
    const n = techIcons.length;
    const increment = Math.PI * (3 - Math.sqrt(5));
    const offset = 2 / n;
    const nodes: Node[] = [];
    const iconSprites: THREE.Sprite[] = [];
    const disposables: { dispose: () => void }[] = [];
    if (haloTex) disposables.push(haloTex);

    for (let i = 0; i < n; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * increment;
      const base = new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r);

      const iconTex = makeIconTexture(techIcons[i].path);
      if (!iconTex) continue;
      disposables.push(iconTex);

      const iconMat = new THREE.SpriteMaterial({
        map: iconTex,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        color: FOAM.clone(),
      });
      const haloMat = new THREE.SpriteMaterial({
        map: haloTex ?? undefined,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        color: CELESTE.clone(),
        opacity: 0.5,
      });
      disposables.push(iconMat, haloMat);

      const icon = new THREE.Sprite(iconMat);
      icon.position.copy(base).multiplyScalar(SPHERE_R);
      icon.scale.setScalar(ICON_SCALE);
      icon.renderOrder = 2;

      const halo = new THREE.Sprite(haloMat);
      halo.position.copy(icon.position);
      halo.scale.setScalar(HALO_SCALE);
      halo.renderOrder = 1;

      group.add(halo, icon);
      iconSprites.push(icon);
      nodes.push({ base, icon, halo, label: techIcons[i].label, highlight: 0 });
    }

    // --- interaction state ---
    const rot = { x: -0.32, y: 0 };
    const vel = { x: 0, y: 0 };
    const cursor = { x: 0, y: 0 }; // normalized -1..1 from container centre
    let dragging = false;
    let pointerDownAt = { x: 0, y: 0, t: 0 };
    let moved = 0;
    const last = { x: 0, y: 0 };
    let flick: { x: number; y: number; sx: number; sy: number; t0: number; dur: number } | null = null;
    let hovered: Node | null = null;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const colNear = new THREE.Color();

    // --- sizing ---
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // fit the sphere into the FOV with margin; pull back further when narrow
      const halfExtent = SPHERE_R + ICON_SCALE;
      const vFit = halfExtent / Math.tan((FOV * Math.PI) / 180 / 2) / 0.82;
      const hFit = vFit / Math.min(1, camera.aspect);
      camera.position.z = Math.max(vFit, hFit);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // --- per-frame projection: depth fog + hover easing ---
    const updateNodes = (dt: number) => {
      group.rotation.x = rot.x;
      group.rotation.y = rot.y;
      group.updateMatrixWorld(true);

      for (const node of nodes) {
        node.icon.getWorldPosition(tmp);
        const depth = THREE.MathUtils.clamp((tmp.z + SPHERE_R) / (2 * SPHERE_R), 0, 1);

        const target = node === hovered ? 1 : 0;
        node.highlight += (target - node.highlight) * Math.min(1, dt * 12);
        const hl = node.highlight;

        // near = bright foam + bigger; far = cool celeste + smaller + faint
        colNear.copy(CELESTE_DEEP).lerp(FOAM, depth);
        colNear.lerp(FOAM, hl);
        const iconMat = node.icon.material as THREE.SpriteMaterial;
        iconMat.color.copy(colNear);
        iconMat.opacity = 0.32 + depth * 0.68 + hl * 0.2;
        node.icon.scale.setScalar(ICON_SCALE * (0.7 + depth * 0.42 + hl * 0.45));

        const haloMat = node.halo.material as THREE.SpriteMaterial;
        haloMat.opacity = 0.12 + depth * 0.3 + hl * 0.55;
        haloMat.color.copy(CELESTE).lerp(FOAM, hl * 0.6);
        node.halo.scale.setScalar(HALO_SCALE * (0.75 + depth * 0.3 + hl * 0.5));
      }
    };

    const renderTooltip = () => {
      const tip = tooltipRef.current;
      if (!tip || !hovered) return;
      hovered.icon.getWorldPosition(tmp).project(camera);
      const w = container.clientWidth;
      const h = container.clientHeight;
      const x = (tmp.x * 0.5 + 0.5) * w;
      const y = (-tmp.y * 0.5 + 0.5) * h;
      tip.style.transform = `translate(-50%, calc(-100% - 14px)) translate(${x}px, ${y}px)`;
    };

    const renderOnce = () => {
      updateNodes(0.016);
      renderer.render(scene, camera);
      renderTooltip();
    };

    // --- main loop: one persistent rAF, renders only while in view & visible ---
    let raf = 0;
    let prev = performance.now();
    let inView = false;
    let gateTick = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (reduced) return;
      // Self-gate by geometry every 8 frames: Lenis drives scroll via transform,
      // which does NOT reliably fire IntersectionObserver or window 'scroll', but
      // getBoundingClientRect always reflects the true on-screen position.
      if ((gateTick++ & 7) === 0) {
        const r = container.getBoundingClientRect();
        const next = r.bottom > -120 && r.top < window.innerHeight + 120;
        if (next && !inView) prev = performance.now();
        inView = next;
      }
      if (!inView || document.hidden) return;

      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      if (flick) {
        const p = Math.min(1, (now - flick.t0) / flick.dur);
        const e = easeOutCubic(p);
        rot.x = flick.sx + (flick.x - flick.sx) * e;
        rot.y = flick.sy + (flick.y - flick.sy) * e;
        if (p >= 1) flick = null;
      } else if (!dragging) {
        rot.y += (0.0019 + cursor.x * 0.0042) * (dt * 60);
        rot.x += cursor.y * 0.0042 * (dt * 60);
        rot.x += (-0.32 - rot.x) * 0.02; // ease back to resting tilt
        rot.y += vel.y;
        rot.x += vel.x;
        vel.x *= 0.92;
        vel.y *= 0.92;
      }

      updateNodes(dt);
      renderer.render(scene, camera);
      renderTooltip();
    };

    // initial in-view state (the rAF self-gate keeps it current thereafter)
    {
      const r = container.getBoundingClientRect();
      inView = r.bottom > -120 && r.top < window.innerHeight + 120;
    }

    // --- pointer / raycast ---
    const setPointerFromEvent = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      cursor.x = pointer.x;
      cursor.y = -pointer.y;
    };

    const pickHover = () => {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(iconSprites, false)[0];
      const node = hit ? nodes.find((nd) => nd.icon === hit.object) ?? null : null;
      if (node !== hovered) {
        hovered = node;
        setHoverLabel(node?.label ?? null);
        canvas.style.cursor = node ? "pointer" : dragging ? "grabbing" : "grab";
      }
    };

    function faceNode(node: Node) {
      const b = node.base;
      const ty = Math.atan2(b.x, b.z);
      const tx = -Math.atan2(b.y, Math.sqrt(b.x * b.x + b.z * b.z));
      const dist = Math.hypot(tx - rot.x, ty - rot.y);
      flick = { x: tx, y: ty, sx: rot.x, sy: rot.y, t0: performance.now(), dur: Math.min(1500, Math.max(650, dist * 850)) };
    }

    const onPointerDown = (e: PointerEvent) => {
      if (reduced) return;
      dragging = true;
      flick = null;
      moved = 0;
      pointerDownAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      last.x = e.clientX;
      last.y = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (reduced) return;
      setPointerFromEvent(e);
      if (dragging) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        moved += Math.abs(dx) + Math.abs(dy);
        rot.y += dx * 0.006;
        rot.x += dy * 0.006;
        vel.y = dx * 0.0009;
        vel.x = dy * 0.0009;
        last.x = e.clientX;
        last.y = e.clientY;
      } else {
        pickHover();
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (reduced) return;
      dragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
      // a near-stationary press = click → flick the mark under the cursor to face us
      if (moved < 6 && performance.now() - pointerDownAt.t < 500) {
        setPointerFromEvent(e);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(iconSprites, false)[0];
        const node = hit ? nodes.find((nd) => nd.icon === hit.object) ?? null : null;
        if (node) faceNode(node);
      }
      pickHover();
    };
    const onPointerLeave = () => {
      cursor.x = 0;
      cursor.y = 0;
      dragging = false;
      hovered = null;
      setHoverLabel(null);
      canvas.style.cursor = reduced ? "default" : "grab";
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    // --- initial paint + loop start ---
    if (reduced) {
      rot.x = -0.4;
      rot.y = 0.6;
      renderOnce();
    } else {
      renderOnce(); // static sphere visible immediately, before the loop ramps
      raf = requestAnimationFrame(tick);
    }

    // --- teardown ---
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  if (failed) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(20rem, 46vw, 32rem)",
        touchAction: "none",
      }}
    >
      {/* faint abyssal core glow behind the constellation */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 48%, rgb(155 211 238 / 0.12), transparent 60%)",
        }}
      />
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          pointerEvents: "none",
          opacity: hoverLabel ? 1 : 0,
          transition: "opacity 180ms ease",
          padding: "0.3em 0.7em",
          borderRadius: "9999px",
          border: "1px solid rgb(155 211 238 / 0.35)",
          background: "rgb(7 34 46 / 0.78)",
          backdropFilter: "blur(6px)",
          color: "var(--color-foam)",
          fontFamily: "var(--font-sans)",
          fontSize: "0.74rem",
          fontWeight: 500,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          boxShadow: "0 0 18px rgb(155 211 238 / 0.25)",
          willChange: "transform",
        }}
      >
        {hoverLabel}
      </div>
    </div>
  );
}

export default TechCloud;
