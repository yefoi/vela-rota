import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El altar se sirve en :5173; el oficio (API) en :8787.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
