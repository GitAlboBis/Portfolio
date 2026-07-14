// 288 bytes: the original 272 + one trailing vec2f (waterline, refl_strength)
// for the sea-reflection pass. Shaders that declare the SHORTER RenderUniforms
// struct still bind fine (same prefix layout, buffer merely larger).
export const renderUniformsValues = new ArrayBuffer(288);
export const renderUniformsViews = {
  texel_size: new Float32Array(renderUniformsValues, 0, 2),
  sphere_size: new Float32Array(renderUniformsValues, 8, 1),
  // packed into the std140 padding hole between sphere_size (offset 8) and the
  // first mat4 (offset 16) — no layout shift for any other shader.
  time: new Float32Array(renderUniformsValues, 12, 1),
  inv_projection_matrix: new Float32Array(renderUniformsValues, 16, 16),
  projection_matrix: new Float32Array(renderUniformsValues, 80, 16),
  view_matrix: new Float32Array(renderUniformsValues, 144, 16),
  inv_view_matrix: new Float32Array(renderUniformsValues, 208, 16),
  /** screen-space y (backing px) of the sea horizon in the video backdrop */
  waterline: new Float32Array(renderUniformsValues, 272, 1),
  /** 0..1 strength of the letter's reflection on the sea (0 disables) */
  refl_strength: new Float32Array(renderUniformsValues, 276, 1),
};

export const numParticlesMax = 200000;
