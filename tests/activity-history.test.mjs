import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const source = new URL('../app/ActivityHistory.tsx', import.meta.url);
const compiled = ts.transpileModule(fs.readFileSync(source,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const mod={exports:{}};
new Function('module','exports','require',compiled)(mod,mod.exports,createRequire(source));
const {ActivityHistory,SavedActivity}=mod.exports;
const history={version:1,methodVersion:'2.0.0',startedAt:'2026-09-12T00:00:00Z',updatedAt:'2026-09-13T00:00:00Z',days:[{date:'2026-09-12',observed:['AAA'],unavailable:[]}],events:[
{symbol:'AAA',scanDate:'2026-09-12',detectedAt:'2026-09-12T00:00:00Z',kinds:['DUAL_ADDED'],previousStatus:'QUALITY',status:'READY',priceDate:'2026-09-11',reasons:['趨勢通過'],conditionChanges:[{key:'trend:alignment',label:'均線排列',before:{key:'alignment',value:100,status:'fail'},after:{key:'alignment',value:110,status:'pass',detail:'價格高於均線'}}]},
{symbol:'BBB',scanDate:'2026-09-12',detectedAt:'2026-09-12T00:00:00Z',kinds:['DUAL_LOST'],previousStatus:'READY',status:'QUALITY',reasons:[]}]};
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));
const html=render(ActivityHistory,{history,symbols:['AAA'],today:'2026-09-13',go:()=>{}});
assert.match(html,/新通過兩階段/); assert.match(html,/均線排列/); assert.doesNotMatch(html,/BBB/);
const expired=render(ActivityHistory,{history,symbols:['AAA'],today:'2026-10-20',go:()=>{}});
assert.match(expired,/目前尚無已記錄/); assert.doesNotMatch(expired,/均線排列/);
const saved=render(SavedActivity,{saved:['AAA'],changes:history.events,fresh:true,stocks:[{symbol:'AAA',status:'READY'}],errors:[],go:()=>{}});
assert.match(saved,/新通過兩階段/); assert.doesNotMatch(saved,/BBB/);
const waiting=render(SavedActivity,{saved:['AAA'],changes:[],fresh:false,stocks:[],errors:[],go:()=>{}});
assert.match(waiting,/尚未收到今天/);
console.log('Activity history checks passed: scoped events, condition evidence, rolling window and unconfirmed day.');
