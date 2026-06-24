/*
  A procedural sky/sea + sun scene used only as the source for the PMREM
  environment map. This is the single biggest realism lever (per the analysis of
  matsuoka-601/Splash): the studio RoomEnvironment is what made the glass read as
  "CG". An outdoor sky→horizon→sea gradient with a bright SUN DISC gives the
  liquid mark natural reflections AND a moving sun glint on the wave crests
  (Splash's specular sparkle, achieved here purely through reflection).
*/
import * as THREE from "three/webgpu";
import { Fn, color, mix, smoothstep, positionLocal, vec3 } from "three/tsl";

export function createSkyEnvironment(radius = 40) {
  const scene = new THREE.Scene();
  const geometry = new THREE.SphereGeometry(radius, 48, 24);

  const material = new THREE.MeshBasicNodeMaterial();
  material.side = THREE.BackSide;
  material.toneMapped = false; // keep the sun bright (HDR-ish) for a real glint
  material.colorNode = Fn(() => {
    const dir = positionLocal.normalize(); // direction from the sphere centre
    const h = dir.y.mul(0.5).add(0.5); // 0 = down (sea) .. 1 = up (zenith)

    const zenith = color(0x6fb0e6); // upper sky
    const horizon = color(0xeaf2f0); // bright hazy horizon band
    const sea = color(0x247e9c); // sea below the horizon
    const lower = mix(sea, horizon, smoothstep(0.32, 0.5, h));
    const sky = mix(lower, zenith, smoothstep(0.5, 0.95, h)).toVar();

    // sun, placed up + toward the camera so it glints on the front-facing crests
    const sunDir = vec3(0.3, 0.55, 0.78).normalize();
    const sd = dir.dot(sunDir).max(0.0);
    const sunCore = smoothstep(0.9986, 0.9999, sd); // tight disc
    const sunHalo = smoothstep(0.9, 0.999, sd).mul(0.35); // soft bloom
    const sunCol = color(0xfff4d8);
    sky.addAssign(sunCol.mul(sunCore.mul(7.0).add(sunHalo)));

    return sky;
  })();

  scene.add(new THREE.Mesh(geometry, material));

  return {
    scene,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
