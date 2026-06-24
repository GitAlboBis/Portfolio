"use client";

import * as THREE from "three/webgpu";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Fn, color, float, positionWorld, normalWorld, cameraPosition } from "three/tsl";
import type { SplashConfig } from "./liquidConfig";

/*
  Water/foam droplets that fly OFF the mark. HeroLiquidLogo calls `emit()` when
  the pointer sweeps fast across the "A": droplets launch in the mouse's world
  direction (scaled by pointer speed), pop off the surface toward the viewer,
  arc under gravity and fade. A fixed-size instanced pool, CPU-simulated (a few
  hundred droplets is cheap and avoids GPGPU complexity). World-space — it is a
  SIBLING of the responsive-scaled mark group, so emission points (the raycast
  hit) map 1:1.
*/
export type SplashHandle = {
  emit: (
    pos: THREE.Vector3,
    dir: THREE.Vector3,
    speed: number,
    popDir: THREE.Vector3,
  ) => void;
};

type Props = { config: SplashConfig };

export const SplashSystem = forwardRef<SplashHandle, Props>(function SplashSystem(
  { config: S },
  ref,
) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 7, 5), []);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardNodeMaterial();
    m.colorNode = color(0xbfe7ee); // light teal — same substance as the "A"
    m.roughnessNode = float(0.06); // sharp -> catches the sky + sun glint like a water bead
    m.metalnessNode = float(0.0);
    m.transparent = true;
    m.opacity = 0.88;
    // fresnel rim sparkle so droplets read as wet beads
    m.emissiveNode = Fn(() => {
      const viewDir = cameraPosition.sub(positionWorld).normalize();
      const fres = float(1).sub(normalWorld.dot(viewDir).saturate()).pow(3);
      return color(0xaadcea).mul(fres).mul(0.5);
    })();
    return m;
  }, []);

  // CPU particle pool (flat typed arrays, recycled via a ring cursor)
  const pool = useMemo(
    () => ({
      pos: new Float32Array(S.pool * 3),
      vel: new Float32Array(S.pool * 3),
      life: new Float32Array(S.pool),
      maxLife: new Float32Array(S.pool),
      size: new Float32Array(S.pool),
      cursor: { i: 0 },
    }),
    [S.pool],
  );

  const scratch = useRef({
    m: new THREE.Matrix4(),
    p: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    s: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    pop: new THREE.Vector3(),
  }).current;

  useImperativeHandle(
    ref,
    (): SplashHandle => ({
      emit(posV, dirV, speed, popV) {
        const count = Math.max(1, Math.min(S.emitMax, Math.round(speed * S.emitPerSpeed)));
        scratch.dir.copy(dirV);
        if (scratch.dir.lengthSq() > 1e-6) scratch.dir.normalize();
        scratch.pop.copy(popV);
        if (scratch.pop.lengthSq() > 1e-6) scratch.pop.normalize();
        const launch = speed * S.speedToVel;
        for (let c = 0; c < count; c++) {
          const i = pool.cursor.i;
          pool.cursor.i = (i + 1) % S.pool;
          const i3 = i * 3;
          pool.pos[i3] = posV.x + (Math.random() - 0.5) * 0.03;
          pool.pos[i3 + 1] = posV.y + (Math.random() - 0.5) * 0.03;
          pool.pos[i3 + 2] = posV.z + (Math.random() - 0.5) * 0.03;
          const sx = (Math.random() - 0.5) * 2;
          const sy = (Math.random() - 0.5) * 2;
          const sz = (Math.random() - 0.5) * 2;
          pool.vel[i3] =
            scratch.dir.x * launch + scratch.pop.x * launch * S.popOut + sx * S.spread * launch;
          pool.vel[i3 + 1] =
            scratch.dir.y * launch +
            scratch.pop.y * launch * S.popOut +
            launch * S.lift +
            sy * S.spread * launch;
          pool.vel[i3 + 2] =
            scratch.dir.z * launch + scratch.pop.z * launch * S.popOut + sz * S.spread * launch;
          const life = S.lifeMin + Math.random() * (S.lifeMax - S.lifeMin);
          pool.life[i] = life;
          pool.maxLife[i] = life;
          pool.size[i] = S.dropMin + Math.random() * (S.dropMax - S.dropMin);
        }
      },
    }),
    [pool, S, scratch],
  );

  // start with every instance hidden
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    scratch.m.makeScale(0, 0, 0);
    for (let i = 0; i < S.pool; i++) mesh.setMatrixAt(i, scratch.m);
    mesh.instanceMatrix.needsUpdate = true;
  }, [S.pool, scratch]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 1 / 30);
    const damp = Math.max(0, 1 - S.drag * dt);
    const { m, p, q, s } = scratch;
    q.identity();
    let dirty = false;
    for (let i = 0; i < S.pool; i++) {
      if (pool.life[i] <= 0) continue; // hidden already (scale-0 matrix persists)
      dirty = true;
      pool.life[i] -= dt;
      const i3 = i * 3;
      if (pool.life[i] <= 0) {
        m.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, m);
        continue;
      }
      pool.vel[i3 + 1] += S.gravity * dt;
      pool.vel[i3] *= damp;
      pool.vel[i3 + 1] *= damp;
      pool.vel[i3 + 2] *= damp;
      pool.pos[i3] += pool.vel[i3] * dt;
      pool.pos[i3 + 1] += pool.vel[i3 + 1] * dt;
      pool.pos[i3 + 2] += pool.vel[i3 + 2] * dt;
      const age = pool.maxLife[i] - pool.life[i];
      const appear = Math.min(1, age / 0.04);
      const fadeOut = Math.min(1, pool.life[i] / 0.3);
      const sc = pool.size[i] * appear * fadeOut;
      p.set(pool.pos[i3], pool.pos[i3 + 1], pool.pos[i3 + 2]);
      s.set(sc, sc, sc);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    if (dirty) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, S.pool]}
      frustumCulled={false}
      renderOrder={2}
    />
  );
});
