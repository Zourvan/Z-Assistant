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
