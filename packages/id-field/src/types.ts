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
  /**
   * Label of a tag value, e.g. from the host's translated tagging schema. Return undefined
   * to use the catalogue's English title.
   */
  optionLabel?: (key: 'surface' | 'smoothness', value: string) => string | undefined
}

/** `images`: photo grid first (default). `text`: plain inputs, for values without a photo. */
export type SurfaceSmoothnessMode = 'images' | 'text'

export type FieldTags = Record<string, string | string[] | undefined>

/** Patch emitted on the "change" event: keys to set, `undefined` to clear. */
export type TagPatch = Record<string, string | undefined>

export interface SurfaceSmoothnessInstance {
  (selection: unknown): void
  tags: (tags: FieldTags) => SurfaceSmoothnessInstance
  entityIDs: (ids: string[]) => SurfaceSmoothnessInstance
  focus: () => SurfaceSmoothnessInstance
  mode: {
    (): SurfaceSmoothnessMode
    (mode: SurfaceSmoothnessMode): SurfaceSmoothnessInstance
  }
  on: (type: string, listener?: (...args: unknown[]) => void) => SurfaceSmoothnessInstance
}
