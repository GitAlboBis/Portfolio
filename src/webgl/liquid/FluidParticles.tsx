"use client";

import * as THREE from "three/webgpu";
import { useEffect, useMemo, useRef } from "react";
import { color, positionLocal, instanceIndex } from "three/tsl";
import { useFluidSim } from "@/webgl/liquid/ssf/useFluidSim";
import { FLUID_COUNT } from "@/webgl/liquid/ssf/constants";

/*
  Direct-render FALLBACK for the "A" fluid (WebGL2 backend / "lite" tier, or when
  the SSF render manager fails). Consumes the SHARED compute sim (useFluidSim) and
  draws the particles as teal instanced spheres on the default camera layer, so
  R3F's auto-render shows them over the photo backdrop. The high-end path is the
  screen-space-fluid composite in ssf/SSFHero.tsx.
*/
export function FluidParticles() {
  const sim = useFluidSim();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { material, geometry } = useMemo(() => {
    const material = new THREE.MeshBasicNodeMaterial();
    material.positionNode = positionLocal
      .mul(sim.uRadius)
      .add(sim.positions.element(instanceIndex));
    material.colorNode = color(0x49c6dd);
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    return { material, geometry };
  }, [sim.positions, sim.uRadius]);

  // Seed identity instance matrices (a zeroed instanceMatrix collapses the
  // node-driven positions to the origin — HANDOFF gotcha).
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    const id = new THREE.Matrix4();
    for (let i = 0; i < FLUID_COUNT; i++) m.setMatrixAt(i, id);
    m.instanceMatrix.needsUpdate = true;
    m.layers.set(0);
  }, []);

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, FLUID_COUNT]}
      frustumCulled={false}
      renderOrder={1}
    />
  );
}
