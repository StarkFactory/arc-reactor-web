import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // React Compiler: auto-memoizes components and hooks.
          // Using 'annotation' mode — opt-in per file with 'use memo' directive.
          // Switch to 'infer' mode once the codebase migration is complete.
          ['babel-plugin-react-compiler', { compilationMode: 'annotation' }],
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/clipping-api': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clipping-api/, '/api'),
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'syntax-highlight': ['react-syntax-highlighter'],
        },
      },
    },
  },
})
