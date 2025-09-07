
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';


import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Giannicorp Admin',
        short_name: 'GC Admin',
        description: 'Private Admin App for subscriptions, finance & productivity.',
        theme_color: '#0B1220',
        background_color: '#0B1220',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: { port: 5173 }
});
