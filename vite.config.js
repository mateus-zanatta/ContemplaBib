import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' deixa o app funcionar em qualquer endereço (GitHub Pages, Azure, etc.)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/logo-em.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'EM Aulas de Música — Pentatônica',
        short_name: 'EM Pentatônica',
        description: 'Escala pentatônica, afinações e escalas na guitarra, de forma visual e interativa.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0b0c0f',
        theme_color: '#0b0c0f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'], navigateFallback: 'index.html' },
    }),
  ],
  test: { include: ['tests/**/*.test.js'] },
});
