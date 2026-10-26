import assert from'node:assert/strict';import test from'node:test';
import{P039_FRAME_DOMAINS,P039_SCENARIOS,p039ModuleFrame,p039LiveFrame}from'../src/nms-l02-p039-frame-v1';
import{p039TextSnapshot}from'../src/nms-l02-p039-text-v1';
import{p039Initial,p039Advance,p039Submit,p039SetPercent,p039CloseWrong}from'../src/nms-l02-p039-state-v1';
const query=(frame:number,scenario='source-practice',frameDomain='sprite-237',seed=0,replay=0)=>p039ModuleFrame(frame,{frame,scenario,frameDomain,seed,replay,lang:'en'});
test('all declared visual frame/scenario/language/seed combinations preserve identity and immutable state',()=>{
 let count=0;for(const[domain,length]of Object.entries(P039_FRAME_DOMAINS))for(const scenario of P039_SCENARIOS)for(const lang of ['en','es']as const)for(let seed=0;seed<4;seed++)for(let frame=1;frame<=length;frame++){
  const result=p039ModuleFrame(frame,{frame,frameDomain:domain,scenario:scenario.id,lang,seed,replay:3});count++;
  assert.equal(result.frame,frame);assert.equal(result.frameDomain,domain);assert.equal(result.rootFrame,domain==='root'?frame:6);assert.equal(result.state.seed,seed);assert.equal(result.state.replay,3);assert.equal(result.mainFrame===null,domain==='root'&&frame<6);assert(Object.isFrozen(result)&&Object.isFrozen(result.state));assert.equal(result.queryKind,'source-local-inspection');const text=p039TextSnapshot(result);assert.equal(text.status,'ready');if(result.mainFrame===null)assert(text.blocks.every(b=>!b.visible));
 }assert.equal(count,36792);
});
test('main hold scenarios retain correct, retry and qualified correction semantics',()=>{
 assert.equal(query(546).state.enabled,true);
 assert.equal(query(546,'correct-25').state.correctFrame,2);
 assert.equal(query(546,'wrong-first').state.percent,50);
 assert.equal(query(546,'wrong-first').state.tries,1);
 assert.equal(query(546,'retry').state.enabled,true);
 assert.equal(query(546,'reset-after-wrong').state.percent,0);
 assert.equal(query(546,'reset-after-wrong').state.tries,1);
 assert.equal(query(546,'wrong-second').state.percent,75);
 assert.equal(query(546,'wrong-second').state.tries,2);
 assert.equal(query(546,'corrected-reveal-25').state.percent,25);
 assert.equal(query(546,'corrected-reveal-25').state.revealFrame,2);
 for(const scenario of P039_SCENARIOS){const end=query(579,scenario.id);assert.equal(end.state.percent,25);assert.equal(end.state.mainFrame,579);assert(!end.state.mainPlaying);}
});
test('local child endpoints are post-action states, not fabricated absolute playthrough times',()=>{
 const reveal=query(35,'corrected-reveal-25','sprite-228');assert.equal(reveal.state.revealFrame,1);assert(reveal.state.mainPlaying);assert.equal(reveal.state.mainFrame,546);assert.equal(reveal.actionDisposition,'post-action-reset-child-1-resume-main');
 const correct=query(13,'correct-25','sprite-234');assert.equal(correct.state.correctFrame,13);assert(!correct.state.correctPlaying);assert(correct.state.mainPlaying);assert.equal(correct.state.mainFrame,546);
 const wrong=query(15,'wrong-second','sprite-227');assert.equal(wrong.state.popupFrame,15);assert(wrong.state.popupVisible);assert(!wrong.state.popupPlaying);assert.equal(wrong.state.tries,2);
 for(let f=1;f<=5;f++){const press=query(f,'source-practice','sprite-223');assert.equal(press.closePressFrame,f);assert(press.state.popupVisible);assert.equal(press.state.popupFrame,15);}
 assert.equal(query(1,'source-practice','sprite-228').state.correctedReveal,false);
});
test('live snapshots preserve actual interaction state and bad inspection identities fail closed',()=>{
 let state=p039Advance(p039Initial(3,2),545);state=p039Submit(p039SetPercent(state,75));state=p039CloseWrong(state);const live=p039LiveFrame(state,'es');assert.equal(live.state,state);assert.equal(live.queryKind,'live-state');assert.equal(live.language,'es');assert.equal(live.replay,2);
 for(const domain of ['sprite-230','sprite-236','__proto__','sprite-999'])assert.throws(()=>query(1,'source-practice',domain),/P039_QUERY_IDENTITY/);
 for(const frame of [0,580,1.5,NaN])assert.throws(()=>query(frame),/P039_QUERY_IDENTITY/);
 assert.throws(()=>query(1,'missing-scenario'),/P039_QUERY_IDENTITY/);assert.throws(()=>query(1,'source-practice','sprite-237',-1),/P039_IDENTITY/);
 assert.throws(()=>p039ModuleFrame(5,{frame:5,frameDomain:'root',rootFrame:6,scenario:'source-practice',seed:0,lang:'en'}),/P039_QUERY_IDENTITY/);
});
