// IIFE entry — exposes the factory as a global for non-module consumers.

import { createSurfaceSmoothnessField } from './createSurfaceSmoothnessField.impl.js'

declare global {
  // eslint-disable-next-line no-var
  var OsmSurfaceSmoothnessField: {
    createSurfaceSmoothnessField: typeof createSurfaceSmoothnessField
  }
}

globalThis.OsmSurfaceSmoothnessField = { createSurfaceSmoothnessField }
