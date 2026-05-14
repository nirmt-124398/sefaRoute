import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/keys': 'http://localhost:8000',
      '/v1': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
