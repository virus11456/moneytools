import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { loadEnv } from 'vite';
import { applyTwHubDocument, renderGuideDocument, robotsTxt, sitemapXml } from './document.ts';
import { GUIDE_PAGES, findGuide, normalizePath } from './pages.ts';

const GUIDE_WIDGETS: Record<string, { entry: string; assetPrefix: string }> = {
  'us-market-hours': {
    entry: '/app/guides/marketHours-entry.ts',
    assetPrefix: 'us-market-hours',
  },
  'us-fee-calculator': {
    entry: '/app/guides/feeCalculator-entry.ts',
    assetPrefix: 'us-fee-calculator',
  },
};

function requestPath(url?: string) {
  if (!url) return '';
  return normalizePath(url.split('?')[0] || '');
}

function stylesheetHrefs(html: string) {
  return [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/gi)]
    .map((tag) => {
      const href = tag[0].match(/href="([^"]+)"/i)?.[1];
      return href || '';
    })
    .filter(Boolean);
}

function widgetScripts(pageSlug: string) {
  const widget = GUIDE_WIDGETS[pageSlug];
  return widget ? [widget.entry] : [];
}

async function builtWidgetHrefs(distDir: string) {
  const hrefs: Record<string, string> = {};
  try {
    const assets = await readdir(join(distDir, 'assets'));
    for (const [slug, spec] of Object.entries(GUIDE_WIDGETS)) {
      const file = assets.find(
        (name) => name.startsWith(spec.assetPrefix) && name.endsWith('.js'),
      );
      if (file) hrefs[slug] = `/assets/${file}`;
    }
  } catch {
    /* dist/assets may be missing when the plugin runs in isolation */
  }
  return hrefs;
}

export function moneytoolsSeoPlugin(): Plugin {
  let distDir = 'dist';
  return {
    name: 'moneytools-seo-pages',
    configResolved(config) {
      distDir = join(config.root, config.build.outDir);
      const env = loadEnv(config.mode, config.root, ['VITE_', 'NEXT_PUBLIC_']);
      for (const [key, value] of Object.entries(env)) {
        if (value && !process.env[key]) process.env[key] = value;
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const path = requestPath(req.url);
        if (path === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(sitemapXml());
          return;
        }
        if (path === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(robotsTxt());
          return;
        }
        if (path === '/tw') {
          try {
            const indexHtml = await readFile(
              join(server.config.root, 'index.html'),
              'utf8',
            );
            const html = await server.transformIndexHtml(
              '/tw',
              applyTwHubDocument(indexHtml),
            );
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
          } catch (error) {
            next(error);
          }
          return;
        }
        const page = findGuide(path);
        if (!page) {
          next();
          return;
        }
        try {
          const html = await server.transformIndexHtml(
            page.path,
            renderGuideDocument(page, {
              scripts: ['/app/guides-entry.ts', ...widgetScripts(page.slug)],
            }),
          );
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (error) {
          next(error);
        }
      });
    },
    async closeBundle() {
      const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8');
      await mkdir(join(distDir, 'tw'), { recursive: true });
      await writeFile(
        join(distDir, 'tw', 'index.html'),
        applyTwHubDocument(indexHtml),
        'utf8',
      );
      const stylesheets = stylesheetHrefs(indexHtml);
      const widgets = await builtWidgetHrefs(distDir);
      for (const page of GUIDE_PAGES) {
        const file = join(distDir, page.path.slice(1), 'index.html');
        await mkdir(dirname(file), { recursive: true });
        const widget = widgets[page.slug];
        await writeFile(
          file,
          renderGuideDocument(page, {
            stylesheets,
            scripts: widget ? [widget] : [],
          }),
          'utf8',
        );
      }
      await writeFile(join(distDir, 'sitemap.xml'), sitemapXml(), 'utf8');
      await writeFile(join(distDir, 'robots.txt'), robotsTxt(), 'utf8');
    },
  };
}
