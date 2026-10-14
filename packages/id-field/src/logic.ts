// Pure tag logic — no DOM, unit-tested independently of the D3 widget.

import {
  catalogue,
  getSmoothnessOptionsForSurface,
  type MatrixCell,
  type SmoothnessLevel,
} from '@osm-editor-kit/surface-smoothness-data'
import type { SurfaceSmoothnessFieldDefinition, TagPatch } from './types.js'

export interface FieldKeys {
  surfaceKey: string
  smoothnessKey: string
}

export const DEFAULT_KEYS: FieldKeys = { surfaceKey: 'surface', smoothnessKey: 'smoothness' }

export function resolveKeys(field: SurfaceSmoothnessFieldDefinition = {}): FieldKeys {
  return {
    surfaceKey: field.surfaceKey ?? DEFAULT_KEYS.surfaceKey,
    smoothnessKey: field.smoothnessKey ?? DEFAULT_KEYS.smoothnessKey,
  }
}

/**
 * Smoothness values with a reference photo for this surface; `[]` when there are none. What
 * the picker offers (every level for a surface without photos) is `smoothnessChoices`.
 */
export function smoothnessValuesForSurface(surface: string | undefined): string[] {
  if (!surface) return []
  return getSmoothnessOptionsForSurface(surface).map((o) => o.smoothness)
}

/**
 * Whether a smoothness may stay on a surface. Only a level the catalogue knows, on a surface
 * with reference photos that do not include it, is not valid (e.g. `excellent` on `sett`).
 * Everything the picker offers is valid, and so is any value the catalogue does not know.
 */
export function isSmoothnessValidForSurface(
  surface: string | undefined,
  smoothness: string | undefined,
): boolean {
  if (!smoothness || !(smoothness in catalogue.smoothnessLevels)) return true
  return smoothnessChoices(surface).some((choice) => choice.smoothness === smoothness)
}

/**
 * Setting the surface: write it, and clear a smoothness the new surface cannot have. Removing
 * the surface, or choosing one without reference photos, keeps the smoothness.
 */
export function surfaceChangePatch(
  currentSmoothness: string | undefined,
  nextSurface: string | undefined,
  keys: FieldKeys = DEFAULT_KEYS,
): TagPatch {
  const patch: TagPatch = { [keys.surfaceKey]: nextSurface || undefined }
  if (!isSmoothnessValidForSurface(nextSurface, currentSmoothness)) {
    patch[keys.smoothnessKey] = undefined
  }
  return patch
}

/** Setting (or clearing) the smoothness value. */
export function smoothnessChangePatch(
  nextSmoothness: string | undefined,
  keys: FieldKeys = DEFAULT_KEYS,
): TagPatch {
  return { [keys.smoothnessKey]: nextSmoothness || undefined }
}

/**
 * Surfaces shown first in the photo grid: the usual ones on roads, cycleways and paths. The
 * others (rare or unspecific, like `paved`, `wood`, `rubber`) follow in the same grid.
 */
export const COMMON_SURFACES = [
  'asphalt',
  'paving_stones',
  'concrete',
  'sett',
  'unhewn_cobblestone',
  'concrete:lanes',
  'compacted',
  'fine_gravel',
  'gravel',
  'grass_paver',
  'ground',
  'dirt',
]

/** All catalogue surfaces: the common ones first, then the rest in catalogue order. */
export function orderedSurfaces(): string[] {
  const all = Object.keys(catalogue.surfaces)
  return [
    ...COMMON_SURFACES.filter((value) => all.includes(value)),
    ...all.filter((value) => !COMMON_SURFACES.includes(value)),
  ]
}

export interface SmoothnessChoice {
  smoothness: string
  level: SmoothnessLevel | undefined
  /** Reference photo for this surface, when StreetComplete has one. */
  cell: MatrixCell | undefined
}

/**
 * Smoothness values to offer for a surface, best to worst: with reference photos where
 * StreetComplete has them for this surface, otherwise every level without a photo.
 */
export function smoothnessChoices(surface: string | undefined): SmoothnessChoice[] {
  const withPhotos = surface ? getSmoothnessOptionsForSurface(surface) : []
  if (withPhotos.length) {
    return withPhotos.map((o) => ({ smoothness: o.smoothness, level: o.level, cell: o.cell }))
  }
  return Object.values(catalogue.smoothnessLevels).map((level) => ({
    smoothness: level.osmValue,
    level,
    cell: undefined,
  }))
}

/** "source (license)" of a catalogue image, for its tooltip. */
export function photoCredit(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  const entry = catalogue.attribution.find((a) => a.file === path)
  return entry ? `${entry.source} (${entry.license})` : undefined
}
