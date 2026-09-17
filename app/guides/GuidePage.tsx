import { useEffect } from 'react';
import { findGuide } from './pages.ts';
import { renderGuideBody } from './document.ts';
import { mountUsFeeCalculator } from './feeCalculatorWidget.ts';
import { mountUsMarketHours } from './marketHoursWidget.ts';

export default function GuidePage() {
  const page = findGuide(window.location.pathname);
  useEffect(() => {
    if (!page) return;
    document.title = page.title;
    document.documentElement.lang = 'zh-Hant';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', page.description);
  }, [page]);
  useEffect(() => {
    if (page?.slug === 'us-market-hours') return mountUsMarketHours();
    if (page?.slug === 'us-fee-calculator') return mountUsFeeCalculator();
  }, [page]);
  if (!page) {
    return (
      <div className="app guide-app">
        <main>
          <h1>找不到此說明頁</h1>
          <p>
            <a href="/tw/faq">常見問題</a> · <a href="/">美股工具</a> ·{' '}
            <a href="/tw">台股工具</a>
          </p>
        </main>
      </div>
    );
  }
  return <div dangerouslySetInnerHTML={{ __html: renderGuideBody(page) }} />;
}
