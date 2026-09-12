import assert from 'node:assert/strict';
import { marketClock } from '../app/marketClock.ts';
const calendar = { fromDate:'2026-09-10', throughDate:'2026-09-20', sessions:[
  {date:'2026-09-11',closeAt:'2026-09-11T20:00:00Z',scanAt:'2026-09-11T21:15:00Z'},
  {date:'2026-09-14',closeAt:'2026-09-14T20:00:00Z',scanAt:'2026-09-14T21:15:00Z'}] };
let result = marketClock(calendar, Date.parse('2026-09-13T04:00:00Z'),'2026-09-11T22:00:00Z');
assert.equal(result.isSessionDay,false); assert.equal(result.overdue,false); assert.equal(result.next.date,'2026-09-14');
result = marketClock(calendar,Date.parse('2026-09-14T20:30:00Z'),'2026-09-11T22:00:00Z');
assert.equal(result.closed.date,'2026-09-14'); assert.equal(result.overdue,false);
result = marketClock(calendar,Date.parse('2026-09-14T21:16:00Z'),'2026-09-11T22:00:00Z');
assert.equal(result.overdue,true);
assert.equal(marketClock(calendar,Date.parse('2026-09-21T22:00:00Z')),null);
assert.equal(marketClock(null,Date.now()),null);
console.log('Market-clock checks passed: weekend, post-close wait, pending scan, expired and absent calendar.');
