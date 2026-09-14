import assert from 'node:assert/strict';
import { scanProvenanceView as view } from '../app/scanProvenance.ts';
for (const [trigger,label] of [['scheduled','收盤排程'],['manual','手動更新'],['code_push','程式推送']]) {
  assert.equal(view({trigger}).label,label);
}
for (const value of [null, undefined, 0, '', {}, {trigger:'toString'}, {trigger:{}}]) {
  assert.deepEqual(view(value),{label:'未記錄，無法確認',runUrl:null,attemptLabel:null});
}
const record={trigger:'manual',runId:'34798320112',runAttempt:'2'};
assert.deepEqual(view(record),{label:'手動更新',runUrl:'https://github.com/virus11456/moneytools/actions/runs/34798320112',attemptLabel:'此份資料來自第 2 次執行'});
for (const bad of [0, '0', '01', -1, '１２３', '123/attempts/2', 'https://example.com', '123?x=y', '123#x', '123\n', '9'.repeat(21), null, {}]) {
  assert.equal(view({...record,runId:bad}).runUrl,null);
  assert.equal(view({...record,runId:bad}).attemptLabel,null);
  assert.equal(view({...record,runAttempt:bad}).attemptLabel,null);
}
assert.equal(view({runId:'123'}).label,'未記錄，無法確認');
assert.equal(view({runId:'123',runUrl:'https://example.com'}).runUrl,'https://github.com/virus11456/moneytools/actions/runs/123');
assert.equal(view({runAttempt:'2'}).attemptLabel,null);
assert.equal(view({...record,runId:'18446744073709551615'}).runUrl,'https://github.com/virus11456/moneytools/actions/runs/18446744073709551615');
console.log('Scan provenance: source, run links, attempts, missing and malformed evidence passed');

// Timing is independent of quote freshness and must reject missing/ambiguous timestamps.
const {scanDuration}=await import('../app/scanTiming.ts');
const start='2026-09-14T02:00:00+00:00';
assert.equal(scanDuration(start,'2026-09-14T02:00:00.500000+00:00'),'少於 1 秒');
assert.equal(scanDuration(start,'2026-09-14T02:00:59Z'),'59 秒');
assert.equal(scanDuration(start,'2026-09-14T02:01:00Z'),'1 分');
assert.equal(scanDuration(start,'2026-09-14T02:22:16Z'),'22 分 16 秒');
assert.equal(scanDuration(start,'2026-09-14T03:01:00Z'),'1 小時 1 分');
assert.equal(scanDuration(start,'2026-09-15T02:00:00Z'),'24 小時');
for(const bad of [null,undefined,'','2026-09-14T02:00:00','2026-02-30T00:00:00Z','2026-09-14T24:00:00Z','2026-13-01T00:00:00Z',0,{},'tomorrow']) {
 assert.equal(scanDuration(bad,start),null);
 assert.equal(scanDuration(start,bad),null);
}
assert.equal(scanDuration(start,'2026-09-14T01:59:59Z'),null);
assert.equal(scanDuration('2026-09-14T23:59:59.999000Z','2026-09-15T00:00:01.000000Z'),'1 秒');
console.log('Scan timing: duration boundaries, UTC, malformed dates and reversed intervals passed');
