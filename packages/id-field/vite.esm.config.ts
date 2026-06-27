import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Self-contained ESM bundle (d3 + the data catalogue are bundled in) so iD can
// lazy-import it without a module graph. Images stay external (served separately).
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    target: 'es2022',
    lib: {
      entry: resolve(import.meta.dirname, 'src/fieldEntry.ts'),
      formats: ['es'],
      fileName: () => 'surface-smoothness-field.esm.js',
    },
  },
})
