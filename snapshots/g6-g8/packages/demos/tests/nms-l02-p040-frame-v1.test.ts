import test from 'node:test';import assert from 'node:assert/strict';
import{p040ModuleFrame,P040_FRAME_DOMAINS,P040_SCENARIOS}from'../src/nms-l02-p040-frame-v1';
import type{RuntimeContext}from'../src/contract';
test('all domain/frame/language/scenario queries deterministic with correctrootentry',()=>{
 let queries=0;
 for(const[frameDomain,count]of Object.entries(P040_FRAME_DOMAINS))for(let frame=1;frame<=count;frame++)for(const lang of ['en','es']as const)for(const scenario of P040_SCENARIOS){
  const c={frame,frameDomain,lang,scenario:scenario.id,seed:0,replay:2}as RuntimeContext;const a=p040ModuleFrame(frame,c);assert.deepEqual(a,p040ModuleFrame(frame,c));assert.equal(a.rootFrame,frameDomain==='root'?frame:6);assert.equal(a.mainFrame,frameDomain==='root'?(frame<6?null:1):frame);assert.equal(a.state.playing,false);queries++;
 }assert.equal(queries,4500);
});
test('queryidentity and glossaryavailability failclosed',()=>{
 const c={frame:59,frameDomain:'sprite-43',lang:'en',scenario:'percent-glossary',seed:0}as RuntimeContext;
 assert.equal(p040ModuleFrame(59,c).termAvailable,false);assert.equal(p040ModuleFrame(60,{...c,frame:60}).termAvailable,true);
 for(const change of [{seed:-1},{seed:NaN},{replay:-1},{frameDomain:'sprite-13'},{rootFrame:1},{scenario:'invented'},{lang:'fr'}])assert.throws(()=>p040ModuleFrame(59,{...c,...change}as RuntimeContext),/QUERY_IDENTITY/);
});
