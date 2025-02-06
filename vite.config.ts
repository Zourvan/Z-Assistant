import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: './manifest.json', // مسیر فایل ثابت شما
          dest: '' // این گزینه فایل را در کنار سایر فایل‌ها در پوشه dist قرار می‌دهد
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
