import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sourceModule from '../modules/course-g03-l06-ts-008';
import {G3_L6_TS008_SOURCE_DATA as SOURCE} from './generated/g3-l6-ts008-source-v1';
import {G3L6Ts008ModernRenderer,G3L6Ts008DecimalGrid,G3_L6_TS008_TEXT_PRESENTATION} from './g3-l6-ts008';
import {G3_L6_TS008_BINDING as BINDING,G3_L6_TS008_CHOICES as CHOICES,G3_L6_TS008_TRANSITIONS as EDGES,
 G3_L6_TS008_ACTIVITIES as ACTIVITIES,G3_L6_TS008_FEEDBACK as FEEDBACK,G3_L6_TS008_KEY_TERMS as TERMS,
 createG3L6Ts008Interaction as initial,reduceG3L6Ts008Interaction as reduce,synchronizeG3L6Ts008Interaction as sync,
 getG3L6Ts008FeedbackActivity as feedbackActivity,getG3L6Ts008Snapshot as snapshot,getG3L6Ts008TeachingState as teaching} from './g3-l6-ts008-state';
const root=new URL('../../../../',import.meta.url),hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const context=(frame:number,extras={})=>({frame,frameDomain:'sprite-366',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0,replay:0,...extras});
const asset=JSON.parse(gunzipSync(await readFile(new URL(`catalog/typography-v1/source-catalog/assets/${BINDING.sourceSwfSha256}.json.gz`,root))).toString());
const scripts=gunzipSync(await readFile(new URL('migrations/course-g03-l06-ts-008/audit/machine/ffdec-scripts.txt.gz',root))).toString();

test('paused React controls and completed feedback stay frozen until explicit resume',async()=>{
 const {JSDOM}=await import('jsdom'),{createRoot}=await import('react-dom/client'),{act}=await import('react');
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/',pretendToBeVisual:true});
 const prior=new Map<string,PropertyDescriptor|undefined>();
 for(const [name,value]of Object.entries({window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,
  HTMLButtonElement:dom.window.HTMLButtonElement,Node:dom.window.Node,navigator:dom.window.navigator,IS_REACT_ACT_ENVIRONMENT:true})){
  prior.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 }
 // Only provide missing DOM dialog APIs. This is a React handler test, not layout or browser evidence.
 dom.window.HTMLDialogElement.prototype.show=function(){this.setAttribute('open','');};
 const doc=dom.window.document,mounted=createRoot(doc.getElementById('root')!);
 let frame=799,paused=true,replay=0,activity:Parameters<typeof feedbackActivity>[1];
 const transitions:unknown[]=[],requests:Array<{id:string;parentFrame:number}>=[];
 const render=async()=>act(async()=>{mounted.render(<G3L6Ts008ModernRenderer {...context(frame,{replay})} paused={paused}
  lessonActivity={activity} onLessonFrameRequest={request=>{transitions.push(request);return true;}}
  onLessonActivityRequest={request=>{requests.push(request);return true;}}
  onLessonHostRequest={()=>undefined}/>);});
 const host=()=>doc.querySelector<HTMLElement>('[data-modern-lesson="g3-l6-ts008"]')!;
 const control=(label:string)=>[...doc.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===label)!;
 const click=async(button:HTMLButtonElement)=>act(async()=>{button.click();});
 const reset=async(nextFrame:number)=>{frame=nextFrame;replay++;paused=false;activity=undefined;transitions.length=0;requests.length=0;await render();};
 try{
  await render();
  for(const button of doc.querySelectorAll<HTMLButtonElement>('[data-answer-choice]')){assert.equal(button.disabled,true);await click(button);}
  assert.equal(control('Need More Help').disabled,true);await click(control('Need More Help'));
  assert.equal(host().dataset.helpState,'closed');assert.deepEqual(requests,[]);assert.deepEqual(transitions,[]);
  const term=doc.querySelector<HTMLButtonElement>('[data-keyterm-entry-id]')!;
  assert.equal(term.disabled,false);term.focus();assert.equal(doc.activeElement,term);
  paused=false;await render();await click(doc.querySelector<HTMLButtonElement>('[data-answer-choice="A"]')!);
  const wrong=ACTIVITIES.find(a=>a.id===requests.at(-1)!.id)!;
  paused=true;activity={id:wrong.id,frameDomain:wrong.frameDomain,frame:wrong.endFrame,revision:1,status:'completed'};await render();
  assert.equal(host().dataset.feedbackId,wrong.id);assert.equal(host().dataset.quizTryCount,'0');assert.deepEqual(transitions,[]);
  paused=false;await render();assert.equal(host().dataset.feedbackId,'');assert.equal(host().dataset.quizTryCount,'1');
  await render();assert.equal(host().dataset.quizTryCount,'1');
  await click(doc.querySelector<HTMLButtonElement>('[data-answer-choice="B"]')!);
  const right=ACTIVITIES.find(a=>a.id===requests.at(-1)!.id)!;
  paused=true;activity={id:right.id,frameDomain:right.frameDomain,frame:right.endFrame,revision:2,status:'completed'};await render();
  assert.equal(host().dataset.feedbackId,right.id);assert.deepEqual(transitions,[]);
  paused=false;await render();assert.deepEqual(transitions,[EDGES.find(e=>e.fromFrame===799)]);
  await render();assert.equal(transitions.length,1,'completed child must advance exactly once');
  for(const held of [329,467]){
   await reset(held);paused=true;await render();
   for(const label of ['Continue','Help']){assert.equal(control(label).disabled,true);await click(control(label));}
   assert.deepEqual(transitions,[]);paused=false;await render();await click(control('Continue'));
   assert.deepEqual(transitions,[EDGES.find(e=>e.fromFrame===held)]);
  }
  for(const [held,help]of [[582,'picture'],[688,'reasoning'],[799,'equivalent-decimals']]as const){
   await reset(held);await click(control(held===799?'Need More Help':'Help'));assert.equal(host().dataset.helpState,help);
   paused=true;await render();assert.equal(control('Close').disabled,true);await click(control('Close'));
   await act(async()=>{doc.querySelector('dialog')!.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));});
   assert.equal(host().dataset.helpState,help);assert.deepEqual(transitions,[]);
   paused=false;await render();await click(control('Close'));assert.equal(host().dataset.helpState,'closed');
   assert.deepEqual(transitions,held===799?[]:[EDGES.find(e=>e.fromFrame===held)]);
  }
 }finally{
  await act(async()=>mounted.unmount());dom.window.close();
  for(const [name,descriptor]of prior){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}
 }
});

test('exact L6 placement, source text and semantic private-use glyphs are source bound',async()=>{
 assert.equal(BINDING.placementId,'g03-l06-placement-053');assert.equal(BINDING.sourceSwfSha256,'3ca06d4ed72d9a53bdc1baeb7062dde1dcb5b1f7a8ba53171bc698da19dd0948');
 const ids=new Set(asset.textDefinitions.flatMap((t:any)=>[t.sourceTextId,...t.runs.map((r:any)=>r.sourceTextId)]));
 for(const block of BINDING.blocks){assert(block.sourceTextIds.length);for(const id of block.sourceTextIds)assert(ids.has(id),id);}
 for(const [char,code]of[[126,61520],[130,61519]]){const text=asset.textDefinitions.find((t:any)=>t.characterId===char);assert.equal(text.runs[0].fontId,125);assert.equal(text.runs[0].glyphs[0].code,code);}
 const evidence=JSON.parse(await readFile(new URL('work/typography-v1/source-audit/g3-l6-ts008/native-source-evidence.json',root),'utf8'));
 assert.equal(evidence.hostFunctions.sourceSha256,'30d7e3e88215796190e0bf50c7fab912ae7dde24f8d4093ef77f137ad03ac498');
 assert.match(evidence.hostFunctions.functions[0].text,/random\(3\)/);assert.match(evidence.hostFunctions.functions[1].text,/random\(4\)/);
});

test('the page title retains character 369 and its root-frame-6 source instance through all 816 main frames',()=>{
 const title=BINDING.blocks.find(b=>b.id==='root-title');
 assert.equal(BINDING.blocks.length,36);assert(title);
 assert.deepEqual(title.sourceTextIds,['character-369/run-0']);assert.equal(title.role,'title');assert.equal(title.readingOrder,0);
 const definition=asset.textDefinitions.find((d:any)=>d.characterId===369);
 assert.equal(definition.sourceTagSha256,'3d0cd3441ef3cd75bd7a1e6f8fded2652e217be33c54cb935e4ae2d5eb10dd5b');
 const sourceTitle=definition.runs.map((r:any)=>r.text).join('');assert.equal(sourceTitle,'Decimals & Money: Practice Test');
 const rootTimeline=asset.timelines.find((t:any)=>t.timelineId==='root');
 const placement=rootTimeline.instances.find((i:any)=>i.instanceId==='root/depth-395/generation-1');
 assert.deepEqual([placement.characterId,placement.firstFrame,placement.lastFrameExclusive],[370,6,11]);
 const placedBy=rootTimeline.events.find((e:any)=>e.eventId===placement.createdByEventId);
 assert.equal(placedBy.name.text,'Mc_Page_Title');assert.equal(placedBy.sourceTagSha256,'d9d751426669da5600840cccf33ed017a0190176c73cb4b2e635f8ed4b90ab84');
 const titleTimeline=asset.timelines.find((t:any)=>t.timelineId==='sprite-370');
 assert.equal(titleTimeline.declaredFrameCount,1);
 assert.deepEqual(titleTimeline.instances.map((i:any)=>[i.characterId,i.firstFrame,i.lastFrameExclusive]),[[369,1,2]]);
 for(let frame=1;frame<=816;frame++){
  const ctx=context(frame),s=snapshot(sourceModule.getFrameState(frame,ctx),ctx);
  assert.equal(s.status,'ready',`frame ${frame}`);assert.equal(s.blocks.length,36);
  const titles=s.blocks.filter(b=>b.id==='root-title');assert.equal(titles.length,1);
  assert.equal(titles[0].text,sourceTitle);assert.equal(titles[0].visible,true,`frame ${frame}`);
 }
});
test('native title is a single heading before the question and stays hidden for invalid source context',()=>{
 for(const frame of[1,2,3,329,467,582,688,799,816]){
  const html=renderToStaticMarkup(<G3L6Ts008ModernRenderer {...context(frame)}/>);
  assert.equal((html.match(/data-lesson-text-block="root-title"/g)??[]).length,1,`frame ${frame}`);
  assert.match(html,/<h2\b[^>]*data-lesson-text-block="root-title"[^>]*>Decimals &amp; Money: Practice Test<\/h2>/);
  if(frame>=3)assert(html.indexOf('data-lesson-text-block="root-title"')<html.indexOf('data-lesson-text-block="question"'));
  assert(!html.includes('Add and Subtract Fractions: Test Skills'));
 }
 const ctx=context(799),state=sourceModule.getFrameState(799,ctx);
 for(const html of[
  renderToStaticMarkup(<G3L6Ts008ModernRenderer {...ctx} rootFrame={5} state={state}/>),
  renderToStaticMarkup(<G3L6Ts008ModernRenderer {...ctx} state={{...state,sourceSwfSha256:'0'.repeat(64)}}/>),
 ])assert(!html.includes('data-lesson-text-block="root-title"'));
});
test('equality and answer text retain their distinct main and Help source ownership',()=>{
 const expected:Record<string,number[]>={
  'model-equivalence':[113,114,115,116,118,119],'compare-A':[123,138,115,119,118,130,114],
  'compare-B':[124,118,119,126,114],'compare-C':[128,136,135,116,119,118,130,114],
  'compare-D':[129,134,132,116,133,119,118,130,114],'reasoning-answer':[165,169],
 };
 assert.equal(BINDING.blocks.length,36);assert.equal(BINDING.version,'g3-l6-ts008-modern-text-v1');
 for(const[id,characters]of Object.entries(expected))assert.deepEqual(BINDING.blocks.find(b=>b.id===id)?.sourceTextIds,
  characters.flatMap(character=>asset.textDefinitions.find((d:any)=>d.characterId===character).runs.map((r:any)=>r.sourceTextId)),id);
 for(const[character,text,tag]of[
  [114,'=','b9603ac4d882efd0db2505493159969106cf42c2f868fb7564b4977885ebee48'],
  [165,'The correct answer choice is B.','ee00ff7f61450dd57172a9e4e3bd7483529671c5ba7e643dfbe0672236120592'],
  [169,'The correct answer choice is B.','d8c23c62c520732aa92a8b6d6f895744de8fa749a07f2f8f28a1ea83d9311efa'],
 ]as const){
  const definition=asset.textDefinitions.find((d:any)=>d.characterId===character),generated=SOURCE.texts.find(d=>d.characterId===character)!;
  assert.equal(definition.sourceTagSha256,tag);assert.equal(generated.sourceTagSha256,tag);
  assert.equal(definition.runs.map((r:any)=>r.text).join(''),text);assert.equal(generated.runs.map(r=>r.text).join(''),text);
 }
 const timeline=(id:string)=>asset.timelines.find((t:any)=>t.timelineId===id);
 const instances=(id:string,character:number)=>timeline(id).instances.filter((i:any)=>i.characterId===character);
 const spans=(id:string,character:number)=>instances(id,character).map((i:any)=>[i.depth,i.firstFrame,i.lastFrameExclusive]);
 // Helper depths: model11, A64, B25, C54, D41; main: model215, A268, B229, C258, D245.
 assert.deepEqual(spans('sprite-148',114),[[11,1,26],[25,1,26],[41,1,26],[54,1,26],[64,1,26]]);
 assert.deepEqual(spans('sprite-366',114),[[215,583,817],[229,583,817],[245,583,817],[258,583,817],[268,583,817]]);
 // A/C/D use source '=' plus shape131's slash; B and the model retain plain equality.
 assert.equal(asset.shapeDefinitions.find((d:any)=>d.characterId===131).sourceTagSha256,'47e4b39f3f2d22d983cac5b3c381af2c0eee0b53c95925b86c330ce7be86c4a4');
 assert.equal(SOURCE.sourceShapes.find(d=>d.characterId===131)?.sourceTagSha256,'47e4b39f3f2d22d983cac5b3c381af2c0eee0b53c95925b86c330ce7be86c4a4');
 assert.deepEqual(spans('sprite-148',131),[[37,1,26],[50,1,26],[62,1,26]]);
 assert.deepEqual(spans('sprite-366',131),[[241,583,817],[254,583,817],[266,583,817]]);
 assert.deepEqual(spans('sprite-166',165),[[33,1,25]]);assert.deepEqual(spans('sprite-366',165),[]);
 assert.deepEqual(spans('sprite-366',169),[[212,689,817]]);assert.deepEqual(spans('sprite-166',169),[]);
 for(const[domain,character,tag]of[
  ['sprite-166',165,'52cb782f18b59e2c6703f7cf469dcd0514f5e2d8b74661aba7ad23b3d81b2c1c'],
  ['sprite-366',169,'cd3780259bd2da263eb68314845c02430630d4305c6da7122f8625a284b122b6'],
 ]as const){const i=instances(domain,character)[0];assert.equal(timeline(domain).events.find((e:any)=>e.eventId===i.createdByEventId).sourceTagSha256,tag);}
 const picture=reduce(initial(),582,{type:'open-help'}).nextState,reasoning=reduce(initial(),688,{type:'open-help'}).nextState;
 for(const[frame,interaction]of[[582,picture],[583,initial()]]as const){
  const ctx=context(frame),s=snapshot(sourceModule.getFrameState(frame,ctx),ctx,interaction);
  for(const id of['model-equivalence','compare-A','compare-B','compare-C','compare-D'])assert.equal(s.blocks.find(b=>b.id===id)?.visible,true);
  assert.equal(s.blocks.find(b=>b.id==='model-equivalence')?.text,'0.3 = 3/10 = 30/100');
  for(const id of['compare-A','compare-C','compare-D'])assert(s.blocks.find(b=>b.id===id)?.text.includes('≠'));
  assert(!s.blocks.find(b=>b.id==='compare-B')?.text.includes('≠'));
 }
 for(const[frame,interaction]of[[688,initial()],[688,reasoning],[689,initial()],[816,initial()]]as const){
  const ctx=context(frame),answer=snapshot(sourceModule.getFrameState(frame,ctx),ctx,interaction).blocks.find(b=>b.id==='reasoning-answer');
  assert.equal(answer?.visible,frame>=689||interaction.help==='reasoning');assert.equal(answer?.text,'The correct answer choice is B.');
 }
});
test('all four exact models preserve 0.3 equivalence and only B is correct',()=>{
 assert.deepEqual(CHOICES.map(c=>[c.letter,c.shaded,c.total]),[['A',3,100],['B',30,100],['C',1,10],['D',7,10]]);
 for(const choice of CHOICES){const result=reduce(initial(),799,{type:'answer',choice:choice.letter});assert.equal(result.allowed,true);assert.equal(result.nextState.feedback?.kind,choice.shaded/choice.total===0.3?'correct':'wrong');
  const body=scripts.match(new RegExp(`===== DefineButton2_${choice.buttonCharacter}/[^\\n]+=====\\n([\\s\\S]*?)(?=\\n=====|$)`))?.[1];
  assert.match(body!,choice.letter==='B'?/showRightFeed\(\)/:/showWrongFeed\(\)/);
 }
});
test('the five exact source stops and final frame are not borrowed from L1 TS008',()=>{
 assert.deepEqual(EDGES,[{fromFrame:329,toFrame:330,stopFrame:467},{fromFrame:467,toFrame:468,stopFrame:582},{fromFrame:582,toFrame:583,stopFrame:688},{fromFrame:688,toFrame:689,stopFrame:799},{fromFrame:799,toFrame:800,stopFrame:816}]);
 for(const edge of EDGES)assert.match(scripts,new RegExp(`DefineSprite_366/frame_${edge.fromFrame}/DoAction.as =====\\nstop\\(\\);`));
 assert.equal(G3_L6_TS008_TEXT_PRESENTATION.playbackEndFrameByDomain?.['sprite-366'],329);
 assert.equal(G3_L6_TS008_TEXT_PRESENTATION.reducedMotionFrameByDomain?.['sprite-366'],329);
 assert.equal(G3_L6_TS008_TEXT_PRESENTATION.frameControl?.completionFrame,816);
});
test('native visibility follows first positive source question and the authored step boundaries',()=>{
 assert.equal(teaching(2).question,false);assert.equal(teaching(3).question,true);
 for(const [key,frame]of[['step1',330],['step2',468],['step3',583],['step4',689]] as const){assert.equal(teaching(frame-1)[key],false);assert.equal(teaching(frame)[key],true);}
 const ctx=context(799),s=snapshot(sourceModule.getFrameState(799,ctx),ctx);assert.equal(s.status,'ready');assert.equal(s.blocks.find(b=>b.id==='root-title')?.visible,true);
 assert.equal(s.blocks.find(b=>b.id==='picture-answer')?.text,'The correct answer choice is B.');
});
test('source Help actions retain early continuation and distinct later popup behavior',()=>{
 for(const frame of[329,467]){const help=reduce(initial(),frame,{type:'open-help'});assert.equal(help.allowed,true);assert.equal(help.nextState.help,null);assert.equal(help.frameRequest?.toFrame,frame+1);}
 for(const [frame,kind]of[[582,'picture'],[688,'reasoning'],[799,'equivalent-decimals']] as const){
  const opened=reduce(initial(),frame,{type:'open-help'});assert.equal(opened.nextState.help,kind);assert.equal(opened.frameRequest,null);
  assert.equal(reduce(opened.nextState,frame,{type:'answer',choice:'B'}).allowed,false);
  const closed=reduce(opened.nextState,frame,{type:'close-help'});assert.equal(closed.nextState.help,null);assert.equal(closed.frameRequest?.toFrame??null,frame===799?null:frame+1);
 }
});
test('feedback uses only the 3 wrong and 4 correct source variants and exact child visibility',()=>{
 assert.deepEqual(FEEDBACK.map(f=>[f.id,f.sprite,f.visibleFrames]),[['wrong-1',213,[[4,26]]],['wrong-2',248,[[3,29]]],['wrong-3',224,[[7,25]]],['correct-1',312,[[13,26]]],['correct-2',328,[[12,25]]],['correct-3',260,[[5,25]]],['correct-4',340,[[3,24]]]]);
 for(const f of FEEDBACK){const seed=f.variant-1,answered=reduce(initial(seed),799,{type:'answer',choice:f.kind==='correct'?'B':'A',activityRevisionFloor:4});
  const activity={id:f.id,frameDomain:`sprite-${f.sprite}`,frame:f.visibleFrames[0][0],revision:5,status:'playing' as const};
  assert.equal(feedbackActivity(answered.nextState,activity).visible,true);assert.equal(feedbackActivity(answered.nextState,{...activity,revision:4}).matched,false);
  assert.equal(feedbackActivity(answered.nextState,{...activity,frame:f.endFrame,status:'completed'}).complete,true);
  assert.equal(feedbackActivity(answered.nextState,{...activity,frame:f.endFrame-1,status:'completed'}).complete,false);
 }
});
test('one wrong answer retries, two wrong answers continue, correct continues only after feedback',()=>{
 let state=reduce(initial(),799,{type:'answer',choice:'A'}).nextState;
 assert.equal(reduce(state,799,{type:'answer',choice:'B'}).allowed,false);
 let end=reduce(state,799,{type:'feedback-complete'});assert.equal(end.nextState.quizTryCount,1);assert.equal(end.frameRequest,null);
 state=reduce(end.nextState,799,{type:'answer',choice:'D'}).nextState;end=reduce(state,799,{type:'feedback-complete'});
 assert.equal(end.nextState.terminalOutcome,'two-wrong-continuation');assert.deepEqual(end.frameRequest,EDGES[4]);
 state=reduce(initial(),799,{type:'answer',choice:'B'}).nextState;end=reduce(state,799,{type:'feedback-complete'});assert.equal(end.nextState.terminalOutcome,'correct');assert.deepEqual(end.frameRequest,EDGES[4]);
});
test('Replay and seed changes reset state while pending edges block duplicate actions',()=>{
 const state=reduce(initial(3,1),329,{type:'continue'}).nextState;assert.equal(reduce(state,329,{type:'continue'}).allowed,false);
 assert.equal(sync(state,context(330,{seed:3,replay:1})).pendingFromFrame,null);
 assert.deepEqual(sync(state,context(329,{seed:3,replay:2})),initial(3,2));assert.deepEqual(sync(state,context(329,{seed:4,replay:1})),initial(4,1));
});
test('each source feedback audio asset retains exact bytes and source-frame bounds',async()=>{
 const receipt=JSON.parse(await readFile(new URL('work/typography-v1/source-audit/g3-l6-ts008/feedback-audio.json',root),'utf8'));
 assert.equal(receipt.assets.length,7);for(const activity of ACTIVITIES){const row=receipt.assets.find((r:any)=>r.id===activity.id);assert(row);assert.equal(hash(await readFile(new URL(row.path,root))),activity.audio?.sha256);
  assert.equal(activity.startFrame,2);assert.equal(activity.audio?.firstFrame,row.firstFrame);assert.equal(activity.audio?.lastFrame,row.lastFrame);assert.equal(row.decodeToEofPassed,true);assert.equal(row.audioEndedControlsCompletion,false);}
});
test('all 10 key terms match exact local definitions and source buttons',async()=>{
 const index=JSON.parse(await readFile(new URL('apps/web/public/generated/g4-grade-wide-keyterms-en.json',root),'utf8'));
 assert.equal(TERMS.length,10);for(const term of TERMS){assert.equal(index.entries.find((e:any)=>e.id===term.entryId).titles.en.toLowerCase(),term.sourceKey.toLowerCase());assert(scripts.includes(`_global.KeyAttribute = "${term.sourceKey}";`));}
});
test('native figures and equations contain no legacy Canvas or raster text',()=>{
 const html=renderToStaticMarkup(<G3L6Ts008ModernRenderer {...context(799)}/>);assert(!/<(?:canvas|img|image)\b/.test(html));assert.match(html,/<math/);assert.match(html,/pictorial model/);assert.match(html,/data-shaded="30"/);
 assert.equal((renderToStaticMarkup(<G3L6Ts008DecimalGrid shaded={3} total={100}/>).match(/fill="#9cc832"/g)??[]).length,3);
});
test('wrong source identity, companion domain and unsupported Spanish presentation fail closed',()=>{
 const ctx=context(799),state=sourceModule.getFrameState(799,ctx);assert.equal(snapshot({...state,sourceSwfSha256:'0'.repeat(64)},ctx).status,'blocked');
 assert.equal(snapshot(state,{...ctx,frameDomain:'sprite-148'}).status,'blocked');assert.equal(snapshot(state,{...ctx,lang:'es'}).status,'blocked');
 const html=renderToStaticMarkup(<G3L6Ts008ModernRenderer {...ctx} state={null}/>);assert.match(html,/data-presentation-status="blocked"/);
});
