"use client";

import { useEffect } from "react";
import { useControls } from "leva";
import type { CompositeHandle } from "./materials";

/*
  Dev-only leva panel for the SSF water — the Splash knobs only (tree-shaken out of
  production via the dynamic import in SSFHero). The look comes from the environment
  cubemap (reflected + refracted); the only color is `diffuseColor` (absorption).
*/

// parse "#rrggbb" to raw 0..1 (Splash uses the raw (140,220,240)/255 — NOT linearized)
function hexToRaw(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function SSFControls({ handle }: { handle: CompositeHandle }) {
  const v = useControls("SSF Water", {
    diffuseColor: "#00bcf2", // water tint (Beer-Lambert) (0, 0.7375, 0.95)
    density: { value: 1.6, min: 0, max: 8, step: 0.1 }, // Beer-Lambert tint strength (A is thin -> needs higher)
    reflectFloor: { value: 0.18, min: 0, max: 1, step: 0.02 }, // baseline reflection so the env shows on a flat letter
    refractLod: { value: 3.0, min: 0, max: 8, step: 0.5 }, // env mip for the see-through transmitted lookup
    specular: { value: 0.0, min: 0, max: 2, step: 0.05 }, // wet sun glint (reference keeps it 0)
    edgeFoam: { value: 0.35, min: 0, max: 1, step: 0.05 }, // cyan-white foam at depth jumps
  });

  useEffect(() => {
    const [r, g, b] = hexToRaw(v.diffuseColor);
    handle.diffuseColor.value.set(r, g, b);
    handle.uDensity.value = v.density;
    handle.uReflectFloor.value = v.reflectFloor;
    handle.uRefractLod.value = v.refractLod;
    handle.uSpecular.value = v.specular;
    handle.uEdgeFoam.value = v.edgeFoam;
  }, [v, handle]);

  return null;
}
