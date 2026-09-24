import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  applyWwwHostRedirect,
  wwwRedirectLocation,
} from '../app/wwwHostRedirect.ts';

const target = '/tw/us-earnings?x=1';
const apex = `https://stocktools.cc${target}`;

assert.equal(
  wwwRedirectLocation('www.stocktools.cc', target),
  apex,
);
assert.equal(
  wwwRedirectLocation('WWW.Stocktools.cc:443', target),
  apex,
);
assert.equal(
  wwwRedirectLocation('www.stocktools.cc.', '/sitemap.xml'),
  'https://stocktools.cc/sitemap.xml',
);
assert.equal(
  wwwRedirectLocation('www.stocktools.cc', '/robots.txt'),
  'https://stocktools.cc/robots.txt',
);
assert.equal(wwwRedirectLocation('www.stocktools.cc', '/'), 'https://stocktools.cc/');
assert.equal(wwwRedirectLocation('www.stocktools.cc', '/tw'), 'https://stocktools.cc/tw');
assert.equal(wwwRedirectLocation('www.stocktools.cc', ''), 'https://stocktools.cc/');

assert.equal(wwwRedirectLocation('stocktools.cc', target), null);
assert.equal(wwwRedirectLocation('stocktools.cc:443', '/tw'), null);
assert.equal(wwwRedirectLocation('localhost:5173', target), null);
assert.equal(wwwRedirectLocation('www.stocktools.cc.evil.example', target), null);
assert.equal(wwwRedirectLocation(undefined, target), null);

assert.equal(
  wwwRedirectLocation('www.stocktools.cc', '//evil.example/phish'),
  'https://stocktools.cc/',
);

const headers = [];
const redirected = {
  statusCode: 200,
  setHeader(name, value) {
    headers.push([name, value]);
  },
  end() {
    this.ended = true;
  },
  ended: false,
};
assert.equal(
  applyWwwHostRedirect(
    { headers: { host: 'www.stocktools.cc' }, url: target },
    redirected,
  ),
  true,
);
assert.equal(redirected.statusCode, 301);
assert.equal(redirected.ended, true);
assert.deepEqual(headers, [
  ['Location', apex],
  ['Content-Length', '0'],
]);
const passedThrough = {
  statusCode: 200,
  setHeader() {
    throw new Error('apex host must not set redirect headers');
  },
  end() {
    throw new Error('apex host must not end the response');
  },
};
assert.equal(
  applyWwwHostRedirect(
    { headers: { host: 'stocktools.cc' }, url: '/sitemap.xml' },
    passedThrough,
  ),
  false,
);
assert.equal(passedThrough.statusCode, 200);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
const hostRedirects = vercel.redirects.filter(
  (entry) =>
    entry.permanent === true &&
    entry.has?.some(
      (condition) =>
        condition.type === 'host' && condition.value === 'www.stocktools.cc',
    ),
);
assert.ok(hostRedirects.length >= 1, 'vercel.json missing www host redirect');
assert.equal(vercel.redirects[0], hostRedirects[0]);
assert.equal(hostRedirects[0].destination, 'https://stocktools.cc/:path*');
assert.equal(hostRedirects[0].source, '/:path*');
assert.equal(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-earnings' &&
      entry.destination === '/tw/us-earnings/index.html',
  ),
  true,
);
assert.equal(
  vercel.rewrites.some((entry) => entry.source === '/tw/:path*'),
  true,
);

console.log(
  'www host redirect passed: apex location keeps path and query; apex and SEO routes are not redirected.',
);
