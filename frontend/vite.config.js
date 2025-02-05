
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:5000',
        changeOrigin: true,
        secure: false
      }
    },
    hmr: {
      clientPort: 443,
      host: true
    },
    allowedHosts: ['.replit.dev', '.pike.replit.dev']
  }
})
