import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['clover-icon.svg', 'manifest.json'],
        manifest: {
          name: 'CLOVER IA — Asistente Educativo Inteligente',
          short_name: 'CLOVER IA',
          description: 'Asistente Educativo Inteligente para Clover Hills Educative System',
          theme_color: '#188E40',
          background_color: '#F8FAF6',
          display: 'standalone',
          orientation: 'portrait-primary',
          icons: [
            {
              src: '/clover-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: '/clover-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
