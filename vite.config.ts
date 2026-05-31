import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
  // @jsquash codecs locate their .wasm via `new URL(..., import.meta.url)`.
  // Vite's prod build (Rollup) handles that natively, but the dev pre-bundler
  // (esbuild) breaks it — so exclude them from optimizeDeps in dev.
  optimizeDeps: {
    exclude: [
      '@jsquash/jpeg',
      '@jsquash/webp',
      '@jsquash/png',
      '@jsquash/avif',
      '@jsquash/oxipng',
    ],
  },
})
