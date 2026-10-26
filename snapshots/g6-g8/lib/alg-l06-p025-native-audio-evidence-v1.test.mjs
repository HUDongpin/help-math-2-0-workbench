import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {validateP025NativeTrace} from './alg-l06-p025-native-audio-evidence-v1.mjs';
const file='output/playwright/alg-l06-p025-host-v3/sa-eof-return-en-v1-cli.txt';
const raw=fs.readFileSync(file,'utf8');
const trace=JSON.parse(raw.split('### Result\n')[1].split('\n### ')[0]).observer;
const copy=()=>structuredClone(trace);
const v4Observer=name=>{
 const raw=fs.readFileSync(`output/playwright/alg-l06-p025-host-v4/${name}-cli.txt`,'utf8');
 return JSON.parse(raw.split('### Result\n')[1].split('\n### ')[0]).observer;
};
const v4Trace=v4Observer('sa-eof-return-en-v1');
test('real native trace validates exact main and separate SA identity, retirement and natural EOF',()=>{
 const result=validateP025NativeTrace(trace);
 assert(result.naturalMainEof>=1);assert.equal(result.naturalSaEof,1);
 assert(result.starts>=4);
});
test('fresh v4 SA start permits two render quanta but rejects more than four',()=>{
 const result=validateP025NativeTrace(v4Trace);
 assert(result.naturalMainEof>=1);assert.equal(result.naturalSaEof,1);
 const t=structuredClone(v4Trace),sa=t.events.find(e=>e.kind==='source-start'&&
  e.args[1]===0);
 assert(sa);assert(Math.abs(sa.contextTime-sa.args[0]-2*128/48000)<1e-9);
 sa.args[0]=sa.contextTime-5*128/48000;
 assert.throws(()=>validateP025NativeTrace(t),/bounded native start scheduling/);
});
test('fresh v4 ES and lifecycle first-frame preroll allows one quantum of observer lag',()=>{
 for(const name of ['natural-glossary-es-v2','lifecycle-es-v2']){
  const original=v4Observer(name);
  assert(validateP025NativeTrace(original).naturalMainEof>=0,name);
  const first=original.events.find(e=>e.kind==='source-start'&&
   e.player.p025PlayerFrame==='1');
  assert(first);assert(Math.abs(first.args[0]-first.contextTime-
   (1/12-128/22050))<1e-8,name);
  for(const observedDelay of [1/12-5*128/22050,1/12+128/22050]){
   const t=structuredClone(original),start=t.events.find(e=>e.kind==='source-start'&&
    e.player.p025PlayerFrame==='1');
   start.args[0]=start.contextTime+observedDelay;
   assert.throws(()=>validateP025NativeTrace(t),/bounded first-frame preroll/,
    `${name} delay ${observedDelay}`);
  }
 }
});
test('wrong source, PCM, decode shape and first seek are rejected',()=>{
 for(const [field,value] of [['sourceSha256','0'.repeat(64)],['pcmSha256','0'.repeat(64)],['sampleRate',44100],['samples',547199],['channels',2]]){
  const t=copy();t.events.find(e=>e.kind==='decode-resolved')[field]=value;
  assert.throws(()=>validateP025NativeTrace(t),undefined,field);
 }
 const t=copy();const start=t.events.find(e=>e.kind==='source-start'&&e.player.p025PlayerFrame==='1');
 assert(start);start.args[1]=0;assert.throws(()=>validateP025NativeTrace(t));
});
test('early native EOF and unretired native source are rejected',()=>{
 const t=copy();t.events.find(e=>e.kind==='source-ended'&&e.hasHandler).contextTime-=1;
 assert.throws(()=>validateP025NativeTrace(t),/EOF callback/);
 const u=copy(),start=u.events.find(e=>e.kind==='source-start');
 u.events=u.events.filter(e=>!(['source-stop','source-disconnect','source-ended'].includes(e.kind)&&e.contextId===start.contextId&&e.nodeId===start.nodeId));
 assert.throws(()=>validateP025NativeTrace(u),/retired/);
});
test('manual stop or disconnect before source-ended cannot count as natural EOF',()=>{
 for(const kinds of [['source-stop'],['source-disconnect'],
  ['source-stop','source-disconnect']]){
  const t=copy(),ended=t.events.find(e=>e.kind==='source-ended'&&e.hasHandler&&
   t.events.some(start=>start.kind==='source-start'&&start.nodeId===e.nodeId&&
    start.contextId===e.contextId&&start.decodeId===1));
  assert(ended);const start=t.events.find(e=>e.kind==='source-start'&&
   e.nodeId===ended.nodeId&&e.contextId===ended.contextId);
  const premature=kinds.map((kind,i)=>({...structuredClone(start),kind,
   performanceMs:start.performanceMs+1000+i,contextTime:start.contextTime+1,args:[]}));
  t.events.splice(t.events.indexOf(ended),0,...premature);
  assert.throws(()=>validateP025NativeTrace(t),/premature manual retirement/,
   kinds.join('+'));
 }
});
test('unbound decoded node and future stop are rejected',()=>{
 const t=copy();t.events.find(e=>e.kind==='source-start').decodeId=999;
 assert.throws(()=>validateP025NativeTrace(t),/decoded node/);
 const u=copy(),stop=u.events.find(e=>e.kind==='source-stop');stop.args=[stop.contextTime+1];
 assert.throws(()=>validateP025NativeTrace(u),/future stop/);
});
