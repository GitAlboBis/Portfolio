"use client";

import * as THREE from "three/webgpu";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Fn,
  instancedArray,
  attributeArray,
  instanceIndex,
  uniform,
  float,
  vec3,
  color,
  positionLocal,
  length,
  normalize,
  smoothstep,
} from "three/tsl";
import { extractMesh } from "@/webgl/geometry/aMark";
import { sampleGlyphHomes } from "@/webgl/liquid/sampleGlyph";
import { usePointerStore } from "@/webgl/store/pointerStore";

/*
  The "A" fluid MODEL: a WebGPU compute particle system whose particles are
  spring-pulled to home positions sampled from the glyph (so the letter holds its
  shape), shoved outward by the pointer (splash) and flowing back. Rendered
  DIRECTLY as instanced spheres (the screen-space-fluid composite is shelved — it
  hid the model; this is the visible baseline to iterate on).
*/
const MODEL_URL = "/models/a-liquid.glb";
useGLTF.preload(MODEL_URL);

const COUNT = 42000;

export function FluidParticles() {
  const { scene } = useGLTF(MODEL_URL);
  const mesh = useMemo(() => extractMesh(scene), [scene]);
  useThree();

  const sim = useMemo(() => {
    const homes = sampleGlyphHomes(mesh, COUNT);
    const homeBuffer = attributeArray(homes, "vec3");
    const positions = instancedArray(COUNT, "vec3");
    const velocities = instancedArray(COUNT, "vec3");

    const uMouse = uniform(new THREE.Vector3(9999, 9999, 9999));
    const uDt = uniform(0);
    const uSpring = uniform(16);
    const uDampK = uniform(3.5);
    const uPushRadius = uniform(0.6);
    const uPushStrength = uniform(16);
    const uRadius = uniform(0.03);

    const computeInit = Fn(() => {
      positions.element(instanceIndex).assign(homeBuffer.element(instanceIndex));
      velocities.element(instanceIndex).assign(vec3(0));
    })().compute(COUNT);

    const computeUpdate = Fn(() => {
      const pos = positions.element(instanceIndex);
      const vel = velocities.element(instanceIndex);
      const home = homeBuffer.element(instanceIndex);
      const dt = uDt;
      vel.addAssign(home.sub(pos).mul(uSpring).mul(dt));
      const toP = pos.sub(uMouse);
      const d = length(toP);
      const push = smoothstep(uPushRadius, float(0), d).mul(uPushStrength);
      vel.addAssign(normalize(toP).mul(push).mul(dt));
      vel.subAssign(vel.mul(uDampK).mul(dt));
      pos.addAssign(vel.mul(dt));
    })().compute(COUNT);

    const material = new THREE.MeshBasicNodeMaterial();
    material.positionNode = positionLocal.mul(uRadius).add(positions.element(instanceIndex));
    material.colorNode = color(0x49c6dd);

    const geometry = new THREE.IcosahedronGeometry(1, 1);

    return { positions, uMouse, uDt, computeInit, computeUpdate, material, geometry };
  }, [mesh]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const inited = useRef(false);
  const ray = useRef(new THREE.Vector3()).current;

  // InstancedMesh starts with a zeroed instanceMatrix (which would collapse the
  // node-driven positions to the origin) — seed identity.
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    const id = new THREE.Matrix4();
    for (let i = 0; i < COUNT; i++) m.setMatrixAt(i, id);
    m.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const r = state.gl as unknown as THREE.WebGPURenderer;
    if (!inited.current) {
      r.compute(sim.computeInit);
      inited.current = true;
    }
    sim.uDt.value = Math.min(delta, 1 / 30);

    const pointer = usePointerStore.getState();
    if (pointer.active) {
      ray.set(pointer.smooth.x, pointer.smooth.y, 0.5).unproject(state.camera);
      ray.sub(state.camera.position).normalize();
      const distToPlane = -state.camera.position.z / ray.z;
      sim.uMouse.value.copy(state.camera.position).addScaledVector(ray, distToPlane);
    } else {
      sim.uMouse.value.set(9999, 9999, 9999);
    }

    r.compute(sim.computeUpdate);
  });

  useEffect(
    () => () => {
      sim.material.dispose();
      sim.geometry.dispose();
    },
    [sim],
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[sim.geometry, sim.material, COUNT]}
      frustumCulled={false}
      renderOrder={1}
    />
  );
}
