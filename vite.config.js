import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // ─── Backend proxy (avoids CORS in dev) ──────────────────────────
  // All /api/* requests are forwarded to your backend.
  // Change the target URL to match your actual backend server.
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Uncomment below if your backend API doesn't use /api prefix:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
