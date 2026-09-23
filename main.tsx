import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import TaiwanPage from './app/TaiwanPage';
import MacroPage from './app/MacroPage';
import TwBrokerCompare from './app/TwBrokerCompare';
import TwFeeCalculator from './app/TwFeeCalculator';
import TwWatchlistGuide from './app/TwWatchlistGuide';
import TwRiskGuide from './app/TwRiskGuide';
import GuidePage from './app/guides/GuidePage';
import { isGuidePath } from './app/guides/pages.ts';
import './app/globals.css';
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const ExtraGuide =
  {
    '/tw/broker-compare': TwBrokerCompare,
    '/tw/fee-calculator': TwFeeCalculator,
    '/tw/watchlist': TwWatchlistGuide,
    '/tw/risk': TwRiskGuide,
  }[path];
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {ExtraGuide ? (
      <ExtraGuide />
    ) : isGuidePath(path) ? (
      <GuidePage />
    ) : path === '/macro' || path.startsWith('/macro/') ? (
      <MacroPage />
    ) : path === '/tw' || path.startsWith('/tw/') ? (
      <TaiwanPage />
    ) : (
      <Home />
    )}
  </React.StrictMode>,
);
