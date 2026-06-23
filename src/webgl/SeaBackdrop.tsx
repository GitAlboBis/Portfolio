"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";

/*
  Full-screen sea gradient rendered INSIDE the R3F scene (behind the particles),
  so the bright Pan di Zucchero surface is part of the render and does not depend
  on the WebGL canvas compositing transparently over the DOM (which is fragile in
  some software/headless GL paths). The CSS backdrop in CanvasHost stays as the
  reduced-motion / no-canvas fallback. Colors mirror CanvasHost's SEA_GRADIENT.
*/

const VERT = /* glsl */ `
out vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0); // screen-filling, camera-independent, far plane
}
`;

const FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
out vec4 fragColor;
void main(){
  float t = 1.0 - vUv.y;                       // 0 = top (sky), 1 = bottom (deep)
  vec3 azure = vec3(0.353, 0.612, 0.804);      // #5a9ccd
  vec3 pale  = vec3(0.812, 0.902, 0.941);      // #cfe6f0 (sun band ~mid)
  vec3 turq  = vec3(0.184, 0.576, 0.671);      // #2f93ab
  vec3 deep  = vec3(0.047, 0.239, 0.341);      // #0c3d57
  vec3 col = mix(azure, pale, smoothstep(0.0, 0.5, t));
  col = mix(col, turq, smoothstep(0.5, 0.62, t));
  col = mix(col, deep, smoothstep(0.62, 1.0, t));
  fragColor = vec4(col, 1.0);
}
`;

export function SeaBackdrop() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: FRAG,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return <mesh geometry={geometry} material={material} renderOrder={-10} frustumCulled={false} />;
}
