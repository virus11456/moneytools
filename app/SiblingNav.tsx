import { SIBLING_TOOLS, SIMPLES_SITE } from './siblingTools';

export function SiblingNav({
  variant = 'header',
}: {
  variant?: 'header' | 'footer';
}) {
  const footer = variant === 'footer';
  return (
    <nav
      className={footer ? 'sibling-nav sibling-nav-footer' : 'sibling-nav'}
      aria-label={footer ? 'SIMPLES 工具網' : '相關工具'}
    >
      {SIBLING_TOOLS.map((tool) => (
        <a key={tool.href} href={tool.href} target="_blank" rel="noreferrer">
          {tool.label}
          <small>{tool.hint}</small>
        </a>
      ))}
      {footer ? <SimplesFingerprint /> : null}
    </nav>
  );
}

export function SimplesFingerprint() {
  return (
    <a
      className="simples-fingerprint"
      href={SIMPLES_SITE.href}
      target="_blank"
      rel="noreferrer"
      aria-label={SIMPLES_SITE.label}
    >
      {SIMPLES_SITE.label}
    </a>
  );
}
