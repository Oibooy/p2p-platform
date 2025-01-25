
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    hmr: {
      clientPort: 443,
    },
    allowedHosts: [
      'fd06ccd8-8d5e-4752-83cb-2cd7ca51f910-00-140sz8byw2s6v.pike.replit.dev',
      '.replit.dev'
    ]
  }
});
