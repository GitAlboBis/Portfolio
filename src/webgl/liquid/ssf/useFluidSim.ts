"use client";

import * as THREE from "three/webgpu";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Fn,
  instancedArray,
  attributeArray,
  instanceIndex,
  uniform,
  float,
  vec3,
  length,
  normalize,
  smoothstep,
  clamp,
} from "three/tsl";
import { extractMesh } from "@/webgl/geometry/aMark";
import { sampleGlyphHomes } from "@/webgl/liquid/sampleGlyph";
import { usePointerStore } from "@/webgl/store/pointerStore";
import { FLUID_COUNT } from "./constants";

/*
  The fluid SIM, extracted from the old FluidParticles so BOTH the SSF render
  manager and the direct-render fallback share one compute system. Particles are
  spring-pulled to glyph-sampled home positions (the "A" holds its shape) and
  ejected by the pointer — now DIRECTIONALLY, toward the pointer's motion and
  scaled by its world-space speed (a fast flick throws a sheet of particles), with
  the spring + damping pulling them home as a risacca.

  The compute runs in a priority -1 useFrame: negative priority orders this BEFORE
  every render callback without taking over R3F's loop (the auto-render gate only
  counts priority > 0), so the direct-render fallback still auto-renders while the
  SSF manager — at priority 1 — owns the loop. See the SSF blueprint §B.
*/
const MODEL_URL = "/models/a-liquid.glb";
useGLTF.preload(MODEL_URL);

export type FluidSim = {
  // TSL storage/uniform nodes — kept loose so downstream material chains
  // (.element/.mul/.add) aren't fought by the strict @types/three node typings.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  positions: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uRadius: any;
};

export function useFluidSim(): FluidSim {
  const { scene } = useGLTF(MODEL_URL);
  const mesh = useMemo(() => extractMesh(scene), [scene]);

  const sim = useMemo(() => {
    const homes = sampleGlyphHomes(mesh, FLUID_COUNT);
    const homeBuffer = attributeArray(homes, "vec3");
    const positions = instancedArray(FLUID_COUNT, "vec3");
    const velocities = instancedArray(FLUID_COUNT, "vec3");

    const uMouse = uniform(new THREE.Vector3(9999, 9999, 9999));
    const uMouseVel = uniform(new THREE.Vector3(0, 0, 0));
    const uSpeed = uniform(0);
    const uDt = uniform(0);
    const uSpring = uniform(20);
    const uDampK = uniform(3.4);
    const uPushRadius = uniform(0.6);
    const uPushStrength = uniform(9);
    const uEjectStrength = uniform(7);
    const uRadius = uniform(0.05);

    const computeInit = Fn(() => {
      positions.element(instanceIndex).assign(homeBuffer.element(instanceIndex));
      velocities.element(instanceIndex).assign(vec3(0));
    })().compute(FLUID_COUNT);

    const computeUpdate = Fn(() => {
      const pos = positions.element(instanceIndex);
      const vel = velocities.element(instanceIndex);
      const home = homeBuffer.element(instanceIndex);
      const dt = uDt;

      // spring back to the glyph home (the risacca) + damping
      vel.addAssign(home.sub(pos).mul(uSpring).mul(dt));

      // directional, speed-scaled ejection: bias the outward push toward the
      // pointer's travel direction; a faster cursor throws particles harder.
      const toP = pos.sub(uMouse);
      const d = length(toP);
      const falloff = smoothstep(uPushRadius, float(0), d); // 1 near cursor -> 0 at radius
      const radialDir = normalize(toP);
      const motionDir = normalize(uMouseVel.add(vec3(1e-5)));
      const ejectDir = normalize(radialDir.add(motionDir.mul(1.5)));
      const speedScale = clamp(uSpeed.mul(uEjectStrength), float(0), float(40));
      vel.addAssign(ejectDir.mul(falloff).mul(uPushStrength.add(speedScale)).mul(dt));

      vel.subAssign(vel.mul(uDampK).mul(dt));
      pos.addAssign(vel.mul(dt));
    })().compute(FLUID_COUNT);

    return {
      positions,
      uRadius,
      uMouse,
      uMouseVel,
      uSpeed,
      uDt,
      computeInit,
      computeUpdate,
    };
  }, [mesh]);

  const inited = useRef(false);

  useFrame((state, delta) => {
    const r = state.gl as unknown as THREE.WebGPURenderer;
    // compute is WebGPU-only; on a WebGL2 backend it is absent — skip rather than throw.
    if (typeof r.compute !== "function") return;

    if (!inited.current) {
      r.compute(sim.computeInit);
      inited.current = true;
    }
    sim.uDt.value = Math.min(delta, 1 / 30);

    const p = usePointerStore.getState();
    if (p.active) {
      sim.uMouse.value.copy(p.world);
      sim.uMouseVel.value.copy(p.worldVel);
      sim.uSpeed.value = p.speed;
    } else {
      sim.uMouse.value.set(9999, 9999, 9999);
      sim.uMouseVel.value.set(0, 0, 0);
      sim.uSpeed.value = 0;
    }

    r.compute(sim.computeUpdate);
  }, -1);

  // Re-init the sim buffers if the glyph (and thus the home positions) changes.
  useEffect(() => {
    inited.current = false;
  }, [sim]);

  return { positions: sim.positions, uRadius: sim.uRadius };
}
