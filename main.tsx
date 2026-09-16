import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import TaiwanPage from './app/TaiwanPage';
import { SeoGuidePage } from './app/SeoGuidePage';
import { guideByPath } from './app/seoGuides';
import './app/globals.css';
const path = window.location.pathname;
const guide = guideByPath(path);
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {guide ? (
      <SeoGuidePage guide={guide} />
    ) : path === '/tw' || path.startsWith('/tw/') ? (
      <TaiwanPage />
    ) : (
      <Home />
    )}
  </React.StrictMode>,
);
