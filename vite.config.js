import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    // Vite 8 defaults to lightningcss minify, which can fail on valid media-query CSS.
    // esbuild minify is stable for this project.
    devSourcemap: false,
  },
  build: {
    sourcemap: false,
    target: 'es2022',
    cssMinify: 'esbuild',
  },
  server: {
    host: '127.0.0.1',
  },
})
