import { join } from 'node:path'
import { defineConfig } from 'vite'

// Project Pages live at /<repo>/; local `vite` / `vite preview` stay at `/`.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  server: {
    port: 5191,
    strictPort: true,
    // Allow serving the data package's generated images/icons (globbed in src/main.ts).
    fs: { allow: [join(import.meta.dirname, '../..')] },
  },
})
