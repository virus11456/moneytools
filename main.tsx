import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import TaiwanPage from './app/TaiwanPage';
import GuidePage from './app/guides/GuidePage';
import { isGuidePath } from './app/guides/pages.ts';
import './app/globals.css';
const path = window.location.pathname;
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isGuidePath(path) ? (
      <GuidePage />
    ) : path === '/tw' || path.startsWith('/tw/') ? (
      <TaiwanPage />
    ) : (
      <Home />
    )}
  </React.StrictMode>,
);
