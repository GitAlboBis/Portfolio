"use client";

import { useEffect } from "react";
import { useControls, folder } from "leva";
import type { LiquidMaterial } from "./liquidWaterMaterial";

/*
  Dev-only live tuning for the liquid "A". Mounted only in development (see
  HeroLiquidLogo), so leva is tree-shaken out of the production bundle.
  Writes straight to the material's uniforms / scalar props — no recompile.
*/
export default function LiquidControls({ handle }: { handle: LiquidMaterial }) {
  const u = handle.uniforms;
  const v = useControls("Liquid A", {
    waves: folder({
      amplitude: { value: u.uAmp.value, min: 0, max: 0.2, step: 0.005 },
      frequency: { value: u.uFreq.value, min: 2, max: 40, step: 1 },
      speed: { value: u.uSpeed.value, min: 0.2, max: 4, step: 0.05 },
      ringSharpness: { value: u.uRingSharp.value, min: 4, max: 60, step: 1 },
      timeDecay: { value: u.uTimeDecay.value, min: 0.2, max: 4, step: 0.05 },
      spaceDecay: { value: u.uSpaceDecay.value, min: 0, max: 3, step: 0.05 },
    }),
    idle: folder({
      bgAmplitude: { value: u.uBgAmp.value, min: 0, max: 0.06, step: 0.002 },
      bgScale: { value: u.uBgScale.value, min: 0.2, max: 5, step: 0.1 },
      bgSpeed: { value: u.uBgSpeed.value, min: 0, max: 2, step: 0.02 },
    }),
    foam: folder({
      foamThreshold: { value: u.uFoamThreshold.value, min: 0, max: 0.5, step: 0.01 },
      foamWidth: { value: u.uFoamWidth.value, min: 0.01, max: 0.5, step: 0.01 },
      foamGain: { value: u.uFoamGain.value, min: 0.5, max: 8, step: 0.1 },
    }),
    glass: folder({
      transmission: { value: handle.material.transmission, min: 0, max: 1, step: 0.02 },
      ior: { value: handle.material.ior, min: 1, max: 2, step: 0.005 },
      thickness: { value: handle.material.thickness, min: 0, max: 4, step: 0.05 },
      roughness: { value: u.uRoughness.value, min: 0, max: 0.6, step: 0.005 },
      attenuationDistance: {
        value: handle.material.attenuationDistance,
        min: 0.2,
        max: 4,
        step: 0.05,
      },
      clearcoat: { value: handle.material.clearcoat, min: 0, max: 1, step: 0.02 },
    }),
  });

  useEffect(() => {
    u.uAmp.value = v.amplitude;
    u.uFreq.value = v.frequency;
    u.uSpeed.value = v.speed;
    u.uRingSharp.value = v.ringSharpness;
    u.uTimeDecay.value = v.timeDecay;
    u.uSpaceDecay.value = v.spaceDecay;
    u.uBgAmp.value = v.bgAmplitude;
    u.uBgScale.value = v.bgScale;
    u.uBgSpeed.value = v.bgSpeed;
    u.uFoamThreshold.value = v.foamThreshold;
    u.uFoamWidth.value = v.foamWidth;
    u.uFoamGain.value = v.foamGain;
    u.uRoughness.value = v.roughness;
    handle.material.transmission = v.transmission;
    handle.material.ior = v.ior;
    handle.material.thickness = v.thickness;
    handle.material.attenuationDistance = v.attenuationDistance;
    handle.material.clearcoat = v.clearcoat;
  }, [handle, u, v]);

  return null;
}
