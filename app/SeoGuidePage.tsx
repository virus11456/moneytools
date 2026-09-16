import { useEffect } from 'react';
import { Activity, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { AffiliateCta } from './AffiliateCta';
import { PositionCalculator } from './PositionCalculator';
import { SiblingNav, SimplesFingerprint } from './SiblingNav';
import { SEO_GUIDES, type SeoGuide } from './seoGuides';
import './taiwan.css';

function setMetaDescription(description: string) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', description);
}

export function SeoGuidePage({ guide }: { guide: SeoGuide }) {
  useEffect(() => {
    document.title = guide.title;
    setMetaDescription(guide.description);
    document.documentElement.lang = 'zh-Hant';
  }, [guide]);
  const others = SEO_GUIDES.filter((item) => item.path !== guide.path);
  return (
    <div className="app tw-app">
      <header className="header">
        <div className="header-lead">
          <a className="brand" href="/tw">
            <span className="brand-icon">
              <Activity size={21} />
            </span>
            moneytools<span className="beta">TW EQUITIES</span>
          </a>
          <nav className="market-switch" aria-label="股票市場">
            <a href="/">美股</a>
            <a href="/tw" aria-current="page">
              台股
            </a>
          </nav>
          <SiblingNav />
        </div>
      </header>
      <main className="guide-main">
        <a className="tw-back" href="/tw">
          <ArrowLeft size={16} /> 回台股首頁
        </a>
        <p className="eyebrow">{guide.kicker}</p>
        <h1>{guide.h1}</h1>
        <p className="guide-lede">{guide.lede}</p>
        <nav className="guide-live-links" aria-label="對應的本站畫面">
          {guide.liveLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label} <ArrowUpRight size={15} />
            </a>
          ))}
        </nav>
        {guide.sections.map((section) => (
          <section className="tw-panel" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && (
              <ul className="guide-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        {guide.calculator && <PositionCalculator />}
        <AffiliateCta />
        <nav className="guide-related" aria-label="其他說明頁">
          <h2>其他說明頁</h2>
          <ul>
            {others.map((item) => (
              <li key={item.path}>
                <a href={item.path}>{item.h1}</a>
              </li>
            ))}
            <li>
              <a href="/tw">回台股首頁</a>
            </li>
          </ul>
        </nav>
        <div className="tw-footer">
          <div>
            <p>說明頁只解釋既有規則，不另產生掃描結果。</p>
            <SimplesFingerprint />
          </div>
          <a href="/">美股雙重分析</a>
        </div>
      </main>
    </div>
  );
}

export function GuideHubLinks({ className }: { className?: string }) {
  return (
    <nav className={className} aria-label="美股研究說明頁">
      {SEO_GUIDES.map((guide) => (
        <a key={guide.path} href={guide.path}>
          <strong>{guide.h1}</strong>
          <span>{guide.kicker}</span>
        </a>
      ))}
    </nav>
  );
}
