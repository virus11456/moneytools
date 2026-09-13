import assert from 'node:assert/strict';
import {conditionGap,remainingConditions} from '../app/conditionProgress.ts';
const stock={methodVersion:'2.0.0',financialCurrency:'USD'};
assert.match(conditionGap({key:'growth',value:.12,status:'fail'},stock),/3 個百分點/);
assert.match(conditionGap({key:'margin',value:0,status:'fail'},stock),/必須大於/);
assert.match(conditionGap({key:'ocf',value:0,status:'fail'},stock),/必須大於/);
assert.match(conditionGap({key:'revenue',value:90000000,status:'fail'},stock),/10,000,000 USD/);
assert.match(conditionGap({key:'revenue',value:90000000,status:'fail'},{...stock,financialCurrency:'EUR'}),/不直接比較/);
assert.match(conditionGap({key:'growth',value:null,status:'missing'},stock),/資料不足/);
assert.match(conditionGap({key:'growth',value:.12,status:'fail'},{...stock,methodVersion:'3'}),/本版本/);
assert.match(remainingConditions({status:'INCOMPLETE'}),/資料待確認/);
assert.match(remainingConditions({...stock,fundamentals:{passed:true},technical:{checks:[{status:'fail',label:'均線上升'}]}}),/技術面待確認 1 項/);
assert.match(remainingConditions({...stock,status:'APPROACHING',fundamentals:{passed:true},technical:{checks:[]},entry:{distance:.03,riskReward:1,confirmation:[{status:'fail'}]}}),/3 項/);

assert.match(conditionGap({key:'distance',value:.03},stock),/1 個百分點/);
assert.match(conditionGap({key:'distance',value:.02},stock),/範圍內/);
assert.match(conditionGap({key:'rr',value:null},stock),/資料不足/);
assert.match(conditionGap({key:'rr',value:2},stock),/已達/);

// Inclusive thresholds and strict positive gates must not be changed by formatting.
for (const [key, boundary] of [['growth',.15],['revenue',100000000],['liquidity',10000000],['volume',1],['rr',2]]) {
  assert.match(conditionGap({key,value:boundary},stock),/已達/);
  assert.match(conditionGap({key,value:boundary-.00001},stock),/尚差/);
}
for (const key of ['margin','ocf','fcf','ma50rise','ma200rise']) {
  assert.match(conditionGap({key,value:0},stock),/必須/);
  assert.match(conditionGap({key,value:-.01},stock),/必須/);
  assert.match(conditionGap({key,value:.000001},stock),/已/);
}
assert.match(conditionGap({key:'distance',value:.020000001},stock),/小於 0.0001 個百分點/);
assert.match(conditionGap({key:'rr',value:1.99999999},stock),/小於 0.0001/);
for (const value of [null,undefined,NaN,Infinity,'0']) {
  assert.match(conditionGap({key:'growth',value},stock),/資料不足/);
}
assert.match(conditionGap({key:'growth',value:.2,status:'missing'},stock),/資料不足/);
assert.match(conditionGap({key:'revenue',value:200000000},{...stock,financialCurrency:undefined}),/不直接比較/);

const zoneStock={...stock,entry:{zoneLow:95,zoneHigh:100},technical:{price:105}};
assert.match(conditionGap({key:'zone',value:102},zoneStock),/高於區間上緣 2 USD，尚未回測/);
assert.match(conditionGap({key:'zone',value:100},zoneStock),/已觸及/);
assert.match(conditionGap({key:'zone',value:94},{...zoneStock,technical:{price:95}}),/已守住/);
assert.match(conditionGap({key:'zone',value:93},{...zoneStock,technical:{price:94}}),/低於區間下緣 1 USD，尚未守住/);
assert.match(conditionGap({key:'zone',value:100},{...zoneStock,entry:{zoneLow:null,zoneHigh:100}}),/資料不足/);
const reclaimStock={...stock,technical:{bars:[{high:100},{high:102}]}};
assert.match(conditionGap({key:'reclaim',value:100},reclaimStock),/距該價位 0 USD，需收盤高於/);
assert.match(conditionGap({key:'reclaim',value:100.01},reclaimStock),/已站回/);
assert.match(conditionGap({key:'reclaim',value:101},{...stock,technical:{bars:[{close:99},{close:101}]}}),/資料不足/);
assert.match(remainingConditions({...stock,methodVersion:'3',status:'READY'}),/本版本/);
assert.match(remainingConditions({...stock,dataStatus:'retained',status:'READY'}),/資料待確認/);
assert.match(remainingConditions({...stock,status:'READY',fundamentals:{passed:true},technical:{checks:[]}}),/進場條件已符合/);
const entryStock={...stock,status:'APPROACHING',fundamentals:{passed:true},technical:{checks:[]},entry:{distance:.02,riskReward:2,confirmation:[{status:'fail'}]}};
assert.match(remainingConditions(entryStock),/待確認 1 項/);
assert.match(remainingConditions({...entryStock,entry:{...entryStock.entry,distance:.020000001,riskReward:1.99999999}}),/待確認 3 項/);
assert.match(remainingConditions({...entryStock,entry:{...entryStock.entry,riskReward:null}}),/報酬／風險待確認/);
console.log('Condition progress boundaries and missing-data tests passed');
