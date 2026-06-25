import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Tăng warning threshold lên 600KB (mặc định 500KB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Tách vendor libraries thành các chunk riêng để browser cache độc lập
        manualChunks: {
          // React ecosystem — gộp chung để tối ưu tree-shaking và compression
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Form & validation — lazy load, chỉ cần khi vào trang form
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Date utilities
          'vendor-date': ['date-fns'],
          // HTTP + state — nhỏ, bundle cùng nhau
          'vendor-http': ['axios', 'zustand'],
          // Icons — tree-shaken từng icon nhưng tách riêng để cache
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
    host: true,
  },
})
