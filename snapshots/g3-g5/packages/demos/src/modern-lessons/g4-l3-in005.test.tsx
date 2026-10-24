import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act,useState} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom') as {JSDOM:new(html:string,options?:{url?:string})=>{window:Window & typeof globalThis & {close():void}}};
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import type {AnimationRendererProps} from '../contract';
import {getCourseG04L03In005FrameState} from '../modules/course-g04-l03-in-005';
import {validateLessonTextActivities,validateLessonTextFrameControl,lessonTextFrameRequestAllowed,lessonTextActivityRequestAllowed} from '../lesson-text-frame-control';
import {beginSourceClockActivity,advanceSourceActivities,sourceActivitiesAtParentFrame,type SourceClockActivity} from '../lesson-source-clock';
import {G4_L3_IN005_SOURCE_DATA as SOURCE} from './g4-l3-in005-source.generated';
import {G4L3In005Presentation,G4L3In005ModernRenderer,G4_L3_IN005_TEXT_PRESENTATION,
 CARDS,TARGETS,createCourseG04L03In005OrderingState,reduceG4L3In005Ordering as reduce,placedCount,
 getG4L3In005TeachingState,getG4L3In005TextSnapshot,g4L3In005SessionIdentity,canInteractG4L3In005,planG4L3In005Action,admitG4L3In005Plan,
 newG4L3In005ActivityTicket,observeG4L3In005Activity,planG4L3In005CoachCompletion,isG4L3In005Complete,
 G4_L3_IN005_ACTIVITIES,G4_L3_IN005_TRANSITION,type OrderingState} from './g4-l3-in005';
const props=(extra:Partial<AnimationRendererProps>={}):AnimationRendererProps=>({frame:144,frameDomain:'sprite-80',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:42,replay:0,
 onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true,onLessonButtonActivityRequest:()=>true,onLessonHostRequest:()=>{},onLessonCompletionRequest:()=>true,...extra});
const sourceState=(runtime:AnimationRendererProps)=>getCourseG04L03In005FrameState(runtime.frame,runtime);
const normalDrop=(state:OrderingState,index:number)=>reduce(state,{type:'drop-card',cardId:CARDS[index]!.id,targetId:CARDS[index]!.targetId});
const nextReduced=(state:OrderingState,index:number)=>admitG4L3In005Plan(planG4L3In005Action(state,{type:'drop-card',cardId:CARDS[index]!.id,targetId:CARDS[index]!.targetId},{interactive:true,reducedMotion:true})!,props())!;
const asDom=(html:string)=>new JSDOM(html).window.document;

test('all 186 source addresses retain 47 exact mask states, conservative word gates and authored emphasis',()=>{
 assert.equal(SOURCE.frameRows.length,186);assert.equal(SOURCE.instruction.maskRows.length,47);
 for(let frame=1;frame<=186;frame++){
  const teaching=getG4L3In005TeachingState(frame),row=SOURCE.frameRows[frame-1]!;
  assert.equal(teaching.maskStateId,row[1]);assert.deepEqual(teaching.sourceMaskState,SOURCE.instruction.maskRows[row[1]]);
  assert.equal(teaching.instruction,SOURCE.instruction.wordRows.filter(w=>w[3]<=frame).map(w=>w[0]).join(' '));
  assert.equal(teaching.emphasisCharacterId,row[2]);
 }
 for(const [word,,firstInk,whole] of SOURCE.instruction.wordRows){assert.ok(whole-firstInk<=6);assert.ok(!getG4L3In005TeachingState(whole-1).instruction.endsWith(word));assert.ok(getG4L3In005TeachingState(whole).instruction.endsWith(word));}
 assert.equal(getG4L3In005TeachingState(1).instruction,'');assert.equal(getG4L3In005TeachingState(87).instruction,getG4L3In005TeachingState(129).instruction);
 assert.equal(getG4L3In005TeachingState(138).instruction,SOURCE.instruction.text.trim());
 assert.deepEqual([84,86,88,90].map(f=>getG4L3In005TeachingState(f).emphasizedEndpoint),Array(4).fill('least'));
 assert.deepEqual([91,96,101,106,111,116,121].map(f=>getG4L3In005TeachingState(f).emphasizedSlot),[1,2,3,4,5,6,7]);
 for(const bad of [0,187,1.5,NaN,Infinity])assert.throws(()=>getG4L3In005TeachingState(bad),RangeError);
});

test('the original answer reducer remains byte-identical and supplies all card/target mathematics',async()=>{
 const bytes=await readFile(new URL('../timelines/course-g04-l03-in-005-ordering-interaction.ts',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'cce7cb488f7643091a368e7c2c252f80adaa5f420f0225f7018477daa5e9d0e2');
 assert.deepEqual(CARDS.map(c=>c.numericValue),[0,9,-6,4,1,-5,-1]);
 assert.deepEqual(TARGETS.map(target=>CARDS.find(c=>c.targetId===target)!.numericValue),[-6,-5,-1,0,1,4,9]);
 assert.deepEqual(SOURCE.cards.map(c=>[c.cardId,c.value,c.targetId]),CARDS.map(c=>[c.id,c.numericValue,c.targetId]));
 assert.equal(SOURCE.cards.filter(c=>c.value<0).every(c=>c.minusProvenance?.includes('shape12')),true);
});

test('wrong and correct admission failures preserve the original state; Close does not retire hidden79',()=>{
 const before=createCourseG04L03In005OrderingState();
 for(const targetId of [CARDS[0]!.targetId,CARDS[1]!.targetId]){
  const plan=planG4L3In005Action(before,{type:'drop-card',cardId:CARDS[0]!.id,targetId},{interactive:true,reducedMotion:false})!;
  assert.equal(admitG4L3In005Plan(plan,props({onLessonActivityRequest:()=>false})),null);assert.equal(placedCount(before),0);
 }
 const wrong=planG4L3In005Action(before,{type:'drop-card',cardId:'Scr_1',targetId:'Mc_Tar_2'},{interactive:true,reducedMotion:false})!;
 assert.deepEqual(wrong.effect,{kind:'activity',id:'in005-wrong-popup'});
 const closed=planG4L3In005Action(wrong.next,{type:'close-wrong'},{interactive:true,reducedMotion:false})!;assert.equal(closed.effect,null);assert.equal(closed.next.outcome,'ready');
 const started=beginSourceClockActivity([],G4_L3_IN005_ACTIVITIES.find(a=>a.id==='in005-wrong-popup')!,1)!;
 const overlap=beginSourceClockActivity(started,G4_L3_IN005_ACTIVITIES.find(a=>a.id==='in005-correct-coach')!,2)!;
 assert.equal(overlap.length,2);assert.equal(overlap.find(a=>a.id==='in005-wrong-popup'),started[0]);
 assert.equal(advanceSourceActivities(overlap,200).find(a=>a.id==='in005-wrong-popup')!.status,'playing');
 assert.equal(sourceActivitiesAtParentFrame(overlap,145).length,0);
});

test('normal motion waits for correct47 frame20, then final67 frame25, and rejects stale or superseded revisions',()=>{
 let interaction=createCourseG04L03In005OrderingState(),activities:readonly SourceClockActivity[]=[];let revision=0;
 for(let index=0;index<7;index++){
  const ticket=newG4L3In005ActivityTicket(activities),plan=planG4L3In005Action(interaction,{type:'drop-card',cardId:CARDS[index]!.id,targetId:CARDS[index]!.targetId},{interactive:true,reducedMotion:false})!;
  interaction=admitG4L3In005Plan(plan,props())!;
  activities=beginSourceClockActivity(activities,G4_L3_IN005_ACTIVITIES[0]!,++revision)!;
  const early=advanceSourceActivities(activities,1499),done=advanceSourceActivities(activities,1500);
  assert.equal(observeG4L3In005Activity(ticket,early.find(a=>a.id==='in005-correct-coach'),'in005-correct-coach').completed,false);
  const observed=observeG4L3In005Activity(ticket,done.find(a=>a.id==='in005-correct-coach'),'in005-correct-coach');assert.equal(observed.completed,true);
  assert.equal(observeG4L3In005Activity({...observed.ticket,handled:true},done.find(a=>a.id==='in005-correct-coach'),'in005-correct-coach').completed,false);
  assert.equal(observeG4L3In005Activity(observed.ticket,{...done[0]!,revision:revision+100},'in005-correct-coach').completed,false);
  const completion=planG4L3In005CoachCompletion(interaction)!;
  if(index===6){assert.equal(admitG4L3In005Plan(completion,props({onLessonActivityRequest:()=>false})),null);assert.equal(interaction.outcome,'correct-feedback');}
  interaction=admitG4L3In005Plan(completion,props())!;activities=done;
  if(index===6){assert.deepEqual(completion.effect,{kind:'activity',id:'in005-complete-feedback'});activities=beginSourceClockActivity(activities,G4_L3_IN005_ACTIVITIES[1]!,++revision)!;}
 }
 assert.equal(interaction.outcome,'complete');assert.equal(isG4L3In005Complete(interaction,144),false);assert.equal(isG4L3In005Complete(interaction,185),false);assert.equal(isG4L3In005Complete(interaction,186),true);
 const final=activities.find(a=>a.id==='in005-complete-feedback')!;
 assert.equal(final.frame,2);assert.equal(advanceSourceActivities([final],23*1000/12-1)[0]!.frame,24);assert.equal(advanceSourceActivities([final],23*1000/12)[0]!.frame,25);
 const stale=newG4L3In005ActivityTicket(activities);assert.equal(observeG4L3In005Activity(stale,{...final,frame:25,status:'completed'},'in005-complete-feedback').completed,false);
});

function* permutations(values:number[]):Generator<number[]>{if(!values.length){yield [];return;}for(const value of values)for(const rest of permutations(values.filter(v=>v!==value)))yield[value,...rest];}
test('all 5040 reduced-motion orders use six admitted coach events and one atomic final parent effect',()=>{
 let count=0;
 for(const order of permutations([0,1,2,3,4,5,6])){
  let state=createCourseG04L03In005OrderingState();let activityCalls=0,frameCalls=0;
  for(const [position,index] of order.entries()){
   const plan=planG4L3In005Action(state,{type:'drop-card',cardId:CARDS[index]!.id,targetId:CARDS[index]!.targetId},{interactive:true,reducedMotion:true})!;
   const host=props({onLessonActivityRequest:()=>{activityCalls++;return true;},onLessonFrameRequest:edge=>{assert.deepEqual(edge,G4_L3_IN005_TRANSITION);frameCalls++;return true;}});
   if(position===6){assert.equal(admitG4L3In005Plan(plan,props({onLessonFrameRequest:()=>false})),null);assert.equal(state.outcome,'ready');assert.equal(placedCount(state),6);}
   state=admitG4L3In005Plan(plan,host)!;assert.equal(state.outcome,position===6?'complete':'ready');
  }
  assert.equal(activityCalls,6);assert.equal(frameCalls,1);assert.equal(placedCount(state),7);
  assert.equal(planG4L3In005Action(state,{type:'drop-card',cardId:'Scr_1',targetId:'Mc_Tar_1'},{interactive:true,reducedMotion:true}),null);count++;
 }
 assert.equal(count,5040);
});

test('snapshot admission rejects unsupported contexts and capture, pause and missing host controls cannot interact',()=>{
 const runtime=props(),state=sourceState(runtime);assert.equal(getG4L3In005TextSnapshot(state,runtime).status,'ready');
 for(const extra of [{lang:'es'},{frameDomain:'root'},{rootFrame:1},{scenario:'other'},{seed:43},{frame:143},{frame:NaN}] as Partial<AnimationRendererProps>[]){assert.equal(getG4L3In005TextSnapshot(state,props(extra)).status,'blocked');}
 for(const extra of [{paused:true},{entryStateSha256:'a'.repeat(64)},{entryStateSha256:'malformed-capture'},{onLessonActivityRequest:undefined},{onLessonFrameRequest:undefined},{onLessonButtonActivityRequest:undefined}]){const p=props(extra);assert.equal(canInteractG4L3In005(p,getG4L3In005TextSnapshot(state,p)),false);}
 assert.equal(g4L3In005SessionIdentity(props()),g4L3In005SessionIdentity(props({frame:186})));
 for(const extra of [{replay:1},{seed:43},{uiLanguage:'es'}] as Partial<AnimationRendererProps>[])assert.notEqual(g4L3In005SessionIdentity(props()),g4L3In005SessionIdentity(props(extra)));
 assert.deepEqual(G4_L3_IN005_TEXT_PRESENTATION.binding.blocks.find(b=>b.id==='instruction')!.sourceTextIds,Array.from({length:7},(_,run)=>`character-19/run-${run}`));
 assert.deepEqual(G4_L3_IN005_TEXT_PRESENTATION.binding.blocks.find(b=>b.id==='wrong')!.sourceTextIds,['character-78/run-0','character-78/run-1']);
 assert.deepEqual(G4_L3_IN005_TEXT_PRESENTATION.sourceTimelineAudioCues,SOURCE.decisions.sourceTimelineAudioCues);
 assert.equal(G4_L3_IN005_ACTIVITIES.filter(a=>a.audio).length,3);
 for(const activity of G4_L3_IN005_ACTIVITIES.filter(a=>a.audio))assert.equal(activity.audio!.offsetSeconds,1673/22050);
 const wrong=G4_L3_IN005_ACTIVITIES.find(a=>a.id==='in005-wrong-popup')!;
 assert.equal(wrong.audio!.firstFrame,1);assert.equal(wrong.startFrame,2);
 assert.ok(Math.abs((wrong.audio!.offsetSeconds!+1/12)*22050-3510.5)<1e-10);
 assert.equal(G4_L3_IN005_ACTIVITIES.find(a=>a.id==='in005-complete-feedback')!.audio,undefined);
 assert.equal(SOURCE.decisions.closeDownSourceRecord.recordIndex,10);assert.equal(SOURCE.decisions.closeDownSourceRecord.depth,7);
 assert.equal(G4_L3_IN005_ACTIVITIES.find(a=>a.id==='in005-close-down')!.sourceInstanceId,'root/animation_mc/animation/Pop1_mc/BtnClose/button-76/record-10');
});

test('actual native SSR exposes one surface, no early answers, exact glossary gates and retained solved targets through186',()=>{
 const fresh=createCourseG04L03In005OrderingState();
 for(const frame of [1,52,79,80,86,87,137,138,144]){
  const runtime=props({frame}),html=renderToStaticMarkup(<G4L3In005Presentation runtime={runtime} interaction={fresh} onAction={()=>{}}/>),doc=asDom(html);
  assert.equal(doc.querySelectorAll('[data-modern-text-page]').length,1);assert.equal(doc.querySelectorAll('canvas,foreignObject').length,0);
  assert.equal(doc.querySelectorAll('[data-source-target]').length,7);
  assert.deepEqual([...doc.querySelectorAll('[data-source-target]')].map(n=>n.getAttribute('aria-label')),Array.from({length:7},(_,i)=>`Position ${i+1}`));
  assert.equal(doc.querySelectorAll('[data-keyterm-entry-id]').length,Number(frame>=80)+Number(frame>=87)+Number(frame>=138));
  assert.equal(doc.querySelector('[data-lesson-text-block="instruction"]')!.textContent,getG4L3In005TeachingState(frame).instruction);
 }
 let solved=fresh;for(let i=0;i<7;i++)solved=nextReduced(solved,i);
 for(const frame of [145,185,186]){
  const doc=asDom(renderToStaticMarkup(<G4L3In005Presentation runtime={props({frame})} interaction={solved} onAction={()=>{}}/>));
  assert.equal(doc.querySelectorAll('.in005-modern__cards').length,0);assert.equal(doc.querySelectorAll('[data-source-target][data-placed="true"]').length,7);
  assert.deepEqual([...doc.querySelectorAll('[data-source-target]')].map(n=>n.textContent),['−6','−5','−1','0','1','4','9']);
 }
 const wrong=reduce(fresh,{type:'drop-card',cardId:'Scr_1',targetId:'Mc_Tar_2'}),doc=asDom(renderToStaticMarkup(<G4L3In005Presentation runtime={props()} interaction={wrong} onAction={()=>{}}/>));
 assert.equal(doc.querySelector('[role="alert"]')?.textContent,SOURCE.wrongFeedback);assert.equal(doc.querySelectorAll('[aria-modal]').length,0);assert.equal(doc.querySelectorAll('[data-keyterm-entry-id]:disabled').length,0);
 const capture=asDom(renderToStaticMarkup(<G4L3In005ModernRenderer {...props({entryStateSha256:'a'.repeat(64)})}/>));
 assert.equal(capture.querySelectorAll('[data-source-target] button,button[data-source-target],[data-keyterm-entry-id]').length,0);
});

async function withReactDom(run:(doc:Document,click:(selector:string)=>Promise<void>,render:(node:React.ReactNode)=>Promise<void>)=>Promise<void>){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/'}),prior=new Map<string,PropertyDescriptor|undefined>();
 for(const name of ['window','document','HTMLElement','HTMLButtonElement','Node','navigator','IS_REACT_ACT_ENVIRONMENT']){prior.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:(dom.window as unknown as Record<string,unknown>)[name]});}
 const root=createRoot(dom.window.document.getElementById('root')!);
 try{await run(dom.window.document,async selector=>{const element=dom.window.document.querySelector<HTMLButtonElement>(selector);assert.ok(element,selector);await act(async()=>{element.click();});},async node=>{await act(async()=>root.render(node));});}
 finally{await act(async()=>root.unmount());dom.window.close();for(const [name,descriptor] of prior){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}}
}

test('React committed state survives synchronous reduced-motion parent resume; rejection and duplicate actions cannot complete',async()=>{
 await withReactDom(async(doc,click,render)=>{
  let allowFinal=false,parentCalls=0,completionCalls=0,completionObserved:string|null=null;
  function Harness(){const[frame,setFrame]=useState(144);return <G4L3In005ModernRenderer {...props({frame,reducedMotion:true,onLessonFrameRequest:()=>{
   parentCalls++;if(!allowFinal)return false;flushSync(()=>setFrame(186));assert.equal(completionCalls,0,'old six-card React state cannot complete during host resume');return true;
  },onLessonCompletionRequest:()=>{completionCalls++;completionObserved=doc.querySelector('[data-in005-controller]')?.getAttribute('data-interaction-outcome')??null;return true;}})}/>;}
  await render(<Harness/>);
  for(let i=0;i<7;i++){await click(`[data-in005-focus-control="card-${CARDS[i]!.id}"]`);await click(`[data-in005-focus-control="target-${CARDS[i]!.targetId}"]`);}
  assert.equal(parentCalls,1);assert.equal(completionCalls,0);assert.equal(doc.querySelectorAll('[data-source-target][data-placed="true"]').length,6);
  allowFinal=true;await click(`[data-in005-focus-control="target-${CARDS[6]!.targetId}"]`);
  assert.equal(parentCalls,2);assert.equal(completionCalls,1);assert.equal(completionObserved,'complete');assert.equal(doc.querySelectorAll('[data-source-target][data-placed="true"]').length,7);
  await render(<Harness/>);assert.equal(completionCalls,1);assert.equal(parentCalls,2);
 });
});

test('React wrong Close remains nonmodal, returns focus and replay replaces only the owned session',async()=>{
 await withReactDom(async(doc,click,render)=>{
  const requests:string[]=[],host=props({onLessonActivityRequest:r=>{requests.push(r.id);return true;}});
  await render(<G4L3In005ModernRenderer {...host}/>);await click('[data-in005-focus-control="card-Scr_1"]');await click('[data-in005-focus-control="target-Mc_Tar_2"]');
  assert.equal(doc.activeElement?.getAttribute('data-in005-focus-control'),'close-wrong');assert.equal(doc.querySelectorAll('[data-keyterm-entry-id]:disabled').length,0);
  await click('[data-in005-focus-control="close-wrong"]');assert.equal(doc.activeElement?.getAttribute('data-in005-focus-control'),'card-Scr_1');assert.deepEqual(requests,['in005-wrong-popup']);
  await click('[data-in005-focus-control="card-Scr_1"]');await render(<G4L3In005ModernRenderer {...host} replay={1}/>);
  assert.equal(doc.querySelector('[aria-pressed="true"]'),null);assert.equal(doc.querySelectorAll('[data-source-target][data-placed="true"]').length,0);
 });
});

test('React normal feedback follows the shared child clock and only one admitted final continuation',async()=>{
 await withReactDom(async(doc,click,render)=>{
  let advance:(ms:number)=>void=()=>{},advanceParent:(frame:number)=>void=()=>{},repeat:()=>void=()=>{},activityCalls:string[]=[],parentCalls=0,completionCalls=0,revision=0,allowParent=false;
  function Harness(){const[frame,setFrame]=useState(144),[activities,setActivities]=useState<readonly SourceClockActivity[]>([]);
   advance=ms=>setActivities(old=>advanceSourceActivities(old,ms));repeat=()=>setActivities(old=>[...old]);advanceParent=next=>{setFrame(next);setActivities(old=>sourceActivitiesAtParentFrame(old,next));};
   return <G4L3In005ModernRenderer {...props({frame,lessonActivities:activities,onLessonActivityRequest:request=>{
    const def=G4_L3_IN005_ACTIVITIES.find(a=>a.id===request.id)!;activityCalls.push(request.id);const nextRevision=++revision;
    setActivities(old=>beginSourceClockActivity(old,def,nextRevision)!);return true;
   },onLessonFrameRequest:edge=>{parentCalls++;assert.deepEqual(edge,{fromFrame:144,toFrame:144,stopFrame:186});if(!allowParent)return false;setFrame(edge.toFrame);return true;},onLessonCompletionRequest:()=>{completionCalls++;return true;}})}/>;
  }
  await render(<Harness/>);
  for(let i=0;i<7;i++){
   await click(`[data-in005-focus-control="card-${CARDS[i]!.id}"]`);await click(`[data-in005-focus-control="target-${CARDS[i]!.targetId}"]`);
   assert.equal(doc.querySelector('[data-in005-controller]')!.getAttribute('data-interaction-outcome'),'correct-feedback');
   await act(async()=>advance(1499));assert.equal(doc.querySelector('[data-in005-controller]')!.getAttribute('data-interaction-outcome'),'correct-feedback');
   await act(async()=>advance(1));assert.equal(doc.querySelector('[data-in005-controller]')!.getAttribute('data-interaction-outcome'),i===6?'complete':'ready');
   await act(async()=>repeat());assert.equal(parentCalls,0);
  }
  assert.deepEqual(activityCalls,[...Array(7).fill('in005-correct-coach'),'in005-complete-feedback']);assert.equal(doc.querySelector('[data-lesson-text-block="complete"]')?.textContent,'Correct!!!');
  await act(async()=>advance(23*1000/12-1));assert.equal(parentCalls,0);assert.equal(completionCalls,0);
  await act(async()=>advance(1));assert.equal(parentCalls,1);assert.equal(completionCalls,0);
  allowParent=true;await act(async()=>repeat());assert.equal(parentCalls,2);assert.equal(completionCalls,0);
  await act(async()=>repeat());assert.equal(parentCalls,2,'accepted same-frame resume cannot be requested again');
  await act(async()=>advanceParent(145));assert.equal(doc.querySelectorAll('[data-source-target][data-placed="true"]').length,7);assert.equal(completionCalls,0);
  await act(async()=>advanceParent(185));assert.equal(completionCalls,0);await act(async()=>advanceParent(186));assert.equal(completionCalls,1);
  await act(async()=>repeat());assert.equal(parentCalls,2);assert.equal(completionCalls,1);
 });
});

test('React Close pointer Down/release owns sprite75 without turning the Close click into a full activity',async()=>{
 await withReactDom(async(doc,click,render)=>{
  const phases:{id:string;phase:string;token:string}[]=[];
  await render(<G4L3In005ModernRenderer {...props({onLessonButtonActivityRequest:r=>{phases.push(r);return true;}})}/>);
  await click('[data-in005-focus-control="card-Scr_1"]');await click('[data-in005-focus-control="target-Mc_Tar_2"]');
  const close=doc.querySelector<HTMLButtonElement>('[data-in005-focus-control="close-wrong"]')!;
  await act(async()=>{const down=new doc.defaultView!.MouseEvent('pointerdown',{bubbles:true,button:0,buttons:1});Object.defineProperty(down,'pointerId',{value:1});close.dispatchEvent(down);});
  assert.equal(phases.length,1);assert.equal(phases[0]!.id,'in005-close-down');assert.equal(phases[0]!.phase,'press');
  await act(async()=>close.dispatchEvent(new doc.defaultView!.MouseEvent('pointerup',{bubbles:true,button:0})));
  assert.equal(phases.length,2);assert.equal(phases[1]!.phase,'release');assert.equal(phases[1]!.token,phases[0]!.token);
  await click('[data-in005-focus-control="close-wrong"]');assert.equal(phases.length,2);
 });
});


test('actual shared admission validators accept exact same-frame resume and four declared source instances',()=>{
 const control=G4_L3_IN005_TEXT_PRESENTATION.frameControl!;
 assert.doesNotThrow(()=>validateLessonTextFrameControl(control,186));assert.doesNotThrow(()=>validateLessonTextActivities(G4_L3_IN005_ACTIVITIES,186,12));
 assert.equal(lessonTextFrameRequestAllowed(control,G4_L3_IN005_TRANSITION,{frame:144,frameDomain:'sprite-80',capture:false}),true);
 assert.equal(lessonTextFrameRequestAllowed(control,G4_L3_IN005_TRANSITION,{frame:144,frameDomain:'sprite-80',capture:true}),false);
 assert.equal(lessonTextFrameRequestAllowed(control,G4_L3_IN005_TRANSITION,{frame:145,frameDomain:'sprite-80',capture:false}),false);
 assert.equal(lessonTextFrameRequestAllowed(control,{fromFrame:144,toFrame:145,stopFrame:186},{frame:144,frameDomain:'sprite-80',capture:false}),false);
 for(const id of ['in005-correct-coach','in005-complete-feedback','in005-wrong-popup'])assert.equal(lessonTextActivityRequestAllowed(G4_L3_IN005_ACTIVITIES,{id,parentFrame:144},{frame:144,capture:false})?.id,id);
 assert.equal(lessonTextActivityRequestAllowed(G4_L3_IN005_ACTIVITIES,{id:'in005-close-down',parentFrame:144},{frame:144,capture:false}),undefined,'Down-only activity cannot be synthesized through an ordinary activity click');
});
