export const SIBLING_TOOLS = [
  { href: 'https://warhubs.com/', label: 'Warhubs', hint: '戰情觀測' },
  { href: 'https://hypeboss.cc/', label: 'HypeBoss', hint: '加密工具' },
  { href: 'https://toolist.cc/', label: 'Toolist', hint: '工具捷徑' },
] as const;

export const SIMPLES_SITE = {
  href: 'https://simples.com.tw/',
  label: 'SIMPLES 工具網',
} as const;

export function siblingLinkHtml(
  href: string,
  label: string,
  hint?: string,
  className?: string,
) {
  const cls = className ? ` class="${className}"` : '';
  const small = hint ? `<small>${hint}</small>` : '';
  return `<a${cls} href="${href}" target="_blank" rel="noreferrer">${label}${small}</a>`;
}

export function siblingNavHtml(variant: 'header' | 'footer' = 'header') {
  const links = SIBLING_TOOLS.map((tool) =>
    siblingLinkHtml(tool.href, tool.label, tool.hint),
  );
  if (variant === 'footer') {
    links.push(
      siblingLinkHtml(
        SIMPLES_SITE.href,
        SIMPLES_SITE.label,
        undefined,
        'simples-fingerprint',
      ),
    );
  }
  const cls =
    variant === 'footer' ? 'sibling-nav sibling-nav-footer' : 'sibling-nav';
  const label = variant === 'footer' ? 'SIMPLES 工具網' : '相關工具';
  return `<nav class="${cls}" aria-label="${label}">
      ${links.join('\n      ')}
    </nav>`;
}
