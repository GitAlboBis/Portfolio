"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { extractMesh, sampleMarkLayerField, type LayerField } from "@/webgl/geometry/aMark";
import { GpgpuSim } from "@/webgl/gpgpu/gpgpuSim";
import { makeRenderMaterial } from "@/webgl/gpgpu/gpgpuRenderShader";
import { bodyConfig, skinConfig, type LayerConfig } from "@/webgl/gpgpu/gpgpuConfig";
import { useFxStore } from "@/webgl/store/fxStore";
import { usePointerStore } from "@/webgl/store/pointerStore";
import { useScrollStore } from "@/webgl/store/scrollStore";

const MODEL_URL = "/models/a-mark.glb";
useGLTF.preload(MODEL_URL);

const VIEW_DIR = new THREE.Vector3(0, 0, 1); // front faces look toward the camera
const clamp01 = (a: number, b: number, x: number) =>
  Math.min(1, Math.max(0, (x - a) / (b - a)));

function useLayer(mesh: THREE.Mesh, cfg: LayerConfig) {
  const field = useMemo<LayerField>(
    () =>
      sampleMarkLayerField(mesh, {
        size: cfg.SIZE,
        frontBias: cfg.FRONT_BIAS,
        normalOffset: cfg.NORMAL_OFFSET,
        volumeJitter: cfg.VOLUME_JITTER,
        viewDir: VIEW_DIR,
      }),
    [mesh, cfg],
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(field.positions, 3));
    g.setAttribute("aRef", new THREE.BufferAttribute(field.aRef, 2));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
    return g;
  }, [field]);

  const sim = useMemo(() => new GpgpuSim(cfg.SIZE, field.homeTexture, cfg), [field, cfg]);
  const material = useMemo(() => makeRenderMaterial(cfg), [cfg]);

  useEffect(() => {
    return () => {
      sim.dispose();
      material.dispose();
      geometry.dispose();
      field.homeTexture.dispose();
    };
  }, [sim, material, geometry, field]);

  return { field, geometry, sim, material };
}

export function HeroLogo() {
  const tier = useFxStore((s) => s.tier);
  const { scene } = useGLTF(MODEL_URL);
  const mesh = useMemo(() => extractMesh(scene), [scene]);

  const bodyCfg = useMemo(() => bodyConfig(tier), [tier]);
  const skinCfg = useMemo(() => skinConfig(tier), [tier]);
  const body = useLayer(mesh, bodyCfg);
  const skin = useLayer(mesh, skinCfg);

  const groupRef = useRef<THREE.Group>(null);

  // frame-loop scratch (no per-frame allocation)
  const mouse = useRef(new THREE.Vector3(9999, 9999, 9999)).current;
  const prevMouse = useRef(new THREE.Vector3(9999, 9999, 9999)).current;
  const ray = useRef(new THREE.Vector3()).current;
  const agitation = useRef(0);
  const time = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const gl = state.gl;
    const camera = state.camera;
    const pointer = usePointerStore.getState();
    const scroll = useScrollStore.getState();

    // --- pointer -> world on the z=0 logo plane ---
    if (pointer.active) {
      ray.set(pointer.smooth.x, pointer.smooth.y, 0.5).unproject(camera);
      ray.sub(camera.position).normalize();
      const distToPlane = -camera.position.z / ray.z;
      pointer.world.copy(camera.position).addScaledVector(ray, distToPlane);
      mouse.copy(pointer.world);
    } else {
      mouse.set(9999, 9999, 9999);
    }

    // --- agitation: rises with pointer movement, decays ---
    const moved = pointer.active ? mouse.distanceTo(prevMouse) : 0;
    prevMouse.copy(mouse);
    const target = pointer.active ? Math.min(1, (moved / dt) * 0.05) : 0;
    agitation.current += (target - agitation.current) * (target > agitation.current ? 0.4 : 0.06);

    // --- scroll hand-off: fade + disperse the mark into the sea ---
    const fade = 1 - clamp01(0.04, 0.14, scroll.progress);
    const scrollDisp = clamp01(0.02, 0.16, scroll.progress) * 0.9;
    const disp = Math.min(1.5, agitation.current + scrollDisp);

    // --- perspective point-size scale (P[1][1] * halfViewportPx) ---
    const projScale = 0.5 * camera.projectionMatrix.elements[5] * gl.domElement.height;

    // --- step both sims (2 substeps for the stiff body spring) ---
    const sub = 2;
    const sdt = dt / sub;
    for (let i = 0; i < sub; i++) {
      time.current += sdt;
      body.sim.step(gl, { mouse, dt: sdt, disp, time: time.current });
      skin.sim.step(gl, { mouse, dt: sdt, disp, time: time.current });
    }

    for (const layer of [body, skin]) {
      const u = layer.material.uniforms;
      u.uPos.value = layer.sim.posTexture;
      u.uVel.value = layer.sim.velTexture;
      u.uProjScale.value = projScale;
      u.uOpacity.value = fade;
    }
    if (groupRef.current) groupRef.current.visible = fade > 0.01;
  });

  return (
    <group ref={groupRef}>
      <points
        geometry={body.geometry}
        material={body.material}
        frustumCulled={false}
        renderOrder={0}
      />
      <points
        geometry={skin.geometry}
        material={skin.material}
        frustumCulled={false}
        renderOrder={1}
      />
    </group>
  );
}
