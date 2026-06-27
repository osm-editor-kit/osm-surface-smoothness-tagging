// Public contract for the surface/smoothness field. Kept host-agnostic: the iD
// wrapper and the demo app both call createSurfaceSmoothnessField the same way.

export interface SurfaceSmoothnessFieldDefinition {
  /** OSM tag key for the surface value (default "surface"). */
  surfaceKey?: string
  /** OSM tag key for the smoothness value (default "smoothness"). */
  smoothnessKey?: string
  safeid?: string
}

export interface SurfaceSmoothnessContext {
  /** Map a catalogue asset path ("images/x.jpg") to a URL the browser can load. */
  assetUrl?: (path: string) => string
}

export interface SurfaceSmoothnessAdapters {
  /** Translate a label key; falls back to the built-in English string. */
  t?: (key: string, fallback: string) => string
}

export type FieldTags = Record<string, string | string[] | undefined>

/** Patch emitted on the "change" event: keys to set, `undefined` to clear. */
export type TagPatch = Record<string, string | undefined>

export interface SurfaceSmoothnessInstance {
  (selection: unknown): void
  tags: (tags: FieldTags) => SurfaceSmoothnessInstance
  entityIDs: (ids: string[]) => SurfaceSmoothnessInstance
  focus: () => SurfaceSmoothnessInstance
  on: (type: string, listener?: (...args: unknown[]) => void) => SurfaceSmoothnessInstance
}
