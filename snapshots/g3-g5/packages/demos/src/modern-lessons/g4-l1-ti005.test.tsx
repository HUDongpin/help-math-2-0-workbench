import assert from'node:assert/strict';import{test}from'node:test';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';import{createRequire}from'node:module';import React,{act}from'react';import{renderToStaticMarkup}from'react-dom/server';import{createRoot}from'react-dom/client';
const{JSDOM}=createRequire(import.meta.url)('jsdom') as{JSDOM:new(html:string,options?:{url?:string})=>{window:Window&typeof globalThis&{close():void}}};
import{G4_L1_TI005_CONFIG as CONFIG,G4_L1_TI005_TEXT_PRESENTATION as CAP,G4_L1_TI005_TEXT_BINDING as BINDING,G4L1Ti005BaseTenModel,G4_L1_TI005_BUTTON_ACTIVITIES}from'./g4-l1-ti005';import{G4_L1_TI005_SOURCE_DATA as SOURCE}from'./generated/g4-l1-ti005-source-v1';import{createSixQuestionChoiceState,chooseSixQuestionChoiceAnswer,getSixQuestionChoiceSnapshot,getSixQuestionChoiceFeedback}from'./source-six-question-choice';import{validateLessonTextActivities,validateLessonTextFrameControl}from'../lesson-text-frame-control';
const root=new URL('../../../../',import.meta.url),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex'),ctx=(frame:number,seed=0)=>({frame,frameDomain:SOURCE.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed,replay:0});
function integerWords(input:string){const units:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};let group=0,total=0;for(const word of input.toLowerCase().split(/[\s,-]+/).filter(Boolean)){if(word==='and')continue;if(word==='hundred')group*=100;else if(word==='thousand'||word==='million'){total+=group*(word==='thousand'?1000:1000000);group=0;}else{assert(word in units,word);group+=units[word];}}return total+group;}
function value(text:string){if(text.includes('Base-ten blocks:'))return SOURCE.model.largeGrids+SOURCE.model.rods/10+SOURCE.model.smallUnits/100;if(text.includes('+'))return text.split('+').map(t=>Number(t.trim().replaceAll(',',''))).reduce((a,b)=>a+b,0);if(/^[\d,.]+$/.test(text))return Number(text.replaceAll(',',''));if(text.endsWith('hundredths')){const [whole,fraction]=text.slice(0,-'hundredths'.length).split(' and ');return integerWords(whole)+integerWords(fraction)/100;}return integerWords(text);}
test('TI005 binds exact source and preserves active/dormant media separation',async()=>{const e=JSON.parse(await readFile(new URL('work/typography-v1/g4-l1-ti005/source-evidence.json',root),'utf8'));assert.equal(hash(await readFile(new URL(e.sourcePath,root))),SOURCE.sourceSha256);assert.equal(hash(await readFile(new URL(e.pairedFla.path,root))),e.pairedFla.sha256);assert.equal(hash(await readFile(new URL(e.generated.path,root))),e.generated.sha256);assert.equal(e.audio.length,10);assert.equal(e.dormantAudio.length,2);for(const a of SOURCE.audio)assert.equal(hash(await readFile(new URL(a.path,root))),a.sha256);});
test('each row retains four original-position representations and source correct button identifies the unique value',()=>{assert.deepEqual(SOURCE.questions.map(q=>q.frame),[172,174,176,178]);assert.deepEqual(SOURCE.questions.map(q=>q.answers.findIndex(a=>a.correct)),[2,3,0,3]);for(const q of SOURCE.questions){assert.equal(q.answers.length,4);for(const a of q.answers)assert(Math.abs(value(a.text)-a.numericValue)<1e-8);const correct=q.answers.find(a=>a.correct)!;assert.equal(correct.sourceButton,53);assert(q.answers.filter(a=>!a.correct).every((a,_,rows)=>Math.abs(a.numericValue-rows[0].numericValue)<1e-8));for(const answer of q.answers.filter(a=>!a.correct))assert.notEqual(answer.numericValue,correct.numericValue);}});
test('the graphical fourth representation retains every countable 5/8/8 part without printing5.88',()=>{const markup=renderToStaticMarkup(<G4L1Ti005BaseTenModel/>);assert.equal((markup.match(/data-model-piece="whole"/g)??[]).length,5);assert.equal((markup.match(/data-model-piece="tenth"/g)??[]).length,8);assert.equal((markup.match(/data-model-piece="hundredth"/g)??[]).length,8);assert(!markup.includes('5.88'));assert(markup.includes('viewBox="0 0 232 164"'));const block=BINDING.blocks.find(b=>b.id==='answer-q2-choice-3')!;assert.deepEqual(block.sourceShapeIds,[297]);assert.deepEqual(block.sourceTextIds,[]);});
test('all257 source frames expose the proper row and whole-word instruction, not a flattened screenshot',()=>{for(let frame=1;frame<=257;frame++){const c=ctx(frame),view=getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(frame,c),c,createSixQuestionChoiceState(0,0,4));assert.equal(view.status,'ready',String(frame));const q=SOURCE.questions.find(q=>frame>=q.firstFrame&&frame<q.lastFrameExclusive);assert.deepEqual(view.blocks.filter(b=>b.role==='answer'&&b.visible).map(b=>b.id),q?q.answers.map(a=>`answer-${q.id}-${a.id}`):[]);assert(!view.blocks.some(b=>b.id.startsWith('help-')&&b.id!=='help-button'&&b.visible));}assert.equal(SOURCE.instructionFrames.at(-1)!.frame,160);assert.match(SOURCE.instructionFrames.at(-1)!.text,/three of the numbers.*different forms.*does not belong/);});
test('source 3/4 pools and unlimited wrong retries retain child22 explicitClose23 gate',()=>{for(const q of SOURCE.questions)for(const a of q.answers)for(let seed=0;seed<12;seed++){const state=chooseSixQuestionChoiceAnswer(CONFIG,createSixQuestionChoiceState(seed,0,4),q.frame,a.id)!;assert.equal(state.feedback!.parentFrame,q.frame);assert.equal(state.attempts.length,4);assert.equal(state.feedback!.id.startsWith('correct-'),a.correct);const branch=SOURCE.feedback.find(b=>b.id===state.feedback!.id)!;const activity={id:branch.id,sourceInstanceId:branch.sourceInstanceId,frameDomain:`sprite-${branch.sprite}`,revision:1,frame:branch.kind==='wrong'?22:branch.endFrame,status:'completed' as const};const result=getSixQuestionChoiceFeedback(CONFIG,state,[activity]);assert.equal(result.complete,branch.kind==='correct');if(branch.kind==='wrong')assert.equal(result.popup,true);assert.equal(chooseSixQuestionChoiceAnswer(CONFIG,state,q.frame,a.id),null);}let state=createSixQuestionChoiceState(0,0,4);for(let i=0;i<8;i++){state=chooseSixQuestionChoiceAnswer(CONFIG,state,172,'choice-1')!;state={...state,feedback:null};}assert.equal(state.attempts[0],8);});
test('source host stops main257 after the last real179..257 segment',async()=>{const e=JSON.parse(await readFile(new URL('work/typography-v1/g4-l1-ti005/source-evidence.json',root),'utf8'));assert.match(e.host.lastFrameStop,/_currentframe >= _root.animation_mc.animation._totalframes/);assert.match(e.host.lastFrameStop,/_root.animation_mc.animation.stop\(\)/);assert.deepEqual(CAP.frameControl!.transitions.at(-1),{fromFrame:178,toFrame:179,stopFrame:257});assert.equal(CAP.frameControl!.completionFrame,257);assert.equal(CAP.sourceTimelineAudioCues![0].frame,15);assert.equal(CAP.sourceTimelineAudioCues![0].endFrame,258);validateLessonTextFrameControl(CAP.frameControl!,257);validateLessonTextActivities(CAP.activityTimelines!,257,12);assert.equal(G4_L1_TI005_BUTTON_ACTIVITIES.length,11);assert.equal(new Set(G4_L1_TI005_BUTTON_ACTIVITIES.map(d=>d.sourceInstanceId)).size,11);});
test('source Help preserves equal standard, word and expanded forms',()=>{const c=ctx(172),view=getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(172,c),c,{...createSixQuestionChoiceState(0,0,4),help:true});const values=['help-standard-example','help-word-example','help-expanded-example'].map(id=>view.blocks.find(b=>b.id===id)!);assert(values.every(b=>b.visible));assert(values.every(b=>value(b.text)===123456));assert(!view.blocks.some(b=>b.role==='answer'&&b.visible));});
test('semantic renderer presents four choices, includes the SVG model only inrow2 and fails closed for bad state',()=>{const Renderer=CAP.Renderer!;for(const frame of[172,174,176,178]){const c=ctx(frame),markup=renderToStaticMarkup(<Renderer {...c} state={CONFIG.getFrameState(frame,c)}/>);assert.equal((markup.match(/class="six-choice-modern__answer"/g)??[]).length,4);assert.equal(markup.includes('data-model-piece="whole"'),frame===174);assert(!markup.includes('<canvas'));}const c=ctx(172),state=CONFIG.getFrameState(172,c);assert.equal(getSixQuestionChoiceSnapshot(CONFIG,state,{...c,lang:'es'}).status,'blocked');assert.equal(getSixQuestionChoiceSnapshot(CONFIG,state,{...c,frame:258}).status,'blocked');});

test('TI005 is admitted by the actual opt-in product loader with all21 source activities',async()=>{const{loadAnimationModuleForPresentation}=await import('../animation-registry');const module=await loadAnimationModuleForPresentation(SOURCE.animationId,{modernText:true});assert(module?.textPresentation);assert.equal(module.textPresentation.activityTimelines?.length,21);});


test('TI005 source29 title stays visible through introduction, all rows, Help, feedback, terminal and Replay',()=>{
 const title=SOURCE.sourceText.find(d=>d.characterId===29)!;
 assert.equal(title.kind,'static-text');assert.equal(title.sourceTagSha256,'2f0094129f2021c55c39f128eb2d1e8dbcad5ac48f25a4e0ef41a3fabd51c6f8');
 assert.equal(title.runs.map(r=>r.text).join(''),'Place Value: Try It!');
 assert.equal(SOURCE.rootFrame,6);assert.equal(BINDING.version,'g04-l01-placement-068-modern-equivalent-forms-v2');
 assert.equal(BINDING.blocks.length,38);assert.deepEqual(BINDING.blocks[0].sourceTextIds,['character-29/run-0']);assert.equal(BINDING.blocks[0].readingOrder,0);
 assert(!BINDING.blocks.some(b=>b.sourceTextIds.includes('character-27/run-0')));
 const Renderer=CAP.Renderer!;
 for(const frame of[1,2,10,18,160,172,174,176,178,179,257]){
  const context=ctx(frame),state=CONFIG.getFrameState(frame,context),view=getSixQuestionChoiceSnapshot(CONFIG,state,context);
  assert.equal(view.status,'ready');assert.equal(view.blocks.find(b=>b.id==='root-title')!.visible,true);
  const html=renderToStaticMarkup(<Renderer {...context} state={state}/>);assert.equal((html.match(/<h2\b/g)??[]).length,1);assert.match(html,/data-lesson-text-block="root-title">Place Value: Try It!<\/h2>/);
 }
 const context=ctx(172),state=CONFIG.getFrameState(172,context),base=createSixQuestionChoiceState(0,0,4),wrong=chooseSixQuestionChoiceAnswer(CONFIG,base,172,'choice-1')!;
 for(const session of[base,{...base,help:true},wrong])assert.equal(getSixQuestionChoiceSnapshot(CONFIG,state,context,session).blocks.find(b=>b.id==='root-title')!.visible,true);
 const replay={...ctx(1),replay:1};assert.equal(getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(1,replay),replay).blocks.find(b=>b.id==='root-title')!.visible,true);
});
test('TI005 title cannot bypass its actual root6 source-static identity gate',()=>{
 const context=ctx(172),state=CONFIG.getFrameState(172,context),Renderer=CAP.Renderer!;
 for(const bad of[{...context,rootFrame:1},{...context,lang:'es' as const},{...context,frameDomain:'root'},{...context,scenario:'product-candidate'},{...context,frame:258}]){
  assert.equal(getSixQuestionChoiceSnapshot(CONFIG,state,bad).status,'blocked');assert(!renderToStaticMarkup(<Renderer {...bad} state={state}/>).includes('data-lesson-text-block="root-title"'));
 }
});
test('choice-family consumers retain independent source title30 and authored exercise5 configurations',async()=>{
 const [{G4_L1_TI006_CONFIG:a,G4_L1_TI006_TEXT_PRESENTATION:ac},{G3_L1_TI006_CONFIG:b,G3_L1_TI006_TEXT_PRESENTATION:bc}]=await Promise.all([import('./g4-l1-ti006'),import('./g3-l1-ti006')]);
 for(const [config,cap]of[[a,ac],[b,bc]]as const){
  assert.deepEqual(config.binding.blocks.find(block=>block.role==='title')!.sourceTextIds,['character-30/run-0']);assert.equal(config.text[config.exerciseNumber!.blockId],'5');assert.equal(config.helpOpenActivityIds,undefined);
  for(const frame of[1,config.questions[0].frame]){const context={...ctx(frame),frameDomain:config.frameDomain,rootFrame:config.rootFrame},state=config.getFrameState(frame,context),Renderer=cap.Renderer!,html=renderToStaticMarkup(<Renderer {...context} state={state}/>);assert.equal(getSixQuestionChoiceSnapshot(config,state,context).status,'ready');assert(html.includes('six-choice-modern__title" data-lesson-text-block='));assert.equal(html.includes('six-choice-modern__exercise-number" data-lesson-text-block='),frame>=10);assert(!html.includes('aria-label="Exercise 4"'));}
 }
});


test('TI005 authored exercise4 follows source alpha frames and remains4 across all internal answer rows',()=>{
 assert.equal(SOURCE.sourceText.find(d=>d.characterId===33)!.runs.map(r=>r.text).join(''),'4');
 assert.deepEqual(BINDING.blocks[1].sourceTextIds,['character-33/run-0']);assert.deepEqual(BINDING.blocks[1].sourceShapeIds,[31]);
 assert.deepEqual(CONFIG.exerciseNumber!.alphaFrames.map(row=>[row.frame,row.alpha]),[[1,0],[2,37],[3,73],[4,110],[5,146],[6,183],[7,219],[8,256]]);
 const Renderer=CAP.Renderer!;
 for(const frame of[1,2,3,4,5,6,7,8,9,10,18,160,172,174,176,178,179,257]){
  const context=ctx(frame),state=CONFIG.getFrameState(frame,context),view=getSixQuestionChoiceSnapshot(CONFIG,state,context),alpha=CONFIG.exerciseNumber!.alphaFrames.filter(row=>row.frame<=frame).at(-1)!.alpha;
  const block=view.blocks.find(b=>b.id==='exercise-number')!;assert.equal(block.text,'4');assert.equal(block.visible,alpha>0);
  const html=renderToStaticMarkup(<Renderer {...context} state={state}/>);assert.equal((html.match(/data-lesson-text-block="exercise-number"/g)??[]).length,alpha>0?1:0);
  if(alpha>0){assert(html.includes(`aria-label="Exercise 4" style="opacity:${alpha/256}">4</span>`));assert(html.indexOf('data-lesson-text-block="root-title"')<html.indexOf('data-lesson-text-block="exercise-number"'));}
 }
 const replay={...ctx(1),replay:1};assert.equal(getSixQuestionChoiceSnapshot(CONFIG,CONFIG.getFrameState(1,replay),replay).blocks.find(b=>b.id==='exercise-number')!.visible,false);
});
test('TI005 exercise marker remains independent of Help and wrong-popup answer-button visibility',()=>{
 const context=ctx(172),state=CONFIG.getFrameState(172,context),base=createSixQuestionChoiceState(0,0,4),help={...base,help:true};
 assert.equal(getSixQuestionChoiceSnapshot(CONFIG,state,context,help).blocks.find(b=>b.id==='exercise-number')!.visible,true);
 const wrong=chooseSixQuestionChoiceAnswer(CONFIG,base,172,'choice-1')!,branch=SOURCE.feedback.find(b=>b.id===wrong.feedback!.id)!;
 const activity={id:branch.id,sourceInstanceId:branch.sourceInstanceId,frameDomain:`sprite-${branch.sprite}`,revision:1,frame:22,status:'completed' as const};
 assert.equal(getSixQuestionChoiceFeedback(CONFIG,wrong,[activity]).popup,true);
 const view=getSixQuestionChoiceSnapshot(CONFIG,state,context,wrong,[activity]);assert.equal(view.blocks.find(b=>b.id==='exercise-number')!.visible,true);assert.equal(view.blocks.find(b=>b.id==='root-title')!.visible,true);
 assert.equal(getSixQuestionChoiceSnapshot(CONFIG,state,context,base).blocks.find(b=>b.id==='exercise-number')!.visible,true);
 assert.equal(getSixQuestionChoiceSnapshot(CONFIG,state,{...context,rootFrame:1}).status,'blocked');
});

test('TI005 Need More Help press binds source button26 at each exact question placement',async()=>{
 const review=JSON.parse(await readFile(new URL('work/typography-v1/pipeline-v602/source-review/complete-source-duty-review-r1.json',root),'utf8'));
 const button=review.buttonReview.find((row:{characterId:number})=>row.characterId===26)!;
 assert.equal(button.sourceTagSha256,'84d75e8b20a6fbc38a587b27c32ef13ed6ebae95bf347c087367af3e3482e937');
 assert.equal(button.statePlacements.find((row:{recordIndex:number})=>row.recordIndex===5)?.characterId,8);
 assert.deepEqual(button.statePlacements.find((row:{recordIndex:number})=>row.recordIndex===5)?.states,{up:false,over:false,down:true,hitTest:false});
 const audio=SOURCE.audio.find(row=>row.id==='help-close-click')!;
 assert.equal(audio.sha256,'ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38');
 assert.equal(hash(await readFile(new URL(audio.path,root))),audio.sha256);
 assert.deepEqual(SOURCE.questions.map(q=>q.frame),[172,174,176,178]);
 const placements=button.directPlacements.map((row:{instanceId:string;firstFrame:number;lastFrameExclusive:number})=>row);
 for(const [index,q]of SOURCE.questions.entries()){
  const source=placements.find((row:{firstFrame:number})=>row.firstFrame===q.frame)!;
  const activity=G4_L1_TI005_BUTTON_ACTIVITIES.find(row=>row.id===`help-open-${q.id}`)!;
  assert.equal(activity.sourceInstanceId,`${source.instanceId}/button-26/record-5`);
  assert.deepEqual(activity.parentLifetime,{firstFrame:q.frame,lastFrameExclusive:q.frame+1});
  assert.deepEqual(activity.parentFrames,[q.frame]);assert.deepEqual(activity.buttonPress,{sourceButtonId:26});
  assert.equal(activity.frameDomain,'sprite-8');assert.equal(activity.startFrame,1);assert.equal(activity.endFrame,5);
  assert.equal(activity.audio?.sha256,audio.sha256);
  assert.equal(CONFIG.helpOpenActivityIds?.[q.id],activity.id);
  assert.equal(placements[index].firstFrame,q.frame);
 }
 assert.equal(G4_L1_TI005_BUTTON_ACTIVITIES.filter(row=>row.buttonPress?.sourceButtonId===26).length,4);
});

test('TI005 Help opener owns pointer and keyboard press, releases on Replay, and click only opens Help',async()=>{
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/'}),prior=new Map<string,PropertyDescriptor|undefined>();
 for(const name of ['window','document','HTMLElement','HTMLButtonElement','Node','navigator','IS_REACT_ACT_ENVIRONMENT']){
  prior.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name as keyof typeof dom.window]});
 }
 const doc=dom.window.document,reactRoot=createRoot(doc.getElementById('root')!),Renderer=CAP.Renderer!,phases:{id:string;parentFrame:number;phase:string;token:string}[]=[];
 const oldScroll=dom.window.HTMLElement.prototype.scrollIntoView;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const runtime=(replay=0,paused=false)=>({...ctx(172),replay,paused,onLessonActivityRequest:()=>true,onLessonButtonActivityRequest:(request:{id:string;parentFrame:number;phase:'press'|'release';token:string})=>{phases.push(request);return true;}});
 const render=async(replay=0,paused=false)=>{const props=runtime(replay,paused);await act(async()=>reactRoot.render(<Renderer {...props} state={CONFIG.getFrameState(172,props)}/>));};
 const opener=()=>doc.querySelector<HTMLButtonElement>('[data-lesson-text-block="help-button"]')!;
 const dispatch=async(target:HTMLElement,type:string,button=0)=>{const event=new dom.window.MouseEvent(type,{bubbles:true,button,buttons:type==='pointerdown'?1:0});Object.defineProperty(event,'pointerId',{value:7});await act(async()=>target.dispatchEvent(event));};
 try{
  await render();assert.equal(opener().getAttribute('data-source-button'),'26');
  await dispatch(opener(),'pointerdown');assert.deepEqual(phases.map(row=>row.phase),['press']);assert.equal(phases[0].id,'help-open-q1');assert.equal(phases[0].parentFrame,172);
  await dispatch(opener(),'pointerup');assert.deepEqual(phases.map(row=>row.phase),['press','release']);assert.equal(phases[1].token,phases[0].token);
  await act(async()=>opener().click());assert.equal(phases.length,2);assert.equal(doc.querySelector('[data-help-open]')?.getAttribute('data-help-open'),'true');
  await act(async()=>doc.querySelector<HTMLButtonElement>('[data-lesson-text-block="close"]')!.click());assert.equal(doc.querySelector('[data-help-open]')?.getAttribute('data-help-open'),'false');
  await act(async()=>opener().dispatchEvent(new dom.window.KeyboardEvent('keydown',{bubbles:true,key:' '})));
  await act(async()=>opener().dispatchEvent(new dom.window.KeyboardEvent('keyup',{bubbles:true,key:' '})));
  assert.deepEqual(phases.slice(2).map(row=>row.phase),['press','release']);assert.equal(phases[2].token,phases[3].token);
  await dispatch(opener(),'pointerdown');assert.equal(phases.at(-1)?.phase,'press');const pending=phases.at(-1)!.token;
  await render(1);assert.equal(phases.at(-1)?.phase,'release');assert.equal(phases.at(-1)?.token,pending);
  await dispatch(opener(),'pointerdown');await dispatch(opener(),'pointercancel');assert.deepEqual(phases.slice(-2).map(row=>row.phase),['press','release']);
  await render(1,true);assert.equal(opener().disabled,true);const count=phases.length;await dispatch(opener(),'pointerdown');assert.equal(phases.length,count);
 }finally{
  await act(async()=>reactRoot.unmount());dom.window.HTMLElement.prototype.scrollIntoView=oldScroll;dom.window.close();
  for(const[name,descriptor]of prior){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}
 }
});
