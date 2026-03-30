import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://api-gateway:8080',
        changeOrigin: true,
      },
    },
    // Development chỉ, Docker sẽ dùng nginx proxy
    host: true,
  },
})
