// ESM entry — what Vite bundles into dist/index.js and what
// the iD wrapper lazy-imports.

export { createSurfaceSmoothnessField } from './createSurfaceSmoothnessField.impl.js'
export {
  COMMON_SURFACES,
  isSmoothnessValidForSurface,
  orderedSurfaces,
  photoCredit,
  smoothnessChoices,
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
