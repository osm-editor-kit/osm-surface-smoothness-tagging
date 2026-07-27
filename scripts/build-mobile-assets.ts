// build-mobile-assets.ts — Phase 3 (see ../WORK_PLAN.md)
//
// Generates platform asset trees under mobile/ from @osm-editor-kit/surface-smoothness-data:
//   mobile/streetcomplete/ — multi-density JPEGs + VectorDrawable XML + manifest.json
//   mobile/gomap/          — .xcassets imagesets + catalogue.json + README
//
// Reference photos: xhdpi comes from the data package (our source of truth). The
// other Android densities (mdpi/hdpi/xxhdpi) and the VectorDrawable XML are copied
// from a StreetComplete clone (STREETCOMPLETE_PATH) when available — SC ships real
// per-density files, so copying them beats upscaling the xhdpi master (Risk #3).
//
// mobile/ is a regenerable build artifact (gitignored). Run: bun run build:mobile

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { catalogue } from '@osm-editor-kit/surface-smoothness-data'

const ROOT = join(import.meta.dirname, '..')
const DATA = join(ROOT, 'packages/data/dist/generated')
const OUT = join(ROOT, 'mobile')
const SC = process.env.STREETCOMPLETE_PATH ?? '/Users/tordans/Development/OSM/StreetComplete'
const SC_RES = `${SC}/app/src/commonMain/composeResources`

const DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi'] as const

const name = (p: string) => basename(p) // "images/surface_asphalt.jpg" -> "surface_asphalt.jpg"
const stem = (p: string) => basename(p).replace(/\.[^.]+$/, '') // -> "surface_asphalt"

const skipped: string[] = []
const counts = { densities: {} as Record<string, number>, vectorXml: 0, imagesets: 0 }

// --- collect referenced assets -------------------------------------------

const photoFiles = new Set<string>()
for (const s of Object.values(catalogue.surfaces)) if (s.icon) photoFiles.add(name(s.icon))
for (const cells of Object.values(catalogue.smoothnessMatrix))
  for (const cell of Object.values(cells)) photoFiles.add(name(cell.photo))

const iconFiles = new Set<string>()
for (const l of Object.values(catalogue.smoothnessLevels)) if (l.vehicleIcon) iconFiles.add(name(l.vehicleIcon))

rmSync(OUT, { recursive: true, force: true })

// --- mobile/streetcomplete -----------------------------------------------

const scOut = join(OUT, 'streetcomplete/composeResources')
for (const density of DENSITIES) {
  const dir = join(scOut, `drawable-${density}`)
  mkdirSync(dir, { recursive: true })
  let n = 0
  for (const file of photoFiles) {
    // xhdpi master lives in the data package; other densities come from the SC clone.
    const srcFile = density === 'xhdpi'
      ? join(DATA, 'images', file)
      : join(SC_RES, `drawable-${density}`, file)
    if (!existsSync(srcFile)) {
      skipped.push(`streetcomplete/drawable-${density}/${file}`)
      continue
    }
    copyFileSync(srcFile, join(dir, file))
    n++
  }
  counts.densities[density] = n
}

// VectorDrawable vehicle icons (golden reference from SC, if available)
const vectorDir = join(scOut, 'drawable')
mkdirSync(vectorDir, { recursive: true })
for (const icon of iconFiles) {
  const xml = `smoothness_${stem(icon)}.xml`
  const srcFile = join(SC_RES, 'drawable', xml)
  if (!existsSync(srcFile)) {
    skipped.push(`streetcomplete/drawable/${xml}`)
    continue
  }
  copyFileSync(srcFile, join(vectorDir, xml))
  counts.vectorXml++
}

// manifest.json: drawable name -> OSM value(s)
const manifest = {
  source: 'StreetComplete',
  generatedBy: 'scripts/build-mobile-assets.ts',
  surfaces: Object.fromEntries(
    Object.values(catalogue.surfaces)
      .filter((s) => s.icon)
      .map((s) => [stem(s.icon!), s.osmValue]),
  ),
  smoothnessIcons: Object.fromEntries(
    Object.values(catalogue.smoothnessLevels)
      .filter((l) => l.vehicleIcon)
      .map((l) => [`smoothness_${stem(l.vehicleIcon!)}`, l.osmValue]),
  ),
  matrix: Object.fromEntries(
    Object.entries(catalogue.smoothnessMatrix).map(([surface, cells]) => [
      surface,
      Object.fromEntries(Object.entries(cells).map(([sm, cell]) => [sm, stem(cell.photo)])),
    ]),
  ),
}
writeFileSync(join(OUT, 'streetcomplete/manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

// --- mobile/gomap --------------------------------------------------------

const xcassets = join(OUT, 'gomap/SurfaceSmoothnessImages.xcassets')
mkdirSync(xcassets, { recursive: true })
writeFileSync(
  join(xcassets, 'Contents.json'),
  JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2) + '\n',
)

function imageset(file: string, srcDir: string, vector: boolean) {
  const srcFile = join(srcDir, file)
  if (!existsSync(srcFile)) {
    skipped.push(`gomap/${file}`)
    return
  }
  const dir = join(xcassets, `${stem(file)}.imageset`)
  mkdirSync(dir, { recursive: true })
  copyFileSync(srcFile, join(dir, file))
  const contents: Record<string, unknown> = {
    images: [{ filename: file, idiom: 'universal' }],
    info: { author: 'xcode', version: 1 },
  }
  if (vector) contents.properties = { 'preserves-vector-representation': true }
  writeFileSync(join(dir, 'Contents.json'), JSON.stringify(contents, null, 2) + '\n')
  counts.imagesets++
}

for (const file of photoFiles) imageset(file, join(DATA, 'images'), false)
for (const file of iconFiles) imageset(file, join(DATA, 'icons'), true)

copyFileSync(join(DATA, 'catalogue.json'), join(OUT, 'gomap/catalogue.json'))
writeFileSync(
  join(OUT, 'gomap/README.md'),
  `# GoMap surface/smoothness assets

Generated by \`bun run build:mobile\` from \`@osm-editor-kit/surface-smoothness-data\`.

- \`SurfaceSmoothnessImages.xcassets/\` — one imageset per reference photo (JPEG) and
  per vehicle icon (SVG, vector-preserving). Imageset names match the catalogue's
  asset stems (e.g. \`surface_asphalt_excellent\`, \`skateboard\`).
- \`catalogue.json\` — the full surface→smoothness→photo matrix + attribution. Image
  references map to xcasset imageset names (strip the \`images/\`/\`icons/\` prefix and
  the file extension).

GoMap today only vendors quest marker icons from StreetComplete (updateIcons.sh) and
has no UI for smoothness answer photos, so this tree is preparatory: wiring it into
GoMap is separate, upstream work.

Attribution in \`catalogue.json\` must be preserved in any UI that shows these photos.
`,
)

// --- top-level README + summary ------------------------------------------

writeFileSync(
  join(OUT, 'README.md'),
  `# mobile/ — generated platform asset bundles

Regenerable build artifact (not committed). Run \`bun run build:mobile\` to (re)create.

- \`streetcomplete/\` — \`composeResources/drawable-*/\` JPEGs, \`drawable/\` VectorDrawable
  XML, and \`manifest.json\` (drawable name → OSM value). For a future StreetComplete PR.
- \`gomap/\` — \`.xcassets\` imagesets + \`catalogue.json\` + integration README. For a future GoMap PR.
`,
)

console.log('Generated mobile/ asset bundles:')
console.log(JSON.stringify(counts, null, 2))
if (skipped.length) {
  console.warn(`\n⚠ ${skipped.length} asset(s) skipped (StreetComplete clone not found at ${SC}?):`)
  const head = skipped.slice(0, 8)
  for (const s of head) console.warn(`  - ${s}`)
  if (skipped.length > head.length) console.warn(`  … and ${skipped.length - head.length} more`)
}
