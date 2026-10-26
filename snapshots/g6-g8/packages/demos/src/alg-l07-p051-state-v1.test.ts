import test from'node:test';import assert from'node:assert/strict';
import{p051InitialState,p051Reduce,p051Controls,type P051State,type P051Action}from'./alg-l07-p051-state-v1';
const step=(s:P051State,a:Record<string,unknown>)=>p051Reduce(s,{...a,epoch:s.epoch}as P051Action);
function at(f:number){let s=step(p051InitialState(),{type:'play'});return step(s,{type:'advance',frame:f});}
test('P051 source 682 stop survives surplus time; declared 683 is never an automatic reachable frame',()=>{
 let s=at(681);assert.equal(s.playing,true);s=step(s,{type:'advance',frame:683});assert.equal(s.frame,682);assert.equal(s.playing,false);assert.equal(step(s,{type:'play'}),s);assert.equal(s.lessonCompleted,false);
});
test('P051 early unresolved L3 target and terminal L7 host handoff stay distinct for each selected level',()=>{
 for(const level of[1,2]){let s=at(6);s=step(s,{type:'select-level',level});s=step(s,{type:'start'});assert.equal(s.intent?.sourceStem,'L3GS03');assert.equal(s.intent?.targetAnimationId,null);assert.equal(s.intent?.level,level);s=step(s,{type:'navigation-result',serial:s.intent!.serial,accepted:false});assert.equal(s.unavailable,true);assert.equal(s.frame,6);
 s=step(s,{type:'skip'});s=step(s,{type:'start'});assert.equal(s.intent?.sourceStem,'L7GS03');assert.equal(s.intent?.targetAnimationId,'shared-alg001-l07-p052');assert.equal(s.intent?.level,level);}
});
test('P051 absent early text target has no visible error; held Mc_Msg appears then clears on rollout',()=>{
 let s=at(6);assert.equal(step(s,{type:'start'}),s);s=step(s,{type:'skip'});s=step(s,{type:'start'});assert.equal(s.message,true);s=step(s,{type:'start-roll-out'});assert.equal(s.message,false);
});
test('P051 early Repeat returns to source frame5 retaining selection; held Repeat opens a blocking native popup',()=>{
 let s=at(600);s=step(s,{type:'select-level',level:2});s=step(s,{type:'repeat'});assert.equal(s.frame,5);assert.equal(s.playing,true);assert.equal(s.level,2);s=step(s,{type:'skip'});s=step(s,{type:'repeat'});assert.equal(s.popup,true);assert.equal(p051Controls(s).enabled,false);assert.equal(step(s,{type:'select-level',level:1}),s);assert.equal(step(s,{type:'start'}),s);s=step(s,{type:'close-popup'});assert.equal(s.level,2);assert.equal(s.frame,682);
});
test('P051 alpha-zero entry, pause, replay, and leave are deterministic and reject stale callbacks',()=>{
 let s=p051InitialState();assert.equal(p051Controls(s).alpha,0);assert.equal(p051Controls(s).enabled,false);assert.equal(step(s,{type:'start'}),s);s=at(32);s=step(s,{type:'pause'});assert.equal(step(s,{type:'advance',frame:40}),s);s=step(s,{type:'select-level',level:1});const old=s;s=step(s,{type:'replay'});assert.equal(s.level,null);assert.equal(s.frame,1);assert.equal(s.replay,1);assert.equal(p051Reduce(s,{type:'advance',frame:682,epoch:old.epoch}),s);s=step(s,{type:'leave'});assert.equal(s.playing,false);assert.equal(step(s,{type:'play'}),s);
});
