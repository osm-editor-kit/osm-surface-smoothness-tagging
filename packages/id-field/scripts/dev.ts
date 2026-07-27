// Watch-build the ESM + IIFE bundles and sync them into the iD worktree on each rebuild.

import { cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import esmConfig from '../vite.esm.config.ts'
import iifeConfig from '../vite.iife.config.ts'
import { syncToIdWorktree } from './sync-to-id-worktree.ts'

const dist = join(import.meta.dirname, '../dist')
await mkdir(dist, { recursive: true })

const postBuild = async () => {
  await cp(
    join(import.meta.dirname, '../src/surface-smoothness-field.css'),
    join(dist, 'surface-smoothness-field.css'),
  )
  // Call the function (not a cached import) so every rebuild actually re-syncs.
  await syncToIdWorktree()
}

const syncPlugin = () => ({
  name: 'sync-to-id-worktree',
  closeBundle: postBuild,
})

await Promise.all(
  [esmConfig, iifeConfig].map((config) =>
    build({
      ...config,
      plugins: [syncPlugin(), ...(config.plugins ?? [])],
      build: { ...config.build, watch: {} },
    }),
  ),
)

console.log(
  'Watching @osm-editor-kit/surface-smoothness-id-field (syncs to iD worktree on rebuild)',
)
