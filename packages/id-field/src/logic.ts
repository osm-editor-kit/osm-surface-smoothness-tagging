// Pure tag logic — no DOM, unit-tested independently of the D3 widget.

import { getSmoothnessOptionsForSurface } from '@osm-surface-smoothness/data'
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

export function smoothnessValuesForSurface(surface: string | undefined): string[] {
  if (!surface) return []
  return getSmoothnessOptionsForSurface(surface).map((o) => o.smoothness)
}

export function isSmoothnessValidForSurface(
  surface: string | undefined,
  smoothness: string | undefined,
): boolean {
  if (!smoothness) return true
  return smoothnessValuesForSurface(surface).includes(smoothness)
}

/** Setting the surface: write it, and clear smoothness if it is no longer offered. */
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
