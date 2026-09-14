import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSnapshot, comparePublication, publicationError} from '../app/publishedSnapshot.ts';
const item={symbol:'A',status:'INCOMPLETE',technical:{passed:false,bars:[],checks:[]},fundamentals:{passed:false,checks:[]},financials:{revenue:null},entry:{confirmation:[]},warnings:[],reasons:[]};
const valid={generatedAt:'2026-09-13T01:00:00Z',coverage:1,universe:['A'],errors:[],stocks:[item]};
assert.equal(validateSnapshot(valid),valid);
const partial={...valid,universe:['A','B'],errors:[{symbol:'B'}],retainedStocks:[{...item,symbol:'B'}]};
assert.equal(validateSnapshot(partial),partial);
for(const patch of [
 {stocks:[]},{generatedAt:'invalid'},{generatedAt:123},{generatedAt:'2026-09-13T01:00:00'},
 {stocks:[null]},{stocks:[{symbol:'A'}]},{stocks:[{...item,technical:{}}]},
 {stocks:[{...item,fundamentals:{passed:'false',checks:[]}}]},
 {stocks:[{...item,entry:{confirmation:{}}}]},{stocks:[{...item,warnings:'missing'}]},
 {stocks:[{...item,technical:{...item.technical,bars:[null]}}]},
 {stocks:[{...item,technical:{...item.technical,bars:[{date:'2026-09-11',close:null}]}}]},
 {dailyChanges:{}},{dailyChanges:[{symbol:'A',kinds:null,reasons:[]}]},
 {dailyChanges:[{symbol:'A',kinds:[],reasons:[],conditionChanges:[{label:'x',before:null,after:{}}]}]},
 {retainedStocks:[null]},{changeBaselineSymbols:{}},
 {coverage:2},{universe:['A','B']},{universe:['A','A']},
 {stocks:[item,item],coverage:2},{errors:[null]},
 {universe:['A','B'],errors:[{symbol:'A'}]},
 {universe:['A','B'],errors:[{symbol:'C'}]},
 {universe:['A','B','C'],errors:[{symbol:'B'},{symbol:'B'}]},
]) assert.throws(()=>validateSnapshot({...valid,...patch}),/更新資料不完整/);
assert.equal(comparePublication(null,valid),'new');
assert.equal(comparePublication(valid,{...valid}),'same');
assert.equal(comparePublication(valid,{generatedAt:'2026-09-13T02:00:00Z'}),'new');
assert.throws(()=>comparePublication(valid,{generatedAt:'2026-09-12T02:00:00Z'}));
assert.throws(()=>comparePublication(valid,{generatedAt:'invalid'}));
// Current published data, including legitimate missing financials, must remain readable.
const published=JSON.parse(readFileSync(new URL('../public/data/daily.json',import.meta.url),'utf8'));
assert.equal(validateSnapshot(published),published);
assert.ok(published.stocks.some(s=>s.status==='INCOMPLETE'));
console.log('Publication validation: partial success, structural corruption, coverage, duplicates and version order passed');

assert.equal(publicationError(new SyntaxError('Unexpected end of JSON input')),'更新資料格式錯誤，保留已載入的版本。');
for(const error of [new TypeError('Failed to fetch'),new Error('Internal server detail'),null,undefined,{message:'untrusted'}])
 assert.equal(publicationError(error),'暫時無法讀取更新，保留已載入的資料。');
assert.match(publicationError(null,true),/逾時/);
assert.match(publicationError(new Error('來源回傳較舊資料，保留目前版本。')),/較舊資料/);
