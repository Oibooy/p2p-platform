
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'
    },
    allowedHosts: [
      'fd06ccd8-8d5e-4752-83cb-2cd7ca51f910-00-140sz8byw2s6v.pike.replit.dev',
      '.replit.dev'
    ]
  }
})
