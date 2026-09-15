import { access, rm } from 'node:fs/promises';
await access(new URL('../dist/index.html', import.meta.url));
await rm(new URL('../dist/data/', import.meta.url), { recursive: true, force: true });
console.log('Frontend artifact ready; API and daily data are served by the VPS.');
