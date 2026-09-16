const SIBLING_TOOLS = [
  { href: 'https://warhubs.com/', label: 'WARHUBS', hint: '戰情觀測站' },
  { href: 'https://hypeboss.cc/', label: 'HypeBoss', hint: '大戶觀察' },
] as const;

export function SiblingNav() {
  return (
    <nav className="sibling-nav" aria-label="相關工具">
      {SIBLING_TOOLS.map((tool) => (
        <a
          key={tool.href}
          href={tool.href}
          target="_blank"
          rel="noreferrer"
        >
          {tool.label}
          <small>{tool.hint}</small>
        </a>
      ))}
    </nav>
  );
}

export function SimplesFingerprint() {
  return (
    <a
      className="simples-fingerprint"
      href="https://simples.com.tw/"
      target="_blank"
      rel="noreferrer"
      aria-label="SIMPLES 簡單行銷"
    >
      SIMPLES
    </a>
  );
}
