import { access, readFile, rm } from 'node:fs/promises';
import { writeSeoHtml } from './seo-html.mjs';

const dist = new URL('../dist/', import.meta.url);
await access(new URL('index.html', dist));
await rm(new URL('data/', dist), { recursive: true, force: true });
const indexHtml = await readFile(new URL('index.html', dist), 'utf8');
await writeSeoHtml(indexHtml, dist);
console.log('Frontend artifact ready; unique SEO HTML written. API and daily data are served by the VPS.');
