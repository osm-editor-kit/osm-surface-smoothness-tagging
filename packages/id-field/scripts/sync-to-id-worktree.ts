// Copies the built field bundle + the data package's images/icons into the iD
// worktree so iD can serve them at dist/surface-smoothness-field/.

import { cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const idWorktree =
  process.env.ID_WORKTREE ?? join(import.meta.dirname, '../../../../iD-surface-smoothness-worktree')

const packageDist = join(import.meta.dirname, '../dist')
const dataGen = join(import.meta.dirname, '../../data/dist/generated')
const targetDir = join(idWorktree, 'dist/surface-smoothness-field')

await mkdir(targetDir, { recursive: true })

for (const file of [
  'surface-smoothness-field.js',
  'surface-smoothness-field.esm.js',
  'surface-smoothness-field.css',
]) {
  await cp(join(packageDist, file), join(targetDir, file), { force: true })
}

for (const file of ['surface-smoothness-field.js.map', 'surface-smoothness-field.esm.js.map']) {
  try {
    await cp(join(packageDist, file), join(targetDir, file), { force: true })
  } catch {
    // source maps are optional
  }
}

await cp(join(dataGen, 'images'), join(targetDir, 'images'), { recursive: true, force: true })
await cp(join(dataGen, 'icons'), join(targetDir, 'icons'), { recursive: true, force: true })

console.log(`Synced field bundle + assets → ${targetDir}`)
