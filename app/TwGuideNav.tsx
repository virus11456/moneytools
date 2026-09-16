import { TW_GUIDES, type TwGuideHref } from './twGuides';

export function TwGuideNav({ current }: { current?: TwGuideHref | '/tw' }) {
  return (
    <nav className="tw-guide-links" aria-label="開戶與風險說明">
      <a href="/tw" aria-current={current === '/tw' ? 'page' : undefined}>
        台股篩選
      </a>
      {TW_GUIDES.map((guide) => (
        <a
          key={guide.href}
          href={guide.href}
          aria-current={current === guide.href ? 'page' : undefined}
        >
          {guide.label}
        </a>
      ))}
    </nav>
  );
}
