"use client";

import * as THREE from "three/webgpu";
import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { buildLiquidWaterMaterial } from "@/webgl/liquid/liquidWaterMaterial";
import {
  liquidParams,
  impactCount,
  splashConfig,
  LIQUID_COLORS,
} from "@/webgl/liquid/liquidConfig";
import { createSkyEnvironment } from "@/webgl/liquid/skyEnvironment";
import { SplashSystem, type SplashHandle } from "@/webgl/liquid/SplashSystem";
import { useFxStore } from "@/webgl/store/fxStore";
import { usePointerStore } from "@/webgl/store/pointerStore";
import { useScrollStore } from "@/webgl/store/scrollStore";

const MODEL_URL = "/models/a-liquid.glb";
useGLTF.preload(MODEL_URL);

// dev-only leva panel; tree-shaken out of the production bundle
const LiquidControls =
  process.env.NODE_ENV !== "production"
    ? dynamic(() => import("@/webgl/liquid/LiquidControls"), { ssr: false })
    : null;

const clamp01 = (a: number, b: number, x: number) =>
  Math.min(1, Math.max(0, (x - a) / (b - a)));

/** First renderable mesh's geometry, baked to world (the GLB node is identity). */
function useGeometry(): THREE.BufferGeometry {
  const { scene } = useGLTF(MODEL_URL);
  return useMemo(() => {
    let found: THREE.Mesh | null = null;
    scene.updateWorldMatrix(true, true);
    scene.traverse((o) => {
      if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
    });
    if (!found) throw new Error("a-liquid.glb: no mesh found");
    const src = found as THREE.Mesh;
    const geo = src.geometry.clone();
    geo.applyMatrix4(src.matrixWorld);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
  }, [scene]);
}

export function HeroLiquidLogo() {
  const tier = useFxStore((s) => s.tier);
  const geometry = useGeometry();

  const handle = useMemo(
    () =>
      buildLiquidWaterMaterial({
        params: liquidParams(tier),
        colors: LIQUID_COLORS,
        impactCount: impactCount(tier),
      }),
    [tier],
  );
  const splash = useMemo(() => splashConfig(tier), [tier]);

  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const splashRef = useRef<SplashHandle>(null);

  // frame-loop scratch (no per-frame allocation)
  const raycaster = useRef(new THREE.Raycaster()).current;
  const ndc = useRef(new THREE.Vector2()).current;
  const ray = useRef(new THREE.Vector3()).current;
  const pWorld = useRef(new THREE.Vector3()).current; // pointer on the z=0 plane
  const pPrev = useRef(new THREE.Vector3(1e9, 1e9, 1e9)).current;
  const moveDir = useRef(new THREE.Vector3()).current; // world pointer movement / frame
  const popDir = useRef(new THREE.Vector3()).current; // off-surface launch (toward viewer)
  const hitWorld = useRef(new THREE.Vector3()).current;
  const hit = useRef(new THREE.Vector3()).current; // hit in mesh-local space
  const lastPoint = useRef(new THREE.Vector3(1e9, 1e9, 1e9)).current;
  const idx = useRef(0);
  const lastRayTime = useRef(0);

  const { gl, scene } = useThree();

  // sky/sea environment so transmission + droplets reflect/refract realistically.
  useEffect(() => {
    let envRT: { texture: THREE.Texture; dispose: () => void } | null = null;
    const sky = createSkyEnvironment();
    try {
      const pmrem = new THREE.PMREMGenerator(gl as unknown as THREE.WebGPURenderer);
      envRT = pmrem.fromScene(sky.scene, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.95;
      pmrem.dispose();
    } catch (err) {
      console.warn("[liquid] environment map unavailable:", err);
    }
    sky.dispose();
    return () => {
      if (envRT && scene.environment === envRT.texture) scene.environment = null;
      envRT?.dispose();
    };
  }, [gl, scene]);

  // dispose on tier change / unmount
  useEffect(() => () => handle.dispose(), [handle]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    handle.uTime.value += dt;
    const t = handle.uTime.value;

    const pointer = usePointerStore.getState();
    const scroll = useScrollStore.getState();
    const camera = _.camera;
    const mesh = meshRef.current;

    // --- pointer world position + speed (every frame, for splash direction) ---
    let speedW = 0;
    if (pointer.active) {
      ray.set(pointer.smooth.x, pointer.smooth.y, 0.5).unproject(camera);
      ray.sub(camera.position).normalize();
      const distToPlane = -camera.position.z / ray.z;
      pWorld.copy(camera.position).addScaledVector(ray, distToPlane);
      if (pPrev.x > 1e8) {
        pPrev.copy(pWorld); // first frame after entry — seed, no spurious speed
      } else {
        moveDir.subVectors(pWorld, pPrev);
        speedW = moveDir.length() / dt;
        pPrev.copy(pWorld);
      }
    } else {
      pPrev.set(1e9, 1e9, 1e9);
    }

    // --- raycast the mark (throttled): ripple impact + splash off the surface ---
    if (mesh && pointer.active && t - lastRayTime.current >= 0.03) {
      lastRayTime.current = t;
      ndc.set(pointer.smooth.x, pointer.smooth.y);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(mesh, false);
      if (hits.length > 0) {
        hitWorld.copy(hits[0].point);
        hit.copy(hitWorld);
        mesh.worldToLocal(hit); // world -> local (accounts for responsive scale)
        if (hit.distanceTo(lastPoint) > 0.05) {
          const i = idx.current;
          handle.impacts[i].value.set(hit.x, hit.y, hit.z, t);
          idx.current = (i + 1) % handle.impacts.length;
          lastPoint.copy(hit);
        }
        // splash: launch foam droplets in the mouse direction, scaled by speed
        if (speedW > splash.emitSpeedThreshold) {
          popDir.subVectors(camera.position, hitWorld); // toward the viewer
          splashRef.current?.emit(hitWorld, moveDir, speedW, popDir);
        }
      }
    }

    // --- scroll hand-off: shrink + drift up (transmissive => fade by scale) ---
    const fade = 1 - clamp01(0.04, 0.16, scroll.progress);
    if (groupRef.current) {
      const vp = _.viewport;
      let s = (vp.height * 0.62) / 2.0;
      s = Math.min(s, (vp.width * 0.86) / 2.4, 1.25);
      s *= Math.pow(fade, 0.6);
      groupRef.current.scale.setScalar(s);
      groupRef.current.position.y = (1 - fade) * 1.1;
      groupRef.current.visible = fade > 0.01;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={handle.material}
          frustumCulled={false}
        />
      </group>
      {/* world-space (NOT inside the scaled group) so emission points map 1:1 */}
      <SplashSystem ref={splashRef} config={splash} />
      {LiquidControls ? <LiquidControls handle={handle} /> : null}
    </>
  );
}
