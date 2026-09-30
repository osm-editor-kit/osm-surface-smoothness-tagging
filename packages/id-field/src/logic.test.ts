import { describe, expect, it } from 'vitest'
import {
  COMMON_SURFACES,
  isSmoothnessValidForSurface,
  orderedSurfaces,
  photoCredit,
  smoothnessChoices,
  smoothnessChangePatch,
  smoothnessValuesForSurface,
  surfaceChangePatch,
} from './logic.js'

describe('logic', () => {
  it('lists the smoothness values offered for a surface', () => {
    expect(smoothnessValuesForSurface('sett')).toEqual(['good', 'intermediate', 'bad', 'very_bad'])
    expect(smoothnessValuesForSurface('grass')).toEqual([])
    expect(smoothnessValuesForSurface(undefined)).toEqual([])
  })

  it('validates a smoothness against a surface', () => {
    expect(isSmoothnessValidForSurface('asphalt', 'excellent')).toBe(true)
    expect(isSmoothnessValidForSurface('sett', 'excellent')).toBe(false) // sett has no excellent
    expect(isSmoothnessValidForSurface('asphalt', undefined)).toBe(true)
  })

  it('clears smoothness when the new surface no longer offers it', () => {
    expect(surfaceChangePatch('excellent', 'sett')).toEqual({
      surface: 'sett',
      smoothness: undefined,
    })
  })

  it('keeps smoothness when it is still valid for the new surface', () => {
    expect(surfaceChangePatch('good', 'sett')).toEqual({ surface: 'sett' })
  })

  it('resolves aliases when validating (concrete:plates → concrete)', () => {
    expect(isSmoothnessValidForSurface('concrete:plates', 'excellent')).toBe(true)
  })

  it('clears the surface tag when set empty', () => {
    expect(surfaceChangePatch(undefined, undefined)).toEqual({ surface: undefined })
  })

  it('honours custom tag keys', () => {
    expect(smoothnessChangePatch('bad', { surfaceKey: 's', smoothnessKey: 'sm' })).toEqual({
      sm: 'bad',
    })
  })

  it('orders the common surfaces first, then the rest', () => {
    const ordered = orderedSurfaces()
    expect(ordered.slice(0, COMMON_SURFACES.length)).toEqual(COMMON_SURFACES)
    expect(new Set(ordered).size).toBe(ordered.length)
    expect(ordered).toContain('grass')
  })

  it('offers smoothness photos for a surface, or every level without photos', () => {
    const sett = smoothnessChoices('sett')
    expect(sett.map((c) => c.smoothness)).toEqual(['good', 'intermediate', 'bad', 'very_bad'])
    expect(sett.every((c) => c.cell?.photo)).toBe(true)
    const grass = smoothnessChoices('grass')
    expect(grass).toHaveLength(8)
    expect(grass.every((c) => !c.cell)).toBe(true)
    expect(grass[0]?.level?.emoji).toBeTruthy()
  })

  it('credits a photo', () => {
    expect(photoCredit('images/surface_acrylic.jpg')).toContain('CC-BY-SA')
    expect(photoCredit(undefined)).toBeUndefined()
  })
})
