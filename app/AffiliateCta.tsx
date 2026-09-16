import { ArrowUpRight } from 'lucide-react';
import { affiliateUrl } from './affiliate';

export function AffiliateCta() {
  const href = affiliateUrl();
  if (!href) return null;
  return (
    <aside className="affiliate-cta" aria-label="合作券商">
      <div>
        <p>研究完規則與費用後，若要實單，請到券商官網核對費率再開戶。</p>
        <small>用這份分析開戶不代表獲利，也不構成投資建議。</small>
      </div>
      <a href={href} target="_blank" rel="noreferrer">
        前往合作券商 <ArrowUpRight size={15} />
      </a>
    </aside>
  );
}
