import assert from 'node:assert/strict';
import {AnalysisSession} from '../app/analysisSession.ts';
const row=(symbol,date='2026-09-13T03:00:00Z')=>({symbol,fetchedAt:date,status:'WAIT',fundamentals:{passed:false,checks:[]},technical:{passed:false,checks:[],bars:[]},financials:{},entry:{confirmation:[]},reasons:[],warnings:[]});
const pending=[];
const session=new AnalysisSession(()=>{},(url,options)=>new Promise(resolve=>pending.push({url,options,resolve})));
session.open('AAA',row('AAA'));assert.equal(pending.length,0);
const first=session.refresh();assert.match(pending[0].url,/refresh=1/);assert.equal(pending[0].options.cache,'no-store');
await session.refresh();assert.equal(pending.length,1);
session.open('BBB',row('BBB'));assert.ok(pending[0].options.signal.aborted);
pending[0].resolve({ok:true,json:async()=>row('AAA')});await first;assert.equal(session.state.stock.symbol,'BBB');
const second=session.refresh();pending[1].resolve({ok:false,json:async()=>({error:'限流'})});await second;
assert.equal(session.state.stock.symbol,'BBB');assert.match(session.state.error,/保留/);assert.equal(session.state.busy,false);
const third=session.refresh();pending[2].resolve({ok:true,json:async()=>row('BBB','2026-09-13T04:00:00Z')});await third;assert.equal(session.state.source,'query');
session.open('BBB',row('BBB'));assert.equal(session.state.stock.fetchedAt,'2026-09-13T04:00:00Z');
const fourth=session.refresh();pending[3].resolve({ok:true,json:async()=>row('BBB')});await fourth;assert.match(session.state.error,/更舊/);
const fifth=session.refresh();pending[4].resolve({ok:true,json:async()=>row('WRONG')});await fifth;assert.match(session.state.error,/格式/);
session.open('',null);assert.equal(session.state.stock,null);session.dispose();
console.log('Analysis session: race, deduplication, preservation and validation passed');
session.open('CCC',null);
session.open('CCC',row('CCC'));
pending[5].resolve({ok:false,json:async()=>({error:'限流'})});
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(session.state.stock.symbol,'CCC');assert.equal(session.state.busy,false);
session.dispose();

const bound=new AnalysisSession(()=>{},function() {
  assert.equal(this,globalThis,'browser fetch must retain its global receiver');
  return Promise.resolve({ok:true,json:async()=>row('DDD')});
});
bound.open('DDD',row('DDD'));await bound.refresh();assert.equal(bound.state.source,'query');bound.dispose();
bound.showScan(row('WRONG'));assert.equal(bound.state.source,'query');
bound.showScan(row('DDD'));assert.equal(bound.state.source,'scan');assert.equal(bound.state.stock.symbol,'DDD');

for (const payload of [null, {...row('EEE'), warnings: null}, {...row('EEE'), technical: {passed:'false',checks:[],bars:[]}}, {...row('EEE'), fetchedAt:'invalid'}]) {
  const old=row('EEE');
  const check=new AnalysisSession(()=>{},async()=>({ok:true,json:async()=>payload}));
  check.open('EEE',old);await check.refresh();
  assert.equal(check.state.stock,old);assert.equal(check.state.source,'scan');assert.match(check.state.error,/格式不完整/);check.dispose();
}
for (const [response, expected] of [
  [{ok:false,status:429,json:async()=>{throw new SyntaxError('HTML')}}, /次數過多/],
  [{ok:false,status:503,json:async()=>({error:'internal secret'})}, /暫時無法回應/],
  [{ok:true,json:async()=>{throw new SyntaxError('Unexpected token')}}, /格式錯誤/],
]) {
  const check=new AnalysisSession(()=>{},async()=>response);const old=row('EEE');
  check.open('EEE',old);await check.refresh();assert.equal(check.state.stock,old);assert.match(check.state.error,expected);assert.doesNotMatch(check.state.error,/HTML|secret|Unexpected/);check.dispose();
}
