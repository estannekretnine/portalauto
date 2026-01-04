import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import buildInfo from './vite-plugin-build-info.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), buildInfo()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
})

