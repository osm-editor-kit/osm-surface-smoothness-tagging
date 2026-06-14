// extract-from-streetcomplete.ts — Phase 2 (see ../WORK_PLAN.md)
//
// Parses the StreetComplete Kotlin sources + Android resources into the canonical
// surface/smoothness catalogue, and copies the referenced reference photos (JPEG)
// and vehicle icons (SVG) into packages/data/src/generated/.
//
// Re-runnable: reads a local StreetComplete clone (STREETCOMPLETE_PATH, default
// /Users/tordans/Development/OSM/StreetComplete). Output is deterministic (no
// timestamps) so committed diffs reflect real data changes only.

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SC = process.env.STREETCOMPLETE_PATH ?? '/Users/tordans/Development/OSM/StreetComplete'

const ROOT = join(import.meta.dirname, '..')
const GEN = join(ROOT, 'packages/data/src/generated')
const IMAGES_OUT = join(GEN, 'images')
const ICONS_OUT = join(GEN, 'icons')

const F = {
  smoothness: `${SC}/app/src/commonMain/kotlin/de/westnordost/streetcomplete/quests/smoothness/Smoothness.kt`,
  smoothnessItem: `${SC}/app/src/commonMain/kotlin/de/westnordost/streetcomplete/quests/smoothness/SmoothnessItem.kt`,
  surface: `${SC}/app/src/commonMain/kotlin/de/westnordost/streetcomplete/osm/surface/Surface.kt`,
  surfaceItem: `${SC}/app/src/commonMain/kotlin/de/westnordost/streetcomplete/osm/surface/SurfaceItem.kt`,
  addRoadSmoothness: `${SC}/app/src/androidMain/kotlin/de/westnordost/streetcomplete/quests/smoothness/AddRoadSmoothness.kt`,
  strings: `${SC}/app/src/commonMain/composeResources/values/strings.xml`,
  authors: `${SC}/app/src/commonMain/composeResources/files/authors.txt`,
  drawableXhdpi: `${SC}/app/src/commonMain/composeResources/drawable-xhdpi`,
  vehicleSvgs: `${SC}/res/graphics/smoothness`,
}

function read(path: string): string {
  if (!existsSync(path)) {
    console.error(`Missing StreetComplete source: ${path}`)
    console.error('Set STREETCOMPLETE_PATH to a StreetComplete clone.')
    process.exit(1)
  }
  return readFileSync(path, 'utf8')
}

// --- Kotlin helpers -------------------------------------------------------

/** Inner text of the `when (...) { ... }` block that follows `anchor`. */
function whenBlock(src: string, anchor: RegExp): string {
  const m = anchor.exec(src)
  if (!m) throw new Error(`when-block anchor not found: ${anchor}`)
  let i = src.indexOf('{', m.index + m[0].length - 1)
  const start = i + 1
  let depth = 1
  for (i = start; i < src.length && depth > 0; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') depth--
  }
  return src.slice(start, i - 1)
}

/** Arms keyed by enum constant(s): `NAME -> rhs` or `A, B -> rhs`. */
function enumArms(block: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const line of block.split('\n')) {
    const m = /^\s*([A-Z][A-Z_]*(?:\s*,\s*[A-Z][A-Z_]*)*)\s*->\s*(.+?)\s*$/.exec(line)
    if (!m) continue
    for (const name of m[1].split(',').map((s) => s.trim())) out.set(name, m[2])
  }
  return out
}

/** Arms keyed by quoted surface string(s): `"a", "b" -> rhs`, ignoring `else`. */
function surfaceArms(block: string): { surfaces: string[]; rhs: string }[] {
  const out: { surfaces: string[]; rhs: string }[] = []
  for (const line of block.split('\n')) {
    const m = /^\s*(.+?)\s*->\s*(.+?)\s*$/.exec(line)
    if (!m || m[1].trim() === 'else') continue
    const surfaces = [...m[1].matchAll(/"([^"]+)"/g)].map((q) => q[1])
    if (surfaces.length) out.push({ surfaces, rhs: m[2] })
  }
  return out
}

const drawableOf = (rhs: string) => /Res\.drawable\.([a-z0-9_]+)/.exec(rhs)?.[1] ?? null
const stringKeyOf = (rhs: string) => /Res\.string\.([a-z0-9_]+)/.exec(rhs)?.[1] ?? null
const emojiOf = (rhs: string) => /^"(.+)"$/.exec(rhs)?.[1] ?? null
const identOf = (rhs: string) => /^([a-zA-Z_][a-zA-Z0-9_]*)$/.exec(rhs)?.[1] ?? null

// --- Parse sources --------------------------------------------------------

const smoothnessSrc = read(F.smoothness)
const itemSrc = read(F.smoothnessItem)
const surfaceSrc = read(F.surface)
const surfaceItemSrc = read(F.surfaceItem)
const addRoadSrc = read(F.addRoadSmoothness)
const stringsSrc = read(F.strings)
const authorsSrc = read(F.authors)

// Smoothness enum (ordered)
const smoothnessEnum = [...smoothnessSrc.matchAll(/^\s*([A-Z_]+)\("([^"]+)"\)/gm)].map((m) => ({
  name: m[1],
  osmValue: m[2],
}))

// Smoothness per-level attributes
const iconArms = enumArms(whenBlock(itemSrc, /Smoothness\.icon\b[^{]*when \(this\) \{/))
const emojiArms = enumArms(whenBlock(itemSrc, /Smoothness\.emoji\b[^{]*when \(this\) \{/))
const titleArms = enumArms(whenBlock(itemSrc, /Smoothness\.title\b[^{]*when \(this\) \{/))

// Surface -> image-group fn, and each image-group fn -> { smoothness: drawable }
const getImageArms = surfaceArms(whenBlock(itemSrc, /getImage\([^)]*\)[^{]*when \(surface\) \{/))
const imageGroups = new Map<string, Map<string, string>>()
for (const fn of new Set(getImageArms.map((a) => a.rhs))) {
  imageGroups.set(fn, enumArms(whenBlock(itemSrc, new RegExp(`Smoothness\\.${fn}\\b[^{]*when \\(this\\) \\{`))))
}

// Surface -> description-group fn (+ fallback), and each fn -> { smoothness: stringKey }
const getDescArms = surfaceArms(whenBlock(itemSrc, /getDescription\([^)]*\)[^{]*when \(surface\) \{/))
const descGroups = new Map<string, Map<string, string>>()
for (const fn of new Set(getDescArms.map((a) => a.rhs))) {
  descGroups.set(fn, enumArms(whenBlock(itemSrc, new RegExp(`Smoothness\\.${fn}\\b[^{]*when \\(this\\) \\{`))))
}
const descFallback = enumArms(whenBlock(itemSrc, /descriptionFallback\b[^{]*when \(this\) \{/))

// Surface enum (osmValue may be null for UNSUPPORTED)
const surfaceEnumBody = surfaceSrc.slice(0, surfaceSrc.indexOf('companion object'))
const surfaceEnum = [...surfaceEnumBody.matchAll(/^\s*([A-Z][A-Z_]*)\((?:"([^"]*)"|null)\)/gm)].map((m) => ({
  name: m[1],
  osmValue: m[2] ?? null,
}))

// Surface title + icon
const surfaceTitleArms = enumArms(whenBlock(surfaceItemSrc, /Surface\.title\b[^{]*when \(this\) \{/))
const surfaceIconArms = enumArms(whenBlock(surfaceItemSrc, /Surface\.icon\b[^{]*when \(this\) \{/))

// Aliases: "x" to ENUM
const aliasesBlock = /aliases:[^=]*=\s*mapOf\(([\s\S]*?)\)\s*\n\s*}/.exec(surfaceSrc)?.[1] ?? ''
const surfaceAliases: Record<string, string> = {}
const enumToOsm = new Map(surfaceEnum.map((s) => [s.name, s.osmValue]))
for (const m of aliasesBlock.matchAll(/"([^"]+)"\s*to\s*([A-Z_]+)/g)) {
  const target = enumToOsm.get(m[2])
  if (target) surfaceAliases[m[1]] = target
}

// SURFACES_FOR_SMOOTHNESS
const sfsBlock = /SURFACES_FOR_SMOOTHNESS\s*=\s*listOf\(([\s\S]*?)\)/.exec(addRoadSrc)?.[1] ?? ''
const surfacesForSmoothnessQuest = [...sfsBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1])

// strings.xml -> needed English text
const strings = new Map<string, string>()
for (const m of stringsSrc.matchAll(/<string name="([^"]+)">([\s\S]*?)<\/string>/g)) {
  if (/^(quest_smoothness_(title|description)_|quest_surface_value_|unknown_surface_title)/.test(m[1])) {
    strings.set(
      m[1],
      m[2]
        .replace(/\\'/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim(),
    )
  }
}
const text = (key: string | null): string | null => (key ? strings.get(key) ?? null : null)

// authors.txt -> attribution lookup (filenames are truncated with "..." in SC)
type AttrEntry = { value: string; prefix: boolean; license: string; source: string }
const attrEntries: AttrEntry[] = []
for (const raw of authorsSrc.split('\n')) {
  // The filename column is fixed-width; long names are truncated with "..." and
  // may be followed by only a single space. So take the filename as the first
  // whitespace-delimited token, then split the remainder (license / source) on 2+ spaces.
  const line = raw.trimEnd()
  const firstSpace = line.search(/\s/)
  if (firstSpace <= 0) continue
  const name = line.slice(0, firstSpace)
  const [license, source = ''] = line.slice(firstSpace).trim().split(/\s{2,}/).map((s) => s.trim())
  if (!license) continue
  if (/^(files|drawable|License|=)/.test(name)) continue
  if (!/\.(jpg|jpeg|png)$/i.test(name) && !name.endsWith('...')) continue
  if (name.endsWith('...')) attrEntries.push({ value: name.slice(0, -3), prefix: true, license, source })
  else attrEntries.push({ value: name, prefix: false, license, source })
}
function attributionFor(file: string): { license: string; source: string } | null {
  const exact = attrEntries.find((e) => !e.prefix && e.value === file)
  if (exact) return { license: exact.license, source: exact.source }
  const pre = attrEntries.find((e) => e.prefix && file.startsWith(e.value))
  return pre ? { license: pre.license, source: pre.source } : null
}

// --- Copy assets + build catalogue ---------------------------------------

rmSync(GEN, { recursive: true, force: true })
mkdirSync(IMAGES_OUT, { recursive: true })
mkdirSync(ICONS_OUT, { recursive: true })

const copiedImages = new Set<string>()
const copiedIcons = new Set<string>()
const missingImages: string[] = []
const missingAttribution: string[] = []

/** Copy a surface_*.jpg drawable; returns catalogue path ("images/x.jpg") or null. */
function image(drawable: string | null): string | null {
  if (!drawable) return null
  const file = `${drawable}.jpg`
  const srcFile = join(F.drawableXhdpi, file)
  if (!existsSync(srcFile)) {
    missingImages.push(file)
    return null
  }
  if (!copiedImages.has(file)) {
    copyFileSync(srcFile, join(IMAGES_OUT, file))
    copiedImages.add(file)
  }
  return `images/${file}`
}

/** Copy a smoothness_*.svg vehicle icon; returns catalogue path ("icons/x.svg"). */
function vehicleIcon(drawable: string | null): string | null {
  if (!drawable) return null
  const short = drawable.replace(/^smoothness_/, '')
  const file = `${short}.svg`
  const srcFile = join(F.vehicleSvgs, file)
  if (!existsSync(srcFile)) {
    missingImages.push(file)
    return null
  }
  if (!copiedIcons.has(file)) {
    copyFileSync(srcFile, join(ICONS_OUT, file))
    copiedIcons.add(file)
  }
  return `icons/${file}`
}

// smoothnessLevels
const smoothnessLevels: Record<string, unknown> = {}
for (const { name, osmValue } of smoothnessEnum) {
  smoothnessLevels[osmValue] = {
    osmValue,
    title: text(stringKeyOf(titleArms.get(name) ?? '')),
    emoji: emojiOf(emojiArms.get(name) ?? ''),
    vehicleIcon: vehicleIcon(drawableOf(iconArms.get(name) ?? '')),
  }
}

// surfaces
const surfaces: Record<string, unknown> = {}
for (const { name, osmValue } of surfaceEnum) {
  if (!osmValue) continue
  surfaces[osmValue] = {
    osmValue,
    title: text(stringKeyOf(surfaceTitleArms.get(name) ?? '')),
    icon: image(drawableOf(surfaceIconArms.get(name) ?? '')),
    smoothnessQuest: surfacesForSmoothnessQuest.includes(osmValue),
  }
}

// smoothnessMatrix (only cells with a non-null photo)
const surfaceToImageFn = new Map<string, string>()
for (const a of getImageArms) for (const s of a.surfaces) surfaceToImageFn.set(s, a.rhs)
const surfaceToDescFn = new Map<string, string>()
for (const a of getDescArms) for (const s of a.surfaces) surfaceToDescFn.set(s, a.rhs)

const smoothnessMatrix: Record<string, Record<string, unknown>> = {}
for (const [surface, imageFn] of surfaceToImageFn) {
  const imgArms = imageGroups.get(imageFn)!
  const descFn = surfaceToDescFn.get(surface)
  const dArms = descFn ? descGroups.get(descFn)! : new Map<string, string>()
  const cells: Record<string, unknown> = {}
  for (const { name, osmValue } of smoothnessEnum) {
    const photo = image(drawableOf(imgArms.get(name) ?? ''))
    if (!photo) continue
    const descKey = stringKeyOf(dArms.get(name) ?? '') ?? stringKeyOf(descFallback.get(name) ?? '')
    cells[osmValue] = { photo, description: text(descKey) }
  }
  smoothnessMatrix[surface] = cells
}

// attribution (deterministic, sorted by file)
const attribution: { file: string; license: string; source: string }[] = []
for (const file of [...copiedImages].sort()) {
  const a = attributionFor(file)
  if (a) attribution.push({ file: `images/${file}`, ...a })
  else {
    attribution.push({ file: `images/${file}`, license: 'UNKNOWN', source: '' })
    missingAttribution.push(file)
  }
}
for (const file of [...copiedIcons].sort()) {
  attribution.push({
    file: `icons/${file}`,
    license: 'GPL-3.0-or-later',
    source: 'StreetComplete (res/graphics/smoothness)',
  })
}

const catalogue = {
  version: '0.0.0',
  meta: {
    source: 'StreetComplete',
    generatedBy: 'scripts/extract-from-streetcomplete.ts',
    counts: {
      surfaces: Object.keys(surfaces).length,
      smoothnessLevels: Object.keys(smoothnessLevels).length,
      matrixSurfaces: Object.keys(smoothnessMatrix).length,
      matrixCells: Object.values(smoothnessMatrix).reduce((n, c) => n + Object.keys(c).length, 0),
      images: copiedImages.size,
      icons: copiedIcons.size,
    },
  },
  smoothnessLevels,
  surfaces,
  surfaceAliases,
  surfacesForSmoothnessQuest,
  smoothnessMatrix,
  attribution,
}

const json = JSON.stringify(catalogue, null, 2)
// catalogue.json: inspectable artifact + non-JS consumers (mobile/gomap, debugging).
writeFileSync(join(GEN, 'catalogue.json'), json + '\n')
// catalogue.ts: typed runtime module (type-checked against the Catalogue schema on build).
writeFileSync(
  join(GEN, 'catalogue.ts'),
  '// AUTO-GENERATED by scripts/extract-from-streetcomplete.ts — do not edit.\n' +
    "import type { Catalogue } from '../types.js'\n\n" +
    `export const catalogue: Catalogue = ${json}\n`,
)

// --- Report (no silent drops) --------------------------------------------

console.log('Extracted catalogue → packages/data/src/generated/')
console.log(JSON.stringify(catalogue.meta.counts, null, 2))
if (missingImages.length) {
  console.warn(`\n⚠ ${missingImages.length} referenced asset(s) not found:`)
  for (const f of missingImages) console.warn(`  - ${f}`)
}
if (missingAttribution.length) {
  console.warn(`\n⚠ ${missingAttribution.length} image(s) without attribution:`)
  for (const f of missingAttribution) console.warn(`  - ${f}`)
}
