import { GUIDE_PAGES } from './pages.ts';

export function GuideLinks({ currentPath }: { currentPath?: string }) {
  return (
    <nav className="guide-links" aria-label="說明頁">
      {GUIDE_PAGES.map((page) => (
        <a
          key={page.path}
          href={page.path}
          aria-current={page.path === currentPath ? 'page' : undefined}
        >
          {page.navLabel}
        </a>
      ))}
    </nav>
  );
}
