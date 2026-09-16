import { ArrowUpRight } from 'lucide-react';
import { affiliateUrl } from './affiliate';

const DISCLOSURE = '可能為聯盟連結，我們可能因此獲得報酬。此連結不改變分析結果。';

export function AffiliateCta({
  variant = 'block',
  locale = 'zh-Hant',
}: {
  variant?: 'header' | 'block';
  locale?: 'zh-Hant' | 'en';
}) {
  const href = affiliateUrl();
  const label =
    locale === 'en' ? 'Open a US brokerage account' : '開美股帳戶';
  if (variant === 'header') {
    return (
      <a
        className="affiliate-header"
        href={href}
        target="_blank"
        rel="noreferrer"
        title={DISCLOSURE}
      >
        {label}
        <ArrowUpRight size={14} />
      </a>
    );
  }
  return (
    <aside className="affiliate-cta" aria-label={label}>
      <div>
        <p>Firstrade · 中文介面 · 0 手續費美股</p>
        <small>{DISCLOSURE}</small>
      </div>
      <a href={href} target="_blank" rel="noreferrer">
        {label} <ArrowUpRight size={15} />
      </a>
    </aside>
  );
}
