import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('html5-qrcode')) return 'vendor-scanner';
            if (id.includes('bwip-js')) return 'vendor-barcode';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('socket.io-client')) return 'vendor-socket';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            return 'vendor-misc';
          }
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
