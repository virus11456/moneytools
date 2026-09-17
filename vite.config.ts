import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
import { moneytoolsSeoPlugin } from './app/guides/seoPlugin';
export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react(), moneytoolsSeoPlugin()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        'us-market-hours': fileURLToPath(
          new URL('./app/guides/marketHours-entry.ts', import.meta.url),
        ),
        'us-fee-calculator': fileURLToPath(
          new URL('./app/guides/feeCalculator-entry.ts', import.meta.url),
        ),
      },
    },
  },
  preview: {
    proxy: {
      '/api': { target: 'https://srv1527356.hstgr.cloud', changeOrigin: true },
      '/data': { target: 'https://srv1527356.hstgr.cloud', changeOrigin: true },
    },
  },
  server: {
    host: '127.0.0.1',
    watch: { usePolling: true },
    proxy: { '/api': 'http://127.0.0.1:8788' },
  },
});
