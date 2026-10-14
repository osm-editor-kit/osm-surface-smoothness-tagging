import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Headless entry (dist/logic.js): the tag rules and picker choices without DOM or d3, for hosts
// that draw their own UI. The data package stays an import, so it is not bundled twice.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: false,
    target: 'es2022',
    lib: {
      entry: resolve(import.meta.dirname, 'src/logic.ts'),
      formats: ['es'],
      fileName: () => 'logic.js',
    },
    rollupOptions: {
      external: ['@osm-editor-kit/surface-smoothness-data'],
    },
  },
})
