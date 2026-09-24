/** Canonical host is the apex. www is a permanent alias, never a second origin. */
export const WWW_HOST = 'www.stocktools.cc';
export const APEX_ORIGIN = 'https://stocktools.cc';

type HeaderValue = string | string[] | undefined | null;

/**
 * When the request Host is www.stocktools.cc, return the apex URL with the
 * original path and query. Otherwise return null so SEO routes stay in place.
 */
export function wwwRedirectLocation(
  hostHeader: HeaderValue,
  requestTarget: string | undefined | null,
): string | null {
  if (!isWwwHost(hostHeader)) return null;
  return `${APEX_ORIGIN}${safePathAndQuery(requestTarget)}`;
}

export function applyWwwHostRedirect(
  req: { headers: { host?: HeaderValue }; url?: string },
  res: {
    statusCode: number;
    setHeader(name: string, value: string): void;
    end(): void;
  },
): boolean {
  const location = wwwRedirectLocation(req.headers.host, req.url);
  if (!location) return false;
  res.statusCode = 301;
  res.setHeader('Location', location);
  res.setHeader('Content-Length', '0');
  res.end();
  return true;
}

function isWwwHost(hostHeader: HeaderValue): boolean {
  const first = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const host = (first ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  const hostname = stripPort(host).replace(/\.$/, '');
  return hostname === WWW_HOST;
}

function stripPort(host: string): string {
  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    return end === -1 ? host : host.slice(0, end + 1);
  }
  const colon = host.lastIndexOf(':');
  if (colon === -1) return host;
  const port = host.slice(colon + 1);
  return /^\d+$/.test(port) ? host.slice(0, colon) : host;
}

function safePathAndQuery(requestTarget: string | undefined | null): string {
  const raw = requestTarget ?? '/';
  if (
    !raw.startsWith('/') ||
    raw.startsWith('//') ||
    raw.includes('\\') ||
    raw.includes('\0') ||
    raw.includes('\r') ||
    raw.includes('\n')
  ) {
    return '/';
  }
  return raw;
}
