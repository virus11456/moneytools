export function resolveAffiliateUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function affiliateUrl(): string {
  return resolveAffiliateUrl(import.meta.env.NEXT_PUBLIC_AFFILIATE_URL);
}
