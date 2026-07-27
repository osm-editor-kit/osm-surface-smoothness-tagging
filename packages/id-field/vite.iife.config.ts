import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// IIFE is for the iD worktree sync / non-module consumers only — not published to npm.
export default defineConfig({
  build: {
    outDir: 'dist-iife',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
    lib: {
      entry: resolve(import.meta.dirname, 'src/browser.ts'),
      formats: ['iife'],
      name: 'OsmSurfaceSmoothnessField',
      fileName: () => 'surface-smoothness-field.js',
    },
  },
})
