import test from'node:test';import assert from'node:assert/strict';
import{p033ModuleFrame,p033LiveFrame,P033_SCENARIOS}from'../src/nms-l02-p033-frame-v1';
import{P033_FEEDBACK_IR as IR}from'../src/generated/nms-l02-p033-feedback-ir-v1';
import{p033Initial,p033Advance,p033Answer}from'../src/nms-l02-p033-state-v1';
test('all20 authored domains and552frames are independently queryable without executing AS',()=>{
 let queries=0,total=0;assert.equal(Object.keys(IR.domains).length,20);
 for(const[domain,d]of Object.entries(IR.domains)){total+=d.frameCount;for(let frame=1;frame<=d.frameCount;frame++)for(const lang of['en','es']as const)for(const scenario of P033_SCENARIOS){
 const frameDomain=domain==='root'?'root':'sprite-'+domain;const s=p033ModuleFrame(frame,{frame,frameDomain,lang,scenario:scenario.id,seed:37,replay:2});assert.equal(s.frame,frame);assert.equal(s.domain,domain);assert.equal(s.seed,37);assert.equal(s.replay,2);assert.equal(s.queryKind,'source-local-inspection');assert.equal(s.rootFrame,domain==='root'?frame:6);queries++;
 }}assert.equal(total,552);assert.equal(queries,4416);
});
test('live feedback retains real attempts and state while dormant domains remain explicit inspection',()=>{
 let s=p033Advance(p033Initial(0),130);s=p033Answer(s,0);const frame=p033LiveFrame(s,'en');assert.equal(frame.session,s);assert.equal(frame.queryKind,'live-state');assert.equal(frame.mainFrame,130);assert.equal(frame.domain,'94');
 for(const domain of['112']){const f=p033ModuleFrame(12,{frame:12,frameDomain:'sprite-'+domain,lang:'en',scenario:'source-hundredths-quiz',seed:0});assert.equal(f.session.branch,null);assert.equal(f.session.domain,domain);}
});
test('frame identity rejects cross-domain and invalid range/context',()=>{
 const c={frame:1,frameDomain:'sprite-221',lang:'en' as const,scenario:'source-hundredths-quiz',seed:0};assert.throws(()=>p033ModuleFrame(2,c));assert.throws(()=>p033ModuleFrame(1,{...c,frameDomain:'221'}));assert.throws(()=>p033ModuleFrame(1,{...c,scenario:'unknown'}));assert.throws(()=>p033ModuleFrame(1,{...c,rootFrame:1}));assert.throws(()=>p033ModuleFrame(299,{...c,frame:299}));
});
