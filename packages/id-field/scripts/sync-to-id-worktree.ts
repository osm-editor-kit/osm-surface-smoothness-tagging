// Copies the built field bundle + the data package's images/icons into the iD
// worktree so iD can serve them at dist/surface-smoothness-field/.
//
// Exported as a function so the dev watcher can re-run it on every rebuild (a
// cached `import()` of a top-level script would only run once). Missing files are
// skipped, so a concurrent ESM/IIFE watch build that hasn't emitted its output yet
// doesn't crash the dev loop — the next rebuild fills it in.
//
// npm publishes only packages/id-field/dist (ESM). The IIFE lives in dist-iife/
// for this sync path and is not part of the published package.

import { existsSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export async function syncToIdWorktree() {
  const idWorktree =
    process.env.ID_WORKTREE ??
    join(import.meta.dirname, '../../../../iD-surface-smoothness-worktree')

  const packageDist = join(import.meta.dirname, '../dist')
  const iifeDist = join(import.meta.dirname, '../dist-iife')
  const dataGen = join(import.meta.dirname, '../../data/dist/generated')
  const targetDir = join(idWorktree, 'dist/surface-smoothness-field')

  await mkdir(targetDir, { recursive: true })

  // iD lazy-imports this fixed asset name (see modules/ui/fields/surface_smoothness.js).
  const esmSrc = join(packageDist, 'index.js')
  if (existsSync(esmSrc)) {
    await cp(esmSrc, join(targetDir, 'surface-smoothness-field.esm.js'), { force: true })
  }

  for (const file of ['surface-smoothness-field.js', 'surface-smoothness-field.js.map']) {
    const src = join(iifeDist, file)
    if (existsSync(src)) await cp(src, join(targetDir, file), { force: true })
  }

  const cssSrc = join(packageDist, 'surface-smoothness-field.css')
  if (existsSync(cssSrc)) {
    await cp(cssSrc, join(targetDir, 'surface-smoothness-field.css'), { force: true })
  }

  for (const dir of ['images', 'icons']) {
    const src = join(dataGen, dir)
    if (existsSync(src)) await cp(src, join(targetDir, dir), { recursive: true, force: true })
  }

  console.log(`Synced field bundle + assets → ${targetDir}`)
}

// Run when invoked directly (bun run scripts/sync-to-id-worktree.ts), not on import.
if (import.meta.main) await syncToIdWorktree()
