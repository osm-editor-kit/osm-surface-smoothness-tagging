import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { catalogue, getSmoothnessOptionsForSurface, normalizeSurface } from './index.js'

const genDir = join(dirname(fileURLToPath(import.meta.url)), 'generated')

function allImagePaths(): Set<string> {
  const out = new Set<string>()
  for (const s of Object.values(catalogue.surfaces)) if (s.icon) out.add(s.icon)
  for (const cells of Object.values(catalogue.smoothnessMatrix))
    for (const cell of Object.values(cells)) out.add(cell.photo)
  return out
}

describe('catalogue', () => {
  it('matrix keys equal the quest surfaces', () => {
    expect(Object.keys(catalogue.smoothnessMatrix).sort()).toEqual(
      [...catalogue.surfacesForSmoothnessQuest].sort(),
    )
  })

  // Snapshot of the StreetComplete matrix shape — guards against silent breakage
  // when the SC Kotlin is refactored (Risk #1).
  it('matches the StreetComplete snapshot sizes', () => {
    const cells = Object.values(catalogue.smoothnessMatrix).reduce(
      (n, c) => n + Object.keys(c).length,
      0,
    )
    expect(cells).toBe(43)
    expect(Object.keys(catalogue.surfaces).length).toBe(26)
    expect(Object.keys(catalogue.smoothnessLevels).length).toBe(8)
  })

  it('has every referenced asset on disk', () => {
    const refs = new Set<string>(allImagePaths())
    for (const l of Object.values(catalogue.smoothnessLevels))
      if (l.vehicleIcon) refs.add(l.vehicleIcon)
    const missing = [...refs].filter((r) => !existsSync(join(genDir, r)))
    expect(missing).toEqual([])
  })

  it('has attribution for every image (Risk #2)', () => {
    const attributed = new Set(catalogue.attribution.map((a) => a.file))
    const missing = [...allImagePaths()].filter((p) => !attributed.has(p))
    expect(missing).toEqual([])
    expect(catalogue.attribution.every((a) => a.license && a.license !== 'UNKNOWN')).toBe(true)
  })

  it('filters smoothness options by surface, in order', () => {
    expect(getSmoothnessOptionsForSurface('sett').map((o) => o.smoothness)).toEqual([
      'good',
      'intermediate',
      'bad',
      'very_bad',
    ])
    expect(getSmoothnessOptionsForSurface('asphalt')[0]?.smoothness).toBe('excellent')
    expect(getSmoothnessOptionsForSurface('grass')).toEqual([])
  })

  it('resolves aliases to canonical surfaces', () => {
    expect(normalizeSurface('concrete:plates')).toBe('concrete')
    expect(normalizeSurface('earth')).toBe('dirt')
    expect(normalizeSurface('asphalt')).toBe('asphalt')
  })

  it('joins each option to its smoothness level metadata', () => {
    const first = getSmoothnessOptionsForSurface('asphalt')[0]
    expect(first?.level?.emoji).toBe('🛹')
    expect(first?.cell.photo).toContain('surface_asphalt_excellent')
  })
})
