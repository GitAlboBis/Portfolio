import { create } from "zustand";

/*
  Whether the pointer is over the hero mark. Set by the hero drag-capture layer,
  gates the GPGPU mouse repulsion (docs/04-3D-HERO-WATER-LOGO.md).
*/
type HeroDragState = {
  hovering: boolean;
  setHovering: (h: boolean) => void;
};

export const useHeroDragStore = create<HeroDragState>((set) => ({
  hovering: false,
  setHovering: (hovering) => set({ hovering }),
}));
