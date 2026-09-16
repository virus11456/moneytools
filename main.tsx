import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import TaiwanPage from './app/TaiwanPage';
import TwBrokerCompare from './app/TwBrokerCompare';
import TwFeeCalculator from './app/TwFeeCalculator';
import TwWatchlistGuide from './app/TwWatchlistGuide';
import TwRiskGuide from './app/TwRiskGuide';
import './app/globals.css';
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const Page =
  {
    '/tw/broker-compare': TwBrokerCompare,
    '/tw/fee-calculator': TwFeeCalculator,
    '/tw/watchlist': TwWatchlistGuide,
    '/tw/risk': TwRiskGuide,
  }[path] ||
  (path === '/tw' || path.startsWith('/tw/') ? TaiwanPage : Home);
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
