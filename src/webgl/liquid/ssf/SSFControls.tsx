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
    diffuseColor: "#8cdcf0", // Splash default (140,220,240)
    density: { value: 0.7, min: 0, max: 6, step: 0.05 }, // x10 in the shader
    roughness: { value: 0.06, min: 0, max: 1, step: 0.01 }, // PMREM: 0 mirror .. frosted
    specular: { value: 0.35, min: 0, max: 2, step: 0.05 }, // wet glint weight (Splash pow 300)
  });

  useEffect(() => {
    const [r, g, b] = hexToRaw(v.diffuseColor);
    handle.diffuseColor.value.set(r, g, b);
    handle.uDensity.value = v.density;
    handle.uRoughness.value = v.roughness;
    handle.uSpecular.value = v.specular;
  }, [v, handle]);

  return null;
}
