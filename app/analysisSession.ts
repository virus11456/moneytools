export type AnalysisState = {
  symbol: string;
  stock: any;
  busy: boolean;
  error: string;
  source: 'scan' | 'query';
};
export const emptyAnalysis: AnalysisState = {
  symbol: '',
  stock: null,
  busy: false,
  error: '',
  source: 'scan',
};
export class AnalysisSession {
  state = { ...emptyAnalysis };
  private controller: AbortController | null = null;
  private epoch = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private emit: (state: AnalysisState) => void;
  private request: typeof fetch;
  constructor(
    emit: (state: AnalysisState) => void,
    request: typeof fetch = fetch,
  ) {
    this.emit = emit;
    this.request = request.bind(globalThis);
  }
  private update(patch: Partial<AnalysisState>) {
    this.state = { ...this.state, ...patch };
    this.emit(this.state);
  }
  dispose() {
    this.epoch++;
    this.controller?.abort();
    this.controller = null;
    clearTimeout(this.timer);
  }
  open(symbol: string, cached: any) {
    if (symbol !== this.state.symbol) {
      this.dispose();
      this.update({ ...emptyAnalysis, symbol, stock: cached || null });
    }
    if (!symbol) return;
    if (this.state.source === 'query') return;
    if (this.controller) {
      if (
        cached &&
        (!this.state.stock ||
          Date.parse(cached.fetchedAt) >=
            Date.parse(this.state.stock.fetchedAt))
      )
        this.update({ stock: cached });
      return;
    }
    if (cached) this.update({ stock: cached, error: '', busy: false });
    else if (!this.state.stock) void this.refresh(false);
  }
  showScan(cached: any) {
    if (!cached || cached.symbol !== this.state.symbol) return;
    this.dispose();
    this.update({ stock: cached, source: 'scan', busy: false, error: '' });
  }
  async refresh(force = true) {
    if (!this.state.symbol || this.controller) return;
    const symbol = this.state.symbol;
    const epoch = ++this.epoch;
    const controller = new AbortController();
    this.controller = controller;
    this.update({ busy: true, error: '' });
    let timedOut = false;
    this.timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 65000);
    try {
      const response = await this.request(
        `/api/analyze?symbol=${encodeURIComponent(symbol)}${force ? '&refresh=1' : ''}`,
        { signal: controller.signal, cache: force ? 'no-store' : 'default' },
      );
      const incoming = await response.json();
      if (!response.ok) throw Error(incoming.error || '來源暫時無法回應');
      if (
        incoming.symbol !== symbol ||
        !incoming.fundamentals ||
        !incoming.technical ||
        !incoming.entry ||
        !Array.isArray(incoming.reasons) ||
        !['READY', 'APPROACHING', 'QUALITY', 'WAIT', 'INCOMPLETE'].includes(
          incoming.status,
        ) ||
        !Number.isFinite(Date.parse(incoming.fetchedAt))
      )
        throw Error('來源回傳格式不完整');
      if (epoch !== this.epoch || controller.signal.aborted) return;
      if (
        this.state.stock &&
        Date.parse(incoming.fetchedAt) < Date.parse(this.state.stock.fetchedAt)
      )
        throw Error('回傳資料比目前紀錄更舊');
      this.update({ stock: incoming, source: 'query', error: '' });
    } catch (error) {
      if (epoch !== this.epoch) return;
      const message = timedOut
        ? '查詢逾時，請稍後再試'
        : error instanceof Error
          ? error.message
          : '查詢失敗';
      this.update({
        error:
          message +
          (this.state.stock ? '；已保留原本資料。' : '。請稍後重試。'),
      });
    } finally {
      if (epoch === this.epoch) {
        clearTimeout(this.timer);
        this.controller = null;
        this.update({ busy: false });
      }
    }
  }
}
