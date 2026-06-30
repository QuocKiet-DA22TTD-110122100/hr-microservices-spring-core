import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
                    'vendor-date': ['date-fns'],
                    'vendor-http': ['axios', 'zustand'],
                    'vendor-icons': ['lucide-react'],
                },
            },
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/api/xac-thuc': {
                target: 'http://127.0.0.1:8086',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
            '/api': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
            },
        },
        host: true,
    },
});
