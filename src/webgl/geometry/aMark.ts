/*
  Loads the "A" mark geometry and turns its SURFACE into per-particle "home"
  targets for the GPGPU spring. See docs/04-3D-HERO-WATER-LOGO.md §4.

  The GLB (public/models/a-mark.glb) was produced in Blender: a bold Georgia
  serif "A", extruded + beveled (carved volume), manifold, ~2 units tall,
  centered at the origin, front face toward +Z (the camera).
*/
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export type LayerFieldOptions = {
  size: number;
  frontBias: number; // 0..1 — weight toward camera-facing faces
  normalOffset: number; // push home outward along the normal (world units)
  volumeJitter: number; // inward jitter for fake-volume (body only)
  viewDir: THREE.Vector3;
};

export type LayerField = {
  size: number;
  count: number;
  aRef: Float32Array; // (u,v) texel center per particle
  homeTexture: THREE.DataTexture; // RGBA float: xyz = home, w = seed
  positions: Float32Array; // initial point positions (= home xyz) for first frame
};

/** Extract the first renderable mesh and bake its world transform into geometry. */
export function extractMesh(root: THREE.Object3D): THREE.Mesh {
  let found: THREE.Mesh | null = null;
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
  });
  if (!found) throw new Error("aMark: no mesh found in GLB");
  const mesh = found as THREE.Mesh;
  const geo = mesh.geometry.clone();
  geo.applyMatrix4(mesh.matrixWorld); // bake -> samples land in scene/root space
  if (!geo.attributes.normal) geo.computeVertexNormals();
  return new THREE.Mesh(geo, mesh.material);
}

export function sampleMarkLayerField(mesh: THREE.Mesh, o: LayerFieldOptions): LayerField {
  const size = o.size;
  const count = size * size;
  const sampler = new MeshSurfaceSampler(mesh).build();

  const home = new Float32Array(count * 4);
  const aRef = new Float32Array(count * 2);
  const positions = new Float32Array(count * 3);

  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  const setRef = (i: number) => {
    aRef[i * 2 + 0] = ((i % size) + 0.5) / size;
    aRef[i * 2 + 1] = (Math.floor(i / size) + 0.5) / size;
  };

  let written = 0;
  let guard = 0;
  while (written < count && guard < count * 12) {
    guard++;
    sampler.sample(p, n);
    const facing = n.dot(o.viewDir); // >0 = toward camera
    const keep = THREE.MathUtils.lerp(1 - o.frontBias, 1, (facing + 1) * 0.5);
    if (Math.random() > keep) continue;

    const off = o.normalOffset - Math.random() * o.volumeJitter;
    const i4 = written * 4;
    home[i4 + 0] = p.x + n.x * off;
    home[i4 + 1] = p.y + n.y * off;
    home[i4 + 2] = p.z + n.z * off;
    home[i4 + 3] = Math.random(); // seed
    const i3 = written * 3;
    positions[i3 + 0] = home[i4 + 0];
    positions[i3 + 1] = home[i4 + 1];
    positions[i3 + 2] = home[i4 + 2];
    setRef(written);
    written++;
  }
  // Guard exhausted (degenerate mesh): pad by repeating the first sample.
  while (written < count) {
    const i4 = written * 4;
    home[i4 + 0] = home[0];
    home[i4 + 1] = home[1];
    home[i4 + 2] = home[2];
    home[i4 + 3] = Math.random();
    const i3 = written * 3;
    positions[i3 + 0] = home[0];
    positions[i3 + 1] = home[1];
    positions[i3 + 2] = home[2];
    setRef(written);
    written++;
  }

  const homeTexture = new THREE.DataTexture(
    home,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  homeTexture.minFilter = THREE.NearestFilter;
  homeTexture.magFilter = THREE.NearestFilter;
  homeTexture.generateMipmaps = false;
  homeTexture.needsUpdate = true;

  return { size, count, aRef, homeTexture, positions };
}
