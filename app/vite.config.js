import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['stg_logo.jpeg', 'favicon.ico'],
      manifest: {
        name: 'Fabric POS — STG',
        short_name: 'Fabric POS',
        description: 'Fabric Factory Management System',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/stg_logo.jpeg',
            sizes: 'any',
            type: 'image/jpeg',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg}'],
        maximumFileSizeToCacheInBytes: 4000000,
        // Don't cache Firebase realtime channels
        navigateFallbackDenylist: [/^\/__\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ],

  build: {
    target: 'es2020',
    minify: 'esbuild',       // faster than terser
    sourcemap: false,         // no sourcemaps in production
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': [
            'firebase/app', 'firebase/auth', 'firebase/firestore',
            'firebase/storage', 'firebase/messaging'
          ],
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'zustand'],
          'vendor-charts': ['recharts'],
          'vendor-barcode': ['jsbarcode', 'qrcode.react'],
          'vendor-pdf': ['html2canvas', 'jspdf'],
        }
      }
    }
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  }
})
