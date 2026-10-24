import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {IN004_FEEDBACK_TIMELINES as defs,IN004_FRAME_CONTROL as control,createIn004Session,synchronizeIn004Session,bindIn004Children,dispatchIn004} from './g4-l4-in004-host-state';
import {beginSourceClockActivities,advanceSourceActivities,sourceActivitiesAtParentFrame} from '../lesson-source-clock';
import {validateLessonTextActivities,validateLessonTextFrameControl,lessonTextActivityRequestAllowed,lessonTextFrameRequestAllowed} from '../lesson-text-frame-control';
const root=process.env.IN004_SOURCE_ROOT!;assert(root);
function harness(){let clock:any[]=[],revision=0,frame=470,s=createIn004Session(13);const events:any[]=[];
 const request=(rs:readonly any[])=>{const d=rs.map(r=>lessonTextActivityRequestAllowed(defs,r,{frame,capture:false,activities:clock}));if(d.some(v=>!v))return false;const n=beginSourceClockActivities(clock,d as any,revision+1);if(!n)return false;revision+=rs.length;clock=n.map(a=>({...a,cancellationToken:a.cancellationToken??'clock-'+a.revision}));events.push(rs);return true;};
 const runtime=()=>({frame,frameDomain:'sprite-207',rootFrame:6,lang:'en' as const,scenario:'source-static-frame',seed:13,replay:0,lessonActivities:clock,onLessonActivityRequest:(r:any)=>request([r]),onLessonActivitiesRequest:request,onLessonFrameRequest:(r:any)=>{if(!lessonTextFrameRequestAllowed(control,r,{frame,frameDomain:'sprite-207',capture:false}))return false;frame=r.toFrame;clock=sourceActivitiesAtParentFrame(clock,frame);events.push(r);return true;}});
 return {runtime,events,get state(){return s;},get clock(){return clock;},get frame(){return frame;},step(a:any,extra={}){s=synchronizeIn004Session(s,runtime(),clock);s=bindIn004Children(s,clock);s=dispatchIn004(s,a,{...runtime(),...extra});return s;},tick(ms:number){clock=advanceSourceActivities(clock,ms);},seek(n=frame){clock=[];frame=n;s=synchronizeIn004Session(s,runtime(),clock);},replace(v:any[]){clock=v;}};
}
test('host transitions and sibling identities bind own IN004 source lifetime and NewProblem gate',()=>{
 const f=path.join(root,'work/typography-v1/g4-l4-in004-number-line-practice/source-intake-r1.json'),b=readFileSync(f);assert.equal(createHash('sha256').update(b).digest('hex'),'fe883fd453cc24052c957410212bbd7a3caf6762683350e4ddbfd1a45a9e9fb2');const intake=JSON.parse(b.toString()),packed=readFileSync(path.join(root,intake.asset.path));assert.equal(createHash('sha256').update(packed).digest('hex'),intake.asset.sha256);const asset=JSON.parse(gunzipSync(packed).toString()),main=asset.timelines.find((t:any)=>t.timelineId==='sprite-207');
 for(const d of defs){const i=main.instances.find((i:any)=>i.instanceId===d.sourceInstanceId);assert(i);assert.equal(d.frameDomain,'sprite-'+i.characterId);assert.deepEqual(d.parentLifetime,{firstFrame:i.firstFrame,lastFrameExclusive:i.lastFrameExclusive});assert.deepEqual(d.parentFrames,[474,475,476,477,478,479,480,481,482]);}
 const button=main.instances.find((i:any)=>i.characterId===54);assert.equal(button.firstFrame,470);assert.equal(button.lastFrameExclusive,471);
 assert.match(intake.sections['DefineButton2_54/BUTTONCONDACTION on(release).as'],/gotoAndStop\("Q1"\)/);assert.match(intake.sections['DefineSprite_97/frame_25/DoAction.as'],/BtnNewProblem.enabled = true/);assert.doesNotMatch(intake.sections['DefineSprite_97/frame_25/DoAction.as'],/_parent.play/);
 validateLessonTextActivities(defs,483,12);validateLessonTextFrameControl(control,483);assert.equal(control.transitions.length,90);
});
test('intro starts the seeded authored draw only after host accepts; final25 enables next without parent play',()=>{
 const h=harness(),initial=h.state;assert.equal(h.step({type:'begin'},{onLessonFrameRequest:()=>false}),initial);assert.equal(h.frame,470);h.step({type:'begin'});assert(h.state.practice);const qframe=h.frame;h.step({type:'drop',card:'Mc_Jump_1',target:'Mc_NumLine'});h.tick(500);h.step({type:'drop',card:'Mc_Jump_3',target:'Mc_NumLine1'});assert.deepEqual(h.clock.map(a=>a.id),['in004-g4l4-coach','in004-g4l4-final']);h.tick(1500);h.step({type:'finish'});assert.equal(h.state.practice!.newProblemEnabled,false);h.tick(5*1000/12);h.step({type:'finish'});assert.equal(h.state.practice!.newProblemEnabled,true);assert.equal(h.frame,qframe);assert.equal(h.events.filter(e=>!Array.isArray(e)).length,1);h.step({type:'new-problem'});assert.equal(h.state.practice!.answer,'');assert.equal(h.state.practice!.newProblemEnabled,false);
});
test('feedback survives NewProblem inside its placement lifetime; hidden wrong panel does not cancel audio',()=>{
 const h=harness();h.step({type:'begin'});h.step({type:'drop',card:'Mc_Jump_1',target:'Mc_NumLine'});h.step({type:'drop',card:'Mc_Jump_3',target:'Mc_NumLine1'});h.tick(2000);h.step({type:'finish'});h.step({type:'drop',card:'Mc_Jump_2',target:null});const wrong=h.clock.find(a=>a.id.includes('wrong'));h.step({type:'new-problem'});assert.equal(h.clock.find(a=>a.id===wrong.id)?.revision,wrong.revision);assert.equal(h.clock.find(a=>a.id===wrong.id)?.status,'playing');h.step({type:'close-wrong'});assert.equal(h.state.practice!.wrongOpen,false);assert.equal(h.clock.find(a=>a.id===wrong.id)?.revision,wrong.revision);h.tick(2000);h.step({type:'finish'});assert.equal(h.state.practice!.newProblemEnabled,false,'previous final cannot finish the new question');
});
test('host rejection, paused actions and incomplete atomic siblings cannot move cards or consume draw',()=>{
 const h=harness();h.step({type:'begin'});h.step({type:'press',card:'Mc_Jump_1'});let before=h.state;assert.equal(h.step({type:'drop',target:'Mc_NumLine'},{onLessonActivityRequest:()=>false}),before);assert.equal(h.step({type:'drop',target:'Mc_NumLine'},{paused:true}),before);h.step({type:'drop',target:'Mc_NumLine'});h.step({type:'press',card:'Mc_Jump_3'});before=h.state;assert.equal(h.step({type:'drop',target:'Mc_NumLine1'},{onLessonActivitiesRequest:()=>false}),before);h.step({type:'drop',target:'Mc_NumLine1'});h.tick(2000);h.step({type:'finish'});before=h.state;assert.equal(h.step({type:'new-problem'},{onLessonFrameRequest:()=>false}),before);assert.equal(h.state.practice!.newProblemEnabled,true);
});
test('duplicate, stale, replaced and foreign completion tokens cannot enable a new problem',()=>{
 const h=harness();h.step({type:'begin'});h.step({type:'drop',card:'Mc_Jump_1',target:'Mc_NumLine'});h.step({type:'drop',card:'Mc_Jump_3',target:'Mc_NumLine1'});h.tick(2000);h.step({type:'press',card:'Mc_Jump_2'});const s=h.state,a=h.clock.find(a=>a.id==='in004-g4l4-final');
 for(const replacement of [{...a,sourceInstanceId:'foreign'},{...a,frameDomain:'sprite-91'},{...a,revision:a.revision+1},{...a,cancellationToken:'stale'},{...a,cancellationToken:undefined},{...a,frame:24},{...a,status:'playing'}]){const r={...h.runtime(),lessonActivities:h.clock.filter(v=>v!==a).concat(replacement)};assert.equal(dispatchIn004(s,{type:'finish'},r),s);}
 assert.equal(dispatchIn004(s,{type:'finish'},{...h.runtime(),lessonActivities:[...h.clock,a]}),s);
});
test('Replay and same-frame manual seek invalidate owned activity state; no invented continuation after seek',()=>{
 const h=harness();h.step({type:'begin'});h.step({type:'drop',card:'Mc_Jump_1',target:'Mc_NumLine'});h.step({type:'press',card:'Mc_Jump_3'});assert(h.state.practice!.placed.length);h.seek();assert.equal(h.state.practice,null);assert.equal(h.step({type:'drop',card:'Mc_Jump_3',target:'Mc_NumLine1'}).practice,null);assert.equal(synchronizeIn004Session(h.state,{...h.runtime(),replay:1}).replay,1);
});
