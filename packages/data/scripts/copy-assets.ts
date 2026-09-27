// Copies generated assets (images, catalogue.json) into dist/ after tsc.
// tsc compiles src/generated/catalogue.ts but does not copy non-TS files.

import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const src = join(root, 'src/generated')
const dist = join(root, 'dist/generated')

if (!existsSync(join(src, 'catalogue.json'))) {
  console.error('Missing src/generated — run `bun run extract` from the repo root first.')
  process.exit(1)
}

mkdirSync(dist, { recursive: true })
cpSync(join(src, 'images'), join(dist, 'images'), { recursive: true })
cpSync(join(src, 'catalogue.json'), join(dist, 'catalogue.json'))

console.log('Copied generated assets → packages/data/dist/generated/')
