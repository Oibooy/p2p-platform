
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
    hmr: {
      clientPort: 443,
      overlay: false // Отключаем overlay окна
    }
  }
})
