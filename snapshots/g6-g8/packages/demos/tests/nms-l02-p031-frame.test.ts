import test from'node:test';import assert from'node:assert/strict';
import{p031ModuleFrame,p031LiveFrame,P031_SCENARIOS}from'../src/nms-l02-p031-frame-v1';
import{P031_FEEDBACK_IR as IR}from'../src/generated/nms-l02-p031-feedback-ir-v1';
import{p031Initial,p031Advance,p031Answer}from'../src/nms-l02-p031-state-v1';
test('all18 authored domains and605frames are independently queryable without executing AS',()=>{
 let queries=0,total=0;assert.equal(Object.keys(IR.domains).length,18);
 for(const[domain,d]of Object.entries(IR.domains)){total+=d.frameCount;for(let frame=1;frame<=d.frameCount;frame++)for(const lang of['en','es']as const)for(const scenario of P031_SCENARIOS){
 const frameDomain=domain==='root'?'root':'sprite-'+domain;const s=p031ModuleFrame(frame,{frame,frameDomain,lang,scenario:scenario.id,seed:37,replay:2});assert.equal(s.frame,frame);assert.equal(s.domain,domain);assert.equal(s.seed,37);assert.equal(s.replay,2);assert.equal(s.queryKind,'source-local-inspection');assert.equal(s.rootFrame,domain==='root'?frame:6);queries++;
 }}assert.equal(total,605);assert.equal(queries,4840);
});
test('live feedback retains real attempts and state while dormant domains remain explicit inspection',()=>{
 let s=p031Advance(p031Initial(0),146);s=p031Answer(s,0);const frame=p031LiveFrame(s,'en');assert.equal(frame.session,s);assert.equal(frame.queryKind,'live-state');assert.equal(frame.mainFrame,147);assert.equal(frame.domain,'157');
 for(const domain of['120','202']){const f=p031ModuleFrame(12,{frame:12,frameDomain:'sprite-'+domain,lang:'en',scenario:'source-tenths-quiz',seed:0});assert.equal(f.session.branch,null);assert.equal(f.session.domain,domain);}
});
test('frame identity rejects cross-domain and invalid range/context',()=>{
 const c={frame:1,frameDomain:'sprite-242',lang:'en' as const,scenario:'source-tenths-quiz',seed:0};assert.throws(()=>p031ModuleFrame(2,c));assert.throws(()=>p031ModuleFrame(1,{...c,frameDomain:'242'}));assert.throws(()=>p031ModuleFrame(1,{...c,scenario:'unknown'}));assert.throws(()=>p031ModuleFrame(1,{...c,rootFrame:1}));assert.throws(()=>p031ModuleFrame(340,{...c,frame:340}));
});
