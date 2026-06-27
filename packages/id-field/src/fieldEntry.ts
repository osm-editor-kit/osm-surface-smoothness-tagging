// ESM entry — what Vite bundles into dist/surface-smoothness-field.esm.js and what
// the iD wrapper lazy-imports.

export { createSurfaceSmoothnessField } from './createSurfaceSmoothnessField.impl.js'
export {
  isSmoothnessValidForSurface,
  resolveKeys,
  smoothnessChangePatch,
  smoothnessValuesForSurface,
  surfaceChangePatch,
} from './logic.js'
export type {
  FieldTags,
  SurfaceSmoothnessAdapters,
  SurfaceSmoothnessContext,
  SurfaceSmoothnessFieldDefinition,
  SurfaceSmoothnessInstance,
  TagPatch,
} from './types.js'
