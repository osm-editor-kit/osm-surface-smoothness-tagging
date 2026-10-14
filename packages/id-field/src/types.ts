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

/** What a tooltip is about: one value of one key, on a tile or in a picker. */
export interface TooltipInfo {
  key: 'surface' | 'smoothness'
  value: string
  /** The tag, e.g. "surface=asphalt". */
  tag: string
  /** The value's full label (the visible one may be cut off). */
  label: string
  /** What the photo shows or what the value means, when known. */
  description: string | undefined
  /** Source and license of the photo, when there is one. */
  credit: string | undefined
}

export interface SurfaceSmoothnessAdapters {
  /**
   * Translate a UI string; falls back to the built-in English one. Keys: `surface`,
   * `smoothness`, `surface_placeholder`, `smoothness_placeholder`, `multiple_values`, `photo`.
   */
  t?: (key: string, fallback: string) => string
  /**
   * Label of a tag value, e.g. from the host's translated tagging schema. Return undefined
   * to use the catalogue's English title.
   */
  optionLabel?: (key: 'surface' | 'smoothness', value: string) => string | undefined
  /**
   * Description of a tag value for its tooltip, e.g. a translated one. `surface` is the surface
   * a smoothness is shown for. Return undefined to use the catalogue's English description.
   */
  optionDescription?: (
    key: 'surface' | 'smoothness',
    value: string,
    surface?: string,
  ) => string | undefined
  /**
   * The whole tooltip text of a tile or card. Return a string to replace the built-in one
   * (label, tag, description, photo credit, one per line), `null` for no tooltip, or undefined
   * to keep the built-in one.
   */
  tooltip?: (info: TooltipInfo) => string | null | undefined
  /**
   * More values for the dropdowns, e.g. the host's tagging schema options. They follow the
   * catalogue's values; any typed value is accepted as well.
   */
  options?: (key: 'surface' | 'smoothness') => string[] | undefined
  /**
   * The host's own input for the row below the photos (e.g. iD's combo field with its translated
   * dropdown). Called on every render with the row's input cell and the current value; call
   * `choose` with a new value. Without it, the field draws its own simple dropdown.
   */
  renderInput?: (
    cell: HTMLElement,
    key: 'surface' | 'smoothness',
    value: string | string[] | undefined,
    choose: (value: string | undefined) => void,
  ) => void
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
