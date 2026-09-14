export function overviewSummary(stocks: any[], changes: any[]) {
  const count = (kinds: string[]) => new Set(changes.filter(e => e.kinds.some((k: string) => kinds.includes(k))).map(e => e.symbol)).size;
  const sectors = new Map<string, { name: string; total: number; qualified: number; dual: number; incomplete: number }>();
  for (const stock of stocks) {
    const name = stock.sector || 'Unknown';
    const group = sectors.get(name) || { name, total: 0, qualified: 0, dual: 0, incomplete: 0 };
    group.total++;
    if (stock.fundamentals.passed) {
      group.qualified++;
      if (stock.dualPass) group.dual++;
    }
    if (stock.status === 'INCOMPLETE') group.incomplete++;
    sectors.set(name, group);
  }
  return {
    added: count(['FUNDAMENTAL_ADDED', 'DUAL_ADDED']),
    lost: count(['FUNDAMENTAL_LOST', 'DUAL_LOST']),
    changed: count(['ENTRY_CHANGED', 'CONDITIONS_CHANGED']),
    sectors: [...sectors.values()].sort((a,b) => a.name.localeCompare(b.name)),
  };
}
