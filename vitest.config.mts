import { defineConfig } from 'vitest/config'

// A standalone Node configuration keeps pure core tests independent of Electron and React plugins.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
})
