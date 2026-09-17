import {
  statusClockRows,
  statusHeadline,
  statusNextLine,
  usCashEquityStatus,
} from '../usMarketHours.ts';

function paint(root: HTMLElement, now: number) {
  const status = usCashEquityStatus(now);
  const main = root.querySelector('.market-now-main');
  const headline = root.querySelector('[data-role="headline"]');
  const next = root.querySelector('[data-role="next"]');
  const clocks = root.querySelector('[data-role="clocks"]');
  if (main) {
    main.classList.remove(
      'market-now--pending',
      'market-now--open',
      'market-now--closed',
      'market-now--unknown',
    );
    main.classList.add(`market-now--${status.state}`);
  }
  if (headline) headline.textContent = statusHeadline(status);
  if (next) next.textContent = statusNextLine(status, now);
  if (clocks) {
    clocks.innerHTML = statusClockRows(status)
      .map((row) => `<div><dt>${row.label}</dt><dd>${row.value}</dd></div>`)
      .join('');
  }
}

export function mountUsMarketHours(doc: Document = document) {
  const root = doc.getElementById('us-market-now');
  if (!root || root.dataset.mounted === '1') return () => {};
  root.dataset.mounted = '1';
  const tick = () => paint(root, Date.now());
  tick();
  const timer = doc.defaultView?.setInterval(tick, 1000);
  const onFocus = () => tick();
  doc.defaultView?.addEventListener('focus', onFocus);
  doc.addEventListener('visibilitychange', onFocus);
  return () => {
    delete root.dataset.mounted;
    if (timer) doc.defaultView?.clearInterval(timer);
    doc.defaultView?.removeEventListener('focus', onFocus);
    doc.removeEventListener('visibilitychange', onFocus);
  };
}
