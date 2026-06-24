"use client";

import * as THREE from "three/webgpu";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Fn, texture, screenUV, uniform, vec2 } from "three/tsl";

/*
  Full-view photo background (placeholder for Alberto's hero image/video). Rendered
  inside the R3F scene as a big screen-covering plane, sampled via screenUV with a
  COVER fit (no distortion). Swap the URL to a VideoTexture later for the clip.
*/
const BG_URL = "/images/AdobeStock_1294278468.jpeg";

export function PhotoBackdrop() {
  const tex = useTexture(BG_URL);
  const { size } = useThree();

  const { geometry, material, uScale } = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    const uScale = uniform(new THREE.Vector2(1, 1));
    const m = new THREE.MeshBasicNodeMaterial();
    m.toneMapped = false;
    m.depthTest = false;
    m.depthWrite = false;
    m.colorNode = Fn(() => {
      // screenUV has y-up; flip V so the photo isn't upside down
      const sUV = vec2(screenUV.x, screenUV.y.oneMinus());
      const uv = sUV.sub(0.5).mul(uScale).add(0.5);
      return texture(tex, uv);
    })();
    const geometry = new THREE.PlaneGeometry(80, 45);
    return { geometry, material: m, uScale };
  }, [tex]);

  // cover-fit: scale the sampled UV by the screen-vs-image aspect ratio
  useEffect(() => {
    const img = tex.image as { width?: number; height?: number } | undefined;
    const imgA = (img?.width ?? 3) / (img?.height ?? 2);
    const scrA = size.width / Math.max(1, size.height);
    if (scrA > imgA) uScale.value.set(1, imgA / scrA);
    else uScale.value.set(scrA / imgA, 1);
  }, [tex, size, uScale]);

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
