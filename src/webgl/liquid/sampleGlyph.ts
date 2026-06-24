/*
  Samples the "A" glyph into per-particle HOME positions for the fluid.
  The fluid holds the letter because every particle is spring-pulled toward its
  home; the mouse shoves them out and they flow back. Surface samples pushed
  slightly inward give the shell a little volume so the splat reads as a body of
  water, not a wireframe.
*/
import * as THREE from "three/webgpu";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export function sampleGlyphHomes(mesh: THREE.Mesh, count: number): Float32Array {
  const sampler = new MeshSurfaceSampler(mesh).build();
  const homes = new Float32Array(count * 3);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(p, n);
    const inset = Math.random() * 0.12; // push inward for fake volume
    homes[i * 3] = p.x - n.x * inset;
    homes[i * 3 + 1] = p.y - n.y * inset;
    homes[i * 3 + 2] = p.z - n.z * inset;
  }
  return homes;
}
