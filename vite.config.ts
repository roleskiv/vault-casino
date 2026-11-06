/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Long-lived vendor chunks change rarely, so returning visitors keep them cached.
const vendor = (id: string) => {
  if (!id.includes('node_modules')) return
  if (/[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return 'react'
  if (/[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion'
  if (/[\\/]lucide-react[\\/]/.test(id)) return 'icons'
}

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'single'
    ? { outDir: 'dist-single', assetsInlineLimit: 100000000 }
    : { rollupOptions: { output: { manualChunks: vendor } } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}))
