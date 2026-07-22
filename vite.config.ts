import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  // Relative asset paths are required for Chrome extension pages (chrome-extension://).
  base: './',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: './extension/manifest.json',
          dest: ''
        },
        {
          src: './extension/background.js',
          dest: ''
        },
        {
          src: './extension/popup.html',
          dest: ''
        },
        {
          src: './extension/popup.js',
          dest: ''
        },
        {
          src: './extension/popup.css',
          dest: ''
        },
        {
          src: './extension/boot-splash.css',
          dest: ''
        },
        {
          src: './extension/icons/*',
          dest: 'icons'
        },
        {
          src: 'static',
          dest: './'
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
