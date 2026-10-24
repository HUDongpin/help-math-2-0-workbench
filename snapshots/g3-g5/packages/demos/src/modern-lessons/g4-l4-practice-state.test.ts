import fs from'node:fs';import{createHash}from'node:crypto';import assert from'node:assert/strict';import test from'node:test';
import{createPracticeState,synchronizePracticeState,proposePracticeAction,type PracticeConfig,type PracticeState}from'./g4-l4-practice-state';
const raw=JSON.parse(fs.readFileSync('work/typography-v1/g4-l4-practice-pair/controller-prep-r1/config.json','utf8'));
for(const page of raw.pages){
 const config=page as PracticeConfig;for(const r of[page.source,page.model]){const b=fs.readFileSync(r.path);assert.equal(b.length,r.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),r.sha256);}
 const context=(frame:number,seed=0,replay=0,paused=false)=>({frame,seed,replay,paused});
 const proof=(r:NonNullable<PracticeState['feedback']>)=>({...r.definition,frame:r.definition.endFrame,revision:r.revisionFloor+1,status:'completed'});
 test(page.animationId+' follows all four source holds and waits for both child clocks',()=>{
  let state=createPracticeState(context(1));
  for(const step of config.steps){const ctx=context(step.hold);state=synchronizePracticeState(config,state,ctx);assert.equal(proposePracticeAction(config,state,ctx,{type:'open-help'}),null);assert.equal(proposePracticeAction(config,state,ctx,{type:'choose',choice:'C',revisionFloor:-1}),null);
   if(step.box){assert.equal(proposePracticeAction(config,state,ctx,{type:'continue-step'}),null);const opened=proposePracticeAction(config,state,ctx,{type:'open-step',revisionFloor:4})!;assert.deepEqual(opened.request,{kind:'activity',id:step.box.id,parentFrame:step.hold});state=opened.state;assert.equal(proposePracticeAction(config,state,ctx,{type:'close-step'}),null);const done=proof(state.box!);assert.equal(proposePracticeAction(config,state,ctx,{type:'activity-completed',proof:{...done,revision:4}}),null);assert.equal(proposePracticeAction(config,state,ctx,{type:'activity-completed',proof:{...done,frame:14}}),null);state=proposePracticeAction(config,state,ctx,{type:'activity-completed',proof:done})!.state;}
   const advanced=proposePracticeAction(config,state,ctx,{type:step.box?'close-step':'continue-step'})!;assert.deepEqual(advanced.request,{kind:'frame',transition:step.transition});assert.equal(proposePracticeAction(config,advanced.state,ctx,{type:'continue-step'}),null);state=advanced.state;}
 });
 for(let seed=0;seed<4;seed++)test(page.animationId+' correct branch '+(seed+1)+' requires exact activity completion',()=>{
  const ctx=context(config.finalFrame,seed);const initial=createPracticeState(ctx),chosen=proposePracticeAction(config,initial,ctx,{type:'choose',choice:'C',revisionFloor:8})!;assert.equal(chosen.state.feedback!.definition.id,'correct-'+(seed+1));assert.equal(proposePracticeAction(config,chosen.state,ctx,{type:'choose',choice:'A',revisionFloor:8}),null);const done=proof(chosen.state.feedback!);
  for(const wrong of[{...done,revision:8},{...done,sourceInstanceId:'wrong-instance'},{...done,frameDomain:'root'},{...done,frame:done.frame-1},{...done,status:'running'}])assert.equal(proposePracticeAction(config,chosen.state,ctx,{type:'activity-completed',proof:wrong}),null);
  assert.equal(proposePracticeAction(config,chosen.state,{...ctx,paused:true},{type:'activity-completed',proof:done}),null);const completed=proposePracticeAction(config,chosen.state,ctx,{type:'activity-completed',proof:done})!;assert.deepEqual(completed.request,{kind:'frame',transition:config.finalTransition});assert.equal(completed.state.wrongAttempts,0);
 });
 for(let seed=0;seed<3;seed++)test(page.animationId+' two wrong answers, help return, pause and Replay, seed '+seed,()=>{
  const ctx=context(config.finalFrame,seed);let state=createPracticeState(ctx);for(let attempt=0;attempt<2;attempt++){
   const chosen=proposePracticeAction(config,state,ctx,{type:'choose',choice:attempt?'D':'A',revisionFloor:attempt})!;assert.equal(chosen.state.feedback!.definition.id,'wrong-'+((seed+attempt)%3+1));assert.equal(proposePracticeAction(config,chosen.state,ctx,{type:'open-help'}),null);const done=proposePracticeAction(config,chosen.state,ctx,{type:'activity-completed',proof:proof(chosen.state.feedback!)})!;
   if(attempt===0){assert.equal(done.request,undefined);assert.equal(done.state.wrongAttempts,1);state=proposePracticeAction(config,done.state,ctx,{type:'open-help'})!.state;assert.equal(proposePracticeAction(config,state,ctx,{type:'choose',choice:'C',revisionFloor:1}),null);state=proposePracticeAction(config,state,ctx,{type:'close-help'})!.state;assert.equal(state.wrongAttempts,1);assert.equal(state.focus,'help');}
   else{assert.deepEqual(done.request,{kind:'frame',transition:config.finalTransition});state=done.state;}}
  assert.deepEqual(synchronizePracticeState(config,state,context(1,seed,1)),createPracticeState(context(1,seed,1)));
 });
 test(page.animationId+' rejected host request cannot consume a wrong attempt',()=>{
  const ctx=context(config.finalFrame),state=createPracticeState(ctx),snapshot=structuredClone(state);const a=proposePracticeAction(config,state,ctx,{type:'choose',choice:'A',revisionFloor:-1}),b=proposePracticeAction(config,state,ctx,{type:'choose',choice:'A',revisionFloor:-1});assert.deepEqual(a,b);assert.deepEqual(state,snapshot);assert.equal(state.wrongAttempts,0);assert.equal(proposePracticeAction(config,state,context(config.finalFrame,0,0,true),{type:'choose',choice:'A',revisionFloor:-1}),null);
 });
}
