import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'Só Retrô Radio',
        short_name: 'Só Retrô',
        description: 'Player de rádio online — os melhores anos 80, 90 e mais',
        theme_color: '#FF4500',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
