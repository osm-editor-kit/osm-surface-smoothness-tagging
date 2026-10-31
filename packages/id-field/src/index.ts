// Package entry. Vite bundles it into dist/index.js (d3 and the catalogue included, so a host can
// lazy-import one file); tsc emits dist/index.d.ts from it.

export { createSurfaceSmoothnessField } from './createSurfaceSmoothnessField.impl.js'
export {
  COMMON_SURFACES,
  isSmoothnessValidForSurface,
  orderedSurfaces,
  photoCredit,
  resolveKeys,
  smoothnessChangePatch,
  smoothnessChoices,
  smoothnessValuesForSurface,
  surfaceChangePatch,
} from './logic.js'
export type { FieldKeys, SmoothnessChoice } from './logic.js'
export type {
  FieldTags,
  SurfaceSmoothnessAdapters,
  SurfaceSmoothnessContext,
  SurfaceSmoothnessFieldDefinition,
  SurfaceSmoothnessInstance,
  TagPatch,
  TooltipInfo,
} from './types.js'
