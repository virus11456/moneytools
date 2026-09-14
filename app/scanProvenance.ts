// The run link is built locally for this repository, never taken from input URLs.
export function scanProvenanceView(value: unknown) {
  const p = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const label = p.trigger === 'scheduled' ? '收盤排程'
    : p.trigger === 'manual' ? '手動更新'
    : p.trigger === 'code_push' ? '程式推送' : '未記錄，無法確認';
  const validId = (id: unknown): id is string => typeof id === 'string' && /^[1-9][0-9]{0,19}$/.test(id);
  const runUrl = validId(p.runId)
    ? `https://github.com/virus11456/moneytools/actions/runs/${p.runId}` : null;
  const attemptLabel = runUrl && validId(p.runAttempt)
    ? `此份資料來自第 ${p.runAttempt} 次執行` : null;
  return { label, runUrl, attemptLabel };
}
