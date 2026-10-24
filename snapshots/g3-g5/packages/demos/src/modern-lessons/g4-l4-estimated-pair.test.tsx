import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {G4_L4_ESTIMATED_PAIR_CONFIGS as configs} from './generated/g4-l4-estimated-pair-config';
import {createEstimatedPairState as create,dispatchEstimatedPair as send,synchronizeEstimatedPairState as sync,bindEstimatedChildren as bind,observeEstimatedChild as observe,getEstimatedPairSnapshot as snapshot,EstimatedPairScene,type EstimatedPairState,type EstimatedPairConfig} from './g4-l4-estimated-pair';
import {G4_L4_IN022_TEXT_PRESENTATION as P1} from './g4-l4-in022';
import {G4_L4_TI006_TEXT_PRESENTATION as P2} from './g4-l4-ti006';
import {getCourseG04L04In022FrameState as frame1} from '../modules/course-g04-l04-in-022';
import {getCourseG04L04Ti006FrameState as frame2} from '../modules/course-g04-l04-ti-006';
const C=configs as readonly EstimatedPairConfig[];
type TestRuntime={-readonly[K in keyof AnimationRendererProps]:AnimationRendererProps[K]};
const runtime=(c:EstimatedPairConfig):TestRuntime=>({frame:c.holdFrame,frameDomain:c.frameDomain,rootFrame:6,lang:'en',scenario:'source-static-frame',seed:0,replay:0,onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true});
function child(c:EstimatedPairConfig,id:string,revision:number,frame:number,status:LessonTextActivitySnapshot['status']='playing'):LessonTextActivitySnapshot {
 const d=c.activities.find(a=>a.id===id)!;
 return {id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,revision,frame,status,cancellationToken:'child-token-'+revision};
}
function update(c:EstimatedPairConfig,s:EstimatedPairState,r:TestRuntime,a:LessonTextActivitySnapshot) {
 r.lessonActivities=[...(r.lessonActivities??[]).filter(x=>x.sourceInstanceId!==a.sourceInstanceId),a];return bind(c,s,r.lessonActivities);
}
test('own target suffixes keep four/six valid answers and all six distractors',()=>{
 const expected=[{'300':'Mc_Tar_1','400':'Mc_Tar_3','800':'Mc_Tar_4','1,000':'Mc_Tar_8'},{'500':'Mc_Tar_1','1,000':'Mc_Tar_2','700':'Mc_Tar_5','800':'Mc_Tar_7','1,100':'Mc_Tar_4','1,300':'Mc_Tar_8'}];
 C.forEach((c,i)=>{
  assert.equal(c.cards.length,8);assert.equal(c.required,i?6:4);
  assert.deepEqual(Object.fromEntries(c.cards.filter(card=>card.target).map(card=>[card.text,card.target])),expected[i]);
  const rows=i?{'Mc_Tar_2':'888 + 132','Mc_Tar_8':'591 + 686','Mc_Tar_4':'416 + 725','Mc_Tar_7':'976 – 242','Mc_Tar_1':'776 – 305','Mc_Tar_5':'812 – 97'}:{'Mc_Tar_3':'690 – 288','Mc_Tar_1':'802 – 498','Mc_Tar_8':'893 + 85','Mc_Tar_4':'489 + 318'};
  assert.deepEqual(Object.fromEntries(c.targets.map(t=>[t.id,t.problem])),rows);
  for(const target of c.targets){assert.match(target.problem!,/^\d.*[+–].*\d/);assert.equal(target.column,target.problem!.includes('+')?'Estimated Sum':'Estimated Difference');}
 });
});
test('every choice/target and outside drop distinguishes source targets from distractors',()=>{
 let tried=0,correct=0;
 for(const c of C)for(const card of c.cards)for(const target of [...c.targets.map(t=>t.id),null]){
  const r=runtime(c),s=send(c,create(),{type:'drop',card:card.id,target},r),yes=Boolean(card.target&&card.target===target);
  assert.equal(s.wrongOpen,!yes);assert.deepEqual(s.placed,yes?[card.id]:[]);assert.equal(s.phase,yes?'coach':'idle');assert.equal(s.children[0].id,yes?'estimated-coach':'estimated-wrong');assert.equal(s.attempts,1);tried++;correct+=Number(yes);
 }
 assert.equal(tried,96);assert.equal(correct,10);
});
test('correct coaches complete separately; only the last final terminal can advance once',()=>{
 for(const c of C){
  const r=runtime(c),requests:string[]=[],frames:unknown[]=[];r.onLessonActivityRequest=a=>{requests.push(a.id);return true;};r.onLessonFrameRequest=a=>{frames.push(a);return true;};let s=create(),revision=0;
  for(const card of c.cards.filter(card=>card.target)){
   s=send(c,s,{type:'select',card:card.id},r);assert.equal(s.selected,card.id);
   s=send(c,s,{type:'drop',target:card.target!},r);assert.equal(s.phase,'coach');assert.equal(s.placed.at(-1),card.id);
   const busy=s;assert.equal(send(c,s,{type:'select',card:c.cards[0].id},r),busy);assert.equal(send(c,s,{type:'help',open:true},r),busy);
   s=update(c,s,r,child(c,'estimated-coach',++revision,19));assert.equal(send(c,s,{type:'advance'},r),s);assert.equal(frames.length,0);
   s=update(c,s,r,child(c,'estimated-coach',revision,20,'completed'));s=send(c,s,{type:'advance'},r);
   assert.equal(s.phase,s.placed.length===c.required?'final':'idle');assert.equal(frames.length,0);
  }
  assert.deepEqual(requests,[...Array(c.required).fill('estimated-coach'),'estimated-final']);
  if(c.help){s=send(c,s,{type:'help',open:true},r);assert.equal(s.helpOpen,true);}
  s=update(c,s,r,child(c,'estimated-final',++revision,24));assert.equal(send(c,s,{type:'advance'},r),s);
  s=update(c,s,r,child(c,'estimated-final',revision,25,'completed'));s=send(c,s,{type:'advance'},r);assert.equal(s.phase,'continued');assert.equal(s.helpOpen,false);
  assert.deepEqual(frames,[{fromFrame:c.holdFrame,toFrame:c.holdFrame+1,stopFrame:c.frameCount}]);assert.equal(send(c,s,{type:'advance'},r),s);assert.equal(frames.length,1);
 }
});
test('Close leaves the wrong child owned; a new wrong restarts only that instance',()=>{
 for(const c of C){
  const r=runtime(c),card=c.cards.find(x=>!x.target)!;let s=send(c,create(),{type:'drop',card:card.id,target:null},r);
  s=update(c,s,r,child(c,'estimated-wrong',3,3));const owned=s.children;
  s=send(c,s,{type:'close-wrong'},r);assert.equal(s.wrongOpen,false);assert.equal(s.children,owned);assert.equal(observe(c,s,'estimated-wrong',r.lessonActivities!)!.frame,3);
  const valid=c.cards.find(x=>x.target)!;s=send(c,s,{type:'drop',card:valid.id,target:valid.target!},r);assert.equal(s.children.length,2);assert.equal(observe(c,s,'estimated-wrong',r.lessonActivities!)!.frame,3);
  s=update(c,s,r,child(c,'estimated-coach',4,20,'completed'));s=send(c,s,{type:'advance'},r);s=send(c,s,{type:'drop',card:card.id,target:null},r);
  assert.equal(s.children.filter(x=>x.id==='estimated-wrong').length,1);assert.equal(s.children.find(x=>x.id==='estimated-wrong')!.floor,3);assert.equal(observe(c,s,'estimated-wrong',r.lessonActivities!),undefined);
 }
});
test('rejected host effects and paused/foreign contexts cannot commit choices',()=>{
 for(const c of C){
  const card=c.cards.find(x=>x.target)!,s=create(),r=runtime(c),action={type:'drop',card:card.id,target:card.target!}as const;
  const invalid=[{paused:true},{frame:c.holdFrame-1},{frame:c.holdFrame+1},{frameDomain:'wrong'},{rootFrame:5},{lang:'es'},{scenario:'wrong'},{entryStateSha256:'capture'},{replay:1},{seed:1},{onLessonActivityRequest:()=>false},{onLessonActivityRequest:undefined}];
  for(const change of invalid)assert.equal(send(c,s,action,{...r,...change}as AnimationRendererProps),s);
 }
});
test('wrong child identity, stale revision, token drift and duplicate snapshots fail closed',()=>{
 for(const c of C){
  const r=runtime(c),card=c.cards.find(x=>x.target)!;let s=send(c,create(),{type:'drop',card:card.id,target:card.target!},r);const a=child(c,'estimated-coach',4,20,'completed');s=update(c,s,r,a);
  for(const change of [{id:'estimated-wrong'},{sourceInstanceId:'foreign'},{frameDomain:'sprite-0'},{revision:3},{revision:5},{revision:NaN},{frame:19,status:'completed'},{frame:21},{frame:20.5},{cancellationToken:'foreign'},{cancellationToken:undefined}]){
   const bad={...a,...change}as LessonTextActivitySnapshot;assert.equal(send(c,s,{type:'advance'},{...r,lessonActivities:[bad]}),s);
  }
  assert.equal(observe(c,s,'estimated-coach',[a,a]),undefined);
  assert.deepEqual(sync(c,s,{...r,replay:1},[a]),create(0,1));assert.deepEqual(sync(c,s,r,[]),create());
 }
});
test('source mask thresholds and IN022 color flashes survive native text binding',()=>{
 const [a,b]=C;const token=(c:EstimatedPairConfig,word:string)=>c.prompts.flatMap(p=>p.tokens).find(t=>t.text.trim()===word)!;
 const at=<T,>(curve:readonly(readonly[number,T])[],frame:number)=>{let v=curve[0][1];for(const [f,x]of curve){if(f>frame)break;v=x;}return v;};
 for(const [word,frame]of [['Drag',52],['estimated',63],['used.',168]]as const){const t=token(b,word);assert.equal(at(t.alpha,frame-1),0);assert(at(t.alpha,frame)>0);}
 for(const [word,first]of [['estimated',60],['Sum',98],['Difference',115]]as const){const t=token(a,word),base=at(t.color,first-1);assert.notEqual(at(t.color,first),base);assert.equal(at(t.color,first+1),base);assert.notEqual(at(t.color,first+2),base);assert.equal(at(t.color,first+3),base);}
 assert(a.prompts[0].tokens.map(t=>t.text).join('').includes('Sum or Estimated Difference'));
 assert.equal(a.scene.cursorSource,'/lesson-typography-v1/images/course-g04-l04-in-022/cursor.png');
});
test('snapshot checks exact source/runtime identity and all source frames remain renderable',()=>{
 const get=[frame1,frame2];C.forEach((c,i)=>{
  for(let frame=1;frame<=c.frameCount;frame++){
   const r={...runtime(c),frame},state=get[i](frame,r),snap=snapshot(c,state,r);assert.equal(snap.status,'ready');assert.equal(snap.blocks.length,c.blocks.length);
  }
  const r=runtime(c),state=get[i](r.frame,r);
  for(const change of [{sourceSwfSha256:'bad'},{animationId:'bad'},{status:'blocked'},{frame:r.frame-1},{seed:1},{frameDomain:'bad'},{rootFrame:5},{language:'es'}])assert.equal(snapshot(c,{...state,...change}as typeof state,r).status,'blocked');
  assert.equal(snapshot(c,state,{...r,entryStateSha256:'capture'}).status,'blocked');
 });
});
test('native markup carries actual arithmetic, source cursor and four help arrows without Canvas text',()=>{
 C.forEach((c,i)=>{
  const r=runtime(c),source=[frame1,frame2][i](r.frame,r),s=create(),snap=snapshot(c,source,r,s),html=renderToStaticMarkup(<EstimatedPairScene c={c} r={r} s={s} snapshot={snap} onAction={()=>{}}/>);
  assert(!html.includes('<canvas'));assert.equal((html.match(/data-estimated-card=/g)??[]).length,8);assert.equal((html.match(/data-estimated-target=/g)??[]).length,c.required);
  for(const target of c.targets)assert(html.includes('for '+target.problem));
  if(c.help){const help=send(c,s,{type:'help',open:true},r);const h=renderToStaticMarkup(<EstimatedPairScene c={c} r={r} s={help} snapshot={snapshot(c,source,r,help)} onAction={()=>{}}/>);assert(h.includes('role="dialog"'));assert.equal((h.match(/data-source-shape="90"/g)??[]).length,4);for(const n of ['197','416','200','400','600','788','398','800'])assert(h.includes('>'+n+'<'));}
 });
 assert.deepEqual([P1.playbackEndFrameByDomain,P2.playbackEndFrameByDomain],[{'sprite-83':159},{'sprite-100':168}]);
});
