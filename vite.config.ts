import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'logo.svg', 'pwa-icon.svg'],
      manifest: {
        id: '/',
        name: 'Só Retrô Radio',
        short_name: 'Só Retrô',
        description: 'Player de rádio online — os melhores anos 80, 90 e mais',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        theme_color: '#FF4500',
        background_color: '#F7F7F7',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        orientation: 'any',
        categories: ['music', 'entertainment'],
        prefer_related_applications: false,
        icons: [
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
