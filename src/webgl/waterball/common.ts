export const renderUniformsValues = new ArrayBuffer(272);
export const renderUniformsViews = {
  texel_size: new Float32Array(renderUniformsValues, 0, 2),
  sphere_size: new Float32Array(renderUniformsValues, 8, 1),
  // packed into the std140 padding hole between sphere_size (offset 8) and the
  // first mat4 (offset 16) — the buffer layout/size is unchanged, so every other
  // shader that declares the shorter RenderUniforms struct still matches.
  time: new Float32Array(renderUniformsValues, 12, 1),
  inv_projection_matrix: new Float32Array(renderUniformsValues, 16, 16),
  projection_matrix: new Float32Array(renderUniformsValues, 80, 16),
  view_matrix: new Float32Array(renderUniformsValues, 144, 16),
  inv_view_matrix: new Float32Array(renderUniformsValues, 208, 16),
};

export const numParticlesMax = 200000;
