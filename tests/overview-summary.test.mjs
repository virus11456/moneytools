import assert from 'node:assert/strict';
import { overviewSummary } from '../app/overviewMetrics.ts';
const stock=(sector,passed,dualPass,status='WAIT')=>({sector,fundamentals:{passed},dualPass,status});
const value=overviewSummary([stock('Tech',true,true),stock('Tech',false,false,'INCOMPLETE'),stock(null,true,false)], [
 {symbol:'A',kinds:['FUNDAMENTAL_ADDED','DUAL_ADDED']},
 {symbol:'A',kinds:['DUAL_ADDED','CONDITIONS_CHANGED']},
 {symbol:'B',kinds:['DUAL_LOST','ENTRY_CHANGED']},
]);
assert.equal(value.added,1);assert.equal(value.lost,1);assert.equal(value.changed,2);
assert.deepEqual(value.sectors.find(s=>s.name==='Tech'),{name:'Tech',total:2,qualified:1,dual:1,incomplete:1});
assert.equal(value.sectors.find(s=>s.name==='Unknown').qualified,1);
assert.deepEqual(overviewSummary([],[]),{added:0,lost:0,changed:0,sectors:[]});
console.log('Overview: unique events, sector denominators, incomplete and unknown sectors passed');
