// Copies generated assets (images, icons, catalogue.json) into dist/ after tsc.
// tsc compiles src/generated/catalogue.ts but does not copy non-TS files.

import { cpSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const src = join(root, 'src/generated')
const dist = join(root, 'dist/generated')

mkdirSync(dist, { recursive: true })
cpSync(join(src, 'images'), join(dist, 'images'), { recursive: true })
cpSync(join(src, 'icons'), join(dist, 'icons'), { recursive: true })
cpSync(join(src, 'catalogue.json'), join(dist, 'catalogue.json'))

console.log('Copied generated assets → packages/data/dist/generated/')
