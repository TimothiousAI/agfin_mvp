import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Target modern browsers for better tree-shaking
    target: 'es2020',

    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React and related libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Clerk authentication
            if (id.includes('@clerk')) {
              return 'vendor-clerk';
            }
            // UI libraries (Radix, Lucide, etc.)
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('class-variance-authority')) {
              return 'vendor-ui';
            }
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Other vendor code
            return 'vendor';
          }

          // Application chunks
          // Auth pages (lazy loaded, separate chunk)
          if (id.includes('/auth/')) {
            return 'auth';
          }
          // Test pages (lazy loaded, separate chunk)
          if (id.includes('/test/')) {
            return 'test';
          }
          // Chat/Application pages
          if (id.includes('/application/')) {
            return 'app';
          }
          // Shared UI components
          if (id.includes('/shared/ui/')) {
            return 'ui-components';
          }
        },

        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },

    // Compression and optimization (using esbuild for better Vite support)
    minify: 'esbuild',
    // Drop console statements in production
    esbuild: {
      drop: ['console', 'debugger'],
    },

    // Source maps for production debugging (optional)
    sourcemap: false,

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Performance optimizations for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@clerk/clerk-react',
      'lucide-react',
    ],
    exclude: ['@tanstack/react-query-devtools'],
  },
})
