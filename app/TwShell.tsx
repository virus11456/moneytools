import { useEffect, type ReactNode } from 'react';
import { Activity } from 'lucide-react';
import { SiblingNav, SimplesFingerprint } from './SiblingNav';
import { AffiliateCta } from './AffiliateCta';
import { TwGuideNav } from './TwGuideNav';
import { type TwGuideHref } from './twGuides';
import './taiwan.css';

export function setPageMeta(title: string, description: string) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', description);
}

export function TwShell({
  current,
  title,
  description,
  eyebrow,
  heading,
  lede,
  children,
}: {
  current: TwGuideHref;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lede: string;
  children: ReactNode;
}) {
  useEffect(() => {
    setPageMeta(title, description);
  }, [title, description]);
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
      <main className="tw-seo">
        <section className="tw-intro">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{heading}</h1>
            <p>{lede}</p>
            <TwGuideNav current={current} />
          </div>
        </section>
        {children}
        <p className="tw-seo-home">
          回到<a href="/tw">台股篩選首頁</a>，對照每日基本面與趨勢條件。
        </p>
        <AffiliateCta />
        <div className="tw-footer">
          <div>
            <p>說明頁不改篩選規則 · 費用請以券商官網為準</p>
            <SimplesFingerprint />
          </div>
        </div>
      </main>
    </div>
  );
}
