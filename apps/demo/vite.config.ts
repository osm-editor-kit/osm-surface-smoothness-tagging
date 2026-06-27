import { join } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5191,
    strictPort: true,
    // Allow serving the data package's generated images/icons (globbed in src/main.ts).
    fs: { allow: [join(import.meta.dirname, '../..')] },
  },
})
