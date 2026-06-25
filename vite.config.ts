import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'NanimeID Offline',
        short_name: 'NanimeID',
        description: 'Portal Nonton Anime & Baca Manga Tanpa Iklan',
        theme_color: '#0d0d0d',
        background_color: '#0d0d0d',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: true,
    host: 'localhost',
    port: 3001,
    proxy: {
      '/cdn-proxy': {
        target: 'https://cdn-stable.nanimeid.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn-proxy/, '')
      }
    }
  },
  preview: {
    port: 4173,
    proxy: {
      '/cdn-proxy': {
        target: 'https://cdn-stable.nanimeid.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn-proxy/, '')
      }
    }
  }
})
