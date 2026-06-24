"use client";

import * as THREE from "three/webgpu";
import { useEffect, useMemo } from "react";
import { Fn, color, mix, smoothstep, screenUV } from "three/tsl";

/*
  Full-view sea gradient rendered INSIDE the R3F scene as an opaque plane.
  Two jobs:
   1) the visible bright Pan di Zucchero surface the liquid "A" floats in;
   2) the opaque content the liquid's TRANSMISSION pass refracts (a transmissive
      material samples the scene's opaque buffer, NOT the DOM behind a transparent
      canvas — so the sea must live in the scene to be refracted).

  Ported from the WebGL2 SeaBackdrop's raw GLSL to a TSL NodeMaterial because
  WebGPURenderer does not run raw-GLSL ShaderMaterial. Colours match the CSS
  SEA_GRADIENT exactly (hex literals). screenUV maps the gradient to the screen
  regardless of the plane's size, so it always fills the view.
*/
export function SeaBackdropTSL() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(80, 45), []);

  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial();
    m.colorNode = Fn(() => {
      const t = screenUV.y.oneMinus(); // 0 = top (sky), 1 = bottom (deep)
      const azure = color(0x5a9ccd);
      const pale = color(0xcfe6f0);
      const turq = color(0x2f93ab);
      const deep = color(0x0c3d57);
      const c = mix(azure, pale, smoothstep(0.0, 0.5, t)).toVar();
      c.assign(mix(c, turq, smoothstep(0.5, 0.62, t)));
      c.assign(mix(c, deep, smoothstep(0.62, 1.0, t)));
      return c;
    })();
    m.toneMapped = false;
    m.depthWrite = true;
    return m;
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, 0, -5]}
      renderOrder={-10}
      frustumCulled={false}
    />
  );
}
