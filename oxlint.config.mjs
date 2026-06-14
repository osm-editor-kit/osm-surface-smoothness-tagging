import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'import'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
  },
  env: {
    es2024: true,
    node: true,
  },
  rules: {
    'typescript/switch-exhaustiveness-check': 'error',
  },
  overrides: [
    {
      files: ['packages/id-field/**/*.{ts,tsx}', 'apps/demo/**/*.{ts,tsx}'],
      env: {
        browser: true,
      },
    },
    {
      files: ['**/*.{test,spec}.{ts,tsx}'],
      env: {
        vitest: true,
      },
    },
  ],
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/out/**',
    '**/build/**',
    '**/coverage/**',
  ],
})
