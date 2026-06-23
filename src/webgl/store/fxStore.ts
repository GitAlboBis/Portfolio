import { create } from "zustand";

export type Tier = "full" | "lite" | "off";
export type HeroRenderMode = "particles-2layer" | "static";

/*
  Global FX / quality state. tier drives particle density + postFX;
  heroRenderMode selects the GPGPU 2-layer sim vs the static analytic fallback;
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
  heroRenderMode: "particles-2layer",
  reducedMotion: false,
  webgpu: false,
  set: (p) => set(p),
}));
