import {
  compareUsBrokerFees,
  finiteNumber,
  formatMoney,
  formatPct,
  formatShares,
  parseFeeSide,
  type FeeCalcInput,
} from '../usFeeCalculator.ts';

function readInput(form: HTMLFormElement): FeeCalcInput {
  const data = new FormData(form);
  const num = (name: string) => finiteNumber(data.get(name));
  return {
    notionalUsd: num('notionalUsd'),
    sharePriceUsd: num('sharePriceUsd'),
    side: parseFeeSide(data.get('side')),
    fxRate: num('fxRate'),
    dualPerShareUsd: num('dualPerShareUsd'),
    dualMinUsd: num('dualMinUsd'),
    dualFxSpreadPct: num('dualFxSpreadPct'),
    usCommissionUsd: num('usCommissionUsd'),
    usWireTwd: num('usWireTwd'),
    usFxSpreadPct: num('usFxSpreadPct'),
    usSellFeePerMillionUsd: num('usSellFeePerMillionUsd'),
  };
}

function setText(root: HTMLElement, role: string, value: string) {
  const node = root.querySelector(`[data-role="${role}"]`);
  if (node) node.textContent = value;
}

function paint(root: HTMLElement, form: HTMLFormElement) {
  const result = compareUsBrokerFees(readInput(form));
  setText(root, 'shares', formatShares(result.shares));
  setText(root, 'dual-commission', formatMoney(result.dual.commissionUsd, 'USD'));
  setText(root, 'us-commission', formatMoney(result.us.commissionUsd, 'USD'));
  setText(root, 'us-sec', formatMoney(result.us.extraUsd, 'USD'));
  setText(root, 'us-wire', formatMoney(result.us.wireTwd, 'TWD'));
  setText(root, 'dual-fx', formatMoney(result.dual.fxTwd, 'TWD'));
  setText(root, 'us-fx', formatMoney(result.us.fxTwd, 'TWD'));
  setText(root, 'dual-total', formatMoney(result.dual.totalTwd, 'TWD'));
  setText(root, 'us-total', formatMoney(result.us.totalTwd, 'TWD'));
  setText(root, 'dual-pct', formatPct(result.dual.pctOfNotional));
  setText(root, 'us-pct', formatPct(result.us.pctOfNotional));
  setText(root, 'delta', formatMoney(result.deltaTwd, 'TWD'));
}

export function mountUsFeeCalculator(doc: Document = document) {
  const root = doc.getElementById('us-fee-calc');
  const form = root?.querySelector('form');
  if (!root || !(form instanceof HTMLFormElement) || root.dataset.mounted === '1') {
    return () => {};
  }
  root.dataset.mounted = '1';
  const onChange = () => paint(root, form);
  const onSubmit = (event: Event) => {
    event.preventDefault();
    paint(root, form);
  };
  form.addEventListener('input', onChange);
  form.addEventListener('change', onChange);
  form.addEventListener('submit', onSubmit);
  paint(root, form);
  return () => {
    delete root.dataset.mounted;
    form.removeEventListener('input', onChange);
    form.removeEventListener('change', onChange);
    form.removeEventListener('submit', onSubmit);
  };
}
