/*
  Shared constants for the screen-space-fluid (SSF) "A" hero.
  See docs/04-3D-HERO-WATER-LOGO.md and the SSF blueprint.
*/

/** Particle count for the fluid sim (compute-driven). */
export const FLUID_COUNT = 42000;

/*
  Camera layers used to render scene subsets in isolation from the SSF render
  manager. The backdrop and the liquid imposters live on separate layers so the
  manager can render each into its own target without object.visible churn.
  Layer 0 (default) is used by the WebGL2/lite fallback (direct-render spheres).
*/
export const BACKDROP_LAYER = 1;
export const LIQUID_LAYER = 2;
