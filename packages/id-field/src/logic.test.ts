import { describe, expect, it } from 'vitest'
import {
  isSmoothnessValidForSurface,
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
})
