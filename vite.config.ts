import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
import { SEO_GUIDES } from './app/seoGuides';
const seoPaths = new Set(SEO_GUIDES.map((guide) => guide.path));
function rewriteSeoHtml(req: { url?: string }, _res: unknown, next: () => void) {
  const [pathname, search = ''] = (req.url || '').split('?');
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (seoPaths.has(clean)) {
    req.url = `${clean}.html${search ? `?${search}` : ''}`;
  }
  next();
}
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'seo-html-preview',
      configurePreviewServer(server) {
        server.middlewares.use(rewriteSeoHtml);
      },
    },
  ],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  preview: { proxy: { '/api': { target: 'https://srv1527356.hstgr.cloud', changeOrigin: true }, '/data': { target: 'https://srv1527356.hstgr.cloud', changeOrigin: true } } },
  server: {
    host: '127.0.0.1',
    watch: { usePolling: true },
    proxy: { '/api': 'http://127.0.0.1:8788' },
  },
});
