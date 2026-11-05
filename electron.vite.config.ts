import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Keep privileged desktop builds separate from the renderer, which alone needs the React plugin.
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        // Keep this alias aligned with the paths mapping in tsconfig.web.json.
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
