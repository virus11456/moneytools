import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import TaiwanPage from './app/TaiwanPage';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.pathname === '/tw' ||
    window.location.pathname.startsWith('/tw/') ? (
      <TaiwanPage />
    ) : (
      <Home />
    )}
  </React.StrictMode>,
);
