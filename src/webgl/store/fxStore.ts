import { create } from "zustand";

export type Tier = "full" | "lite" | "off";
export type HeroRenderMode = "liquid-mesh" | "particles-2layer" | "static";

/*
  Global FX / quality state. tier drives density + postFX; heroRenderMode is the
  active hero technique ("liquid-mesh" = the WebGPU/TSL transmissive "A");
  webgpu reflects backend capability (docs/04 §6, §10).
*/
type FxState = {
  tier: Tier;
  heroRenderMode: HeroRenderMode;
  reducedMotion: boolean;
  webgpu: boolean;
  set: (
    p: Partial<Pick<FxState, "tier" | "heroRenderMode" | "reducedMotion" | "webgpu">>,
  ) => void;
};

export const useFxStore = create<FxState>((set) => ({
  tier: "full",
  heroRenderMode: "liquid-mesh",
  reducedMotion: false,
  webgpu: false,
  set: (p) => set(p),
}));
