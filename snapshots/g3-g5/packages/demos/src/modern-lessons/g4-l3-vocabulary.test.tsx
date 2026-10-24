import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import React, {act,createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import {G4_L3_VOCABULARY_NATIVE_CONFIGS} from './generated/g4-l3-vocabulary-native-config';
import {createNumberLineVocabularyPresentation,getNumberLineVocabularyTeachingState,isNumberLineVocabularyTermActive,type NumberLineVocabularyConfig} from './source-number-line-vocabulary';
import {G4_L3_VB002_TEXT_PRESENTATION} from './g4-l3-vb002';
import {G4_L3_VB004_TEXT_PRESENTATION} from './g4-l3-vb004';
import {G4_L3_VB005_TEXT_PRESENTATION} from './g4-l3-vb005';
import {G4_L3_VB006_TEXT_PRESENTATION} from './g4-l3-vb006';
import {getCourseG04L03Vb002FrameState} from '../modules/course-g04-l03-vb-002';
import {getCourseG04L03Vb004FrameState} from '../modules/course-g04-l03-vb-004';
import {getCourseG04L03Vb005FrameState} from '../modules/course-g04-l03-vb-005';
import {getCourseG04L03Vb006FrameState} from '../modules/course-g04-l03-vb-006';
import {createStructuralProjector} from '../../../../scripts/lib/lesson-source-structural-projection.mjs';
const root=process.env.V606_SOURCE_ROOT??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const prepared=process.env.V606_PREPARED_ROOT??root;
const configs=Object.values(G4_L3_VOCABULARY_NATIVE_CONFIGS) as readonly NumberLineVocabularyConfig[];
const presentations=[G4_L3_VB002_TEXT_PRESENTATION,G4_L3_VB004_TEXT_PRESENTATION,G4_L3_VB005_TEXT_PRESENTATION,G4_L3_VB006_TEXT_PRESENTATION];
const request=(config:NumberLineVocabularyConfig,frame:number,changes:Partial<AnimationRendererProps>={}):AnimationRendererProps=>({frame,frameDomain:config.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en',seed:23,replay:0,...changes});
const frameStates=[getCourseG04L03Vb002FrameState,getCourseG04L03Vb004FrameState,getCourseG04L03Vb005FrameState,getCourseG04L03Vb006FrameState];
const snapshot=(index:number,frame:number,changes:Partial<RuntimeContext>={})=>{const c=configs[index],context=request(c,frame,changes);const state=frameStates[index](frame,context);return presentations[index].getSnapshot(state,context);};
const html=(index:number,frame:number,changes:Partial<AnimationRendererProps>={})=>renderToStaticMarkup(createElement(presentations[index].Renderer,request(configs[index],frame,changes)));
const source=async(config:NumberLineVocabularyConfig)=>JSON.parse(gunzipSync(await readFile(path.join(root,`catalog/typography-v1/source-catalog/assets/${config.sourceSwfSha256}.json.gz`))).toString());
// Independent source glyph-right extrema computed from the audited font XML,
// in twips. Test the live source mask both before and at every complete-word
// threshold, rather than deriving an expectation from the renderer's output.
const SOURCE_WORD_RIGHTS:Readonly<Record<string,Readonly<Record<string,readonly number[]>>>>={
  "course-g04-l03-vb-002": {
    "definition": [
      238.90625,
      1803.65625,
      2555.015625,
      2952.3125,
      3313.15625,
      4086.015625,
      4736.65625,
      6407.15625,
      8144.3125,
      8728.953125,
      9709.65625,
      10913.5078125
    ]
  },
  "course-g04-l03-vb-004": {
    "definition": [
      1411.015625,
      3138.3125,
      3890.015625,
      5416.65625,
      6352.953125,
      7384.5078125
    ]
  },
  "course-g04-l03-vb-005": {
    "definition": [
      1662.015625,
      3389.3125,
      4141.015625,
      4967.3125,
      5918.953125,
      6950.5078125
    ]
  },
  "course-g04-l03-vb-006": {
    "definition": [
      667.015625,
      2218.65625,
      3129.4453125,
      3912.3125,
      4499.4453125,
      5715.5078125
    ],
    "second-definition": [
      826.4453125,
      1224.3125,
      1949.0390625,
      3503.015625,
      4016.65625,
      5844.5078125
    ]
  }
};
for(const [index,config] of configs.entries()){
 test(`${config.animationId}: source clock, title, binding and original audio stay distinct`,async()=>{
  const asset=await source(config),timeline=asset.timelines.find((t:any)=>t.timelineId===config.frameDomain);
  assert.equal(asset.sourceSha256,config.sourceSwfSha256);assert.equal(timeline.declaredFrameCount,config.frameCount);
  assert.equal(config.rootFrame,6);assert.equal(config.fps,12);assert.equal(presentations[index].playbackMode,'once');
  assert.equal(presentations[index].binding.placementId,config.placementId);
  const ids=new Set(asset.textDefinitions.flatMap((t:any)=>t.runs.map((r:any)=>r.sourceTextId)));
  for(const block of presentations[index].binding.blocks)for(const id of block.sourceTextIds)assert(ids.has(id),id);
  assert.equal(config.title.text,asset.textDefinitions.find((t:any)=>t.characterId===4).runs.map((r:any)=>r.text).join('').trim());
  const cue=presentations[index].sourceTimelineAudioCues![0];assert.equal(cue.frame,7);assert.equal(cue.endFrame,config.frameCount+1);assert.equal(cue.frameDomain,config.frameDomain);assert.equal(cue.manualNarration,undefined);
  const audio=await readFile(path.join(root,'apps/web/public',cue.source));const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(audio).digest('hex'),cue.sha256);
  assert.deepEqual(presentations[index].reducedMotionFrameByDomain,{[config.frameDomain]:config.frameCount});
  assert.deepEqual(snapshot(index,1).blocks.filter(b=>b.visible).map(b=>b.id),['root-title']);
 });
 test(`${config.animationId}: complete words follow their own source mask and holds`,async()=>{
  const asset=await source(config),projector=createStructuralProjector(asset),timeline=asset.timelines.find((t:any)=>t.timelineId===config.frameDomain),xml=gunzipSync(await readFile(path.join(root,`migrations/${config.animationId}/audit/machine/swfmill.xml.gz`))).toString();
  for(const body of config.bodies){const character=body.id==='definition'?9:41,instance=timeline.instances.find((i:any)=>i.characterId===character),mask=timeline.events.find((e:any)=>e.clipDepth!==undefined&&e.depth<instance.depth&&e.clipDepth>=instance.depth),shape=asset.shapeDefinitions.find((s:any)=>s.characterId===mask.characterId),match=xml.match(new RegExp(`<${shape.tagName} objectID="${mask.characterId}">\\s*<bounds>\\s*<Rectangle[^>]* right="(-?\\d+)"`));assert(match,'actual source XML mask bounds');const maskRight=Number(match[1]);
   for(const [wordIndex,word] of body.wordReveals.entries()){
    const right=SOURCE_WORD_RIGHTS[config.animationId][body.id][wordIndex];
    for(const [frame,visible] of [[word.frame-1,false],[word.frame,true]] as const){const rows=projector.snapshot(config.frameDomain,frame),text=rows.find((r:any)=>r.instanceId===instance.instanceId),wipe=rows.find((r:any)=>r.instanceId===mask.instanceId);assert.equal(text.matrix[4]+right<=wipe.matrix[0]*maskRight+wipe.matrix[4],visible,`${body.id}/${word.text}/${frame}`);}
    assert.equal(snapshot(index,word.frame-1).blocks.find(b=>b.id===body.id)?.text,body.wordReveals.slice(0,wordIndex).map(w=>w.text).join(' '));
    assert.equal(snapshot(index,word.frame).blocks.find(b=>b.id===body.id)?.text,body.wordReveals.slice(0,wordIndex+1).map(w=>w.text).join(' '));
   }
  }
 });
 test(`${config.animationId}: every frame has ordered atomic −8..8 labels and Replay clears teaching state`,()=>{
  for(let frame=1;frame<=config.frameCount;frame++){
   const s=snapshot(index,frame),labels=s.blocks.filter(b=>b.id.startsWith('tick-')&&b.visible);assert.equal(s.status,'ready');assert.equal(s.identity.frame,frame);assert.equal(s.identity.rootFrame,6);assert.equal(s.identity.seed,23);
   if(labels.length){assert.equal(labels.length,17);assert.deepEqual(labels.map(b=>Number(b.text.replace('−','-'))),Array.from({length:17},(_,i)=>i-8));assert.equal(labels.filter(b=>b.text==='0').length,1);}
  }
  assert(snapshot(index,config.frameCount).blocks.filter(b=>b.visible).length>18);
  assert.deepEqual(snapshot(index,1,{replay:2}).blocks.filter(b=>b.visible).map(b=>b.id),['root-title']);assert.equal(snapshot(index,1,{replay:2}).identity.replay,2);
  assert.doesNotMatch(html(index,config.frameCount),/<canvas|<image|<text\b|source-assets|Engineering candidate/);
  assert.equal((html(index,config.frameCount).match(/data-lesson-text-block="tick-/g)??[]).length,17);
 });
 test(`${config.animationId}: wrong source/root/domain/scenario/language/frame/seed fail closed`,()=>{
  for(const change of [{rootFrame:5},{frameDomain:'root'},{scenario:'invented'},{lang:'es'}] as const){const s=snapshot(index,config.frameCount,change);assert.equal(s.status,'blocked');assert.deepEqual(s.blocks,[]);}
  const ctx=request(config,config.frameCount),state={animationId:config.animationId,sourceSwfSha256:config.sourceSwfSha256,status:'ready',blocker:null,frameDomain:config.frameDomain,scenario:'source-static-frame',language:'en',frame:config.frameCount,rootFrame:6,seed:23} as Parameters<typeof presentations[number]['getSnapshot']>[0];
  for(const change of [{sourceSwfSha256:'0'.repeat(64)},{animationId:'unrelated'},{frame:1},{seed:42},{rootFrame:1}] as const){const s=presentations[index].getSnapshot({...state,...change},ctx);assert.equal(s.status,'blocked');assert.deepEqual(s.blocks,[]);}
 });
 test(`${config.animationId}: source Keyterm button/action/index and complete phrase thresholds`,async()=>{
  const actions=gunzipSync(await readFile(path.join(root,`migrations/${config.animationId}/audit/machine/ffdec-scripts.txt.gz`))).toString();
  const indexData=JSON.parse(await readFile(path.join(root,'apps/web/public/generated/g4-grade-wide-keyterms-en.json'),'utf8'));
  for(const term of config.terms){assert(actions.includes(`DefineButton2_${term.buttonCharacter}/BUTTONCONDACTION`));assert(actions.includes(`_global.KeyAttribute = "${term.keyAttribute}"`));assert.equal(indexData.entries.find((e:any)=>e.id===term.entryId)?.titles.en,term.keyAttribute);assert.equal(isNumberLineVocabularyTermActive(term,term.firstSourceFrame-1),false);assert.equal(isNumberLineVocabularyTermActive(term,term.firstSourceFrame),true);assert.equal(isNumberLineVocabularyTermActive(term,term.lastFrameExclusive-1),true);assert.equal(isNumberLineVocabularyTermActive(term,term.lastFrameExclusive),false);}
  for(const body of config.bodies)for(const span of body.termSpans){const term=config.terms.find(t=>t.keyAttribute===span.keyAttribute)!,first=Math.max(term.firstSourceFrame,body.wordReveals[span.endWordExclusive-1].frame),selector=`data-source-button="${term.buttonCharacter}"`;assert(!html(index,first-1,{onLessonHostRequest:()=>undefined}).includes(selector));assert(html(index,first,{onLessonHostRequest:()=>undefined}).includes(selector));}
  for(const association of config.annotationTerms){const term=config.terms.find(t=>t.keyAttribute===association.keyAttribute)!,first=config.semanticStates.find(s=>s.annotations.some(a=>a.sourceCharacter===association.sourceCharacter&&a.alpha>0))!.frame;assert(!html(index,first-1,{onLessonHostRequest:()=>undefined}).includes(`data-source-button="${term.buttonCharacter}"`));assert(html(index,first,{onLessonHostRequest:()=>undefined}).includes(`data-source-button="${term.buttonCharacter}"`));}
  assert.equal(presentations[index].keyTerms?.sourceSha256,indexData.source.sha256);assert.deepEqual(presentations[index].keyTerms?.entryIds,config.terms.map(t=>t.entryId));
 });
}
test('literal source spotlights +6→6 and −6→6 preserve sign loss independently of static signed ticks',()=>{
 for(const [index,first,signed,last] of [[1,173,'+6',241],[2,149,'−6',177]] as const){assert.equal(snapshot(index,first-1).blocks.find(b=>b.id==='source-spotlight')?.visible,false);assert.equal(snapshot(index,first).blocks.find(b=>b.id==='source-spotlight')?.text,signed);assert.equal(snapshot(index,last-1).blocks.find(b=>b.id==='source-spotlight')?.text,signed);assert.equal(snapshot(index,last).blocks.find(b=>b.id==='source-spotlight')?.text,'6');assert.equal(snapshot(index,last).blocks.find(b=>b.id===`tick-${index===1?'positive':'negative'}-6`)?.text,signed);const value=index===1?6:-6,block=snapshot(index,last).blocks.find(b=>b.id==='source-spotlight')!,tick=snapshot(index,last).blocks.find(b=>b.id===`tick-${index===1?'positive':'negative'}-6`)!;assert.equal(block.anchor?.x,tick.anchor?.x,'unsigned overlay stays above its signed source coordinate');assert.match(html(index,last),new RegExp(`data-source-value="${value}" data-source-literal="6"`));assert.match(html(index,last),/aria-describedby="[^"]*tick-(positive|negative)-6"/);}
});
test('VB006 exact source wording, second sentence and all five original zero outline intervals',async()=>{
 const config=configs[3],asset=await source(config),timeline=asset.timelines.find((t:any)=>t.timelineId===config.frameDomain),ranges=timeline.instances.filter((i:any)=>i.characterId===37).map((i:any)=>[i.firstFrame,i.lastFrameExclusive]);assert.deepEqual(ranges,[[113,122],[123,124],[125,126],[127,128],[129,159]]);
 for(let frame=1;frame<=163;frame++)assert.equal(getNumberLineVocabularyTeachingState(config,frame).zeroOutline,ranges.some(([first,last]:number[])=>frame>=first&&frame<last),String(frame));
 assert.equal(snapshot(3,30).blocks.find(b=>b.id==='definition')?.text,'The number zero has no value.');assert.equal(snapshot(3,119).blocks.find(b=>b.id==='second-definition')?.visible,false);assert.equal(snapshot(3,156).blocks.find(b=>b.id==='second-definition')?.text,'Zero is not positive or negative.');
 assert.equal((html(3,156,{onLessonHostRequest:()=>undefined}).match(/data-source-keyterm="Zero"/g)??[]).length,1,'second Zero has no extra source button');
});
test('invalid empty or noninitial semantic models are rejected without inventing a source state',()=>{
 for(const states of [[],[{...configs[1].semanticStates[0],frame:2}]])assert.throws(()=>createNumberLineVocabularyPresentation({...configs[1],semanticStates:states},getCourseG04L03Vb004FrameState),/invalid source clock/);
 assert.throws(()=>getNumberLineVocabularyTeachingState({...configs[1],semanticStates:[]},1),/missing initial source sample/);
});
test('all four actual consumers dispatch native clicks; incomplete or expired source term controls never act',async()=>{
 const {JSDOM}=createRequire(import.meta.url)('jsdom'),dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),w=dom.window;
 Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
 const {createRoot}=await import('react-dom/client'),mount=createRoot(document.getElementById('root')!);
 try{for(const [index,config] of configs.entries()){
  const calls:any[]=[];await act(async()=>mount.render(createElement(presentations[index].Renderer,request(config,config.frameCount,{onLessonHostRequest:(...call)=>{calls.push(call);}}))));
  const buttons=[...document.querySelectorAll<HTMLButtonElement>('button[data-source-keyterm]')];assert.equal(buttons.length,config.terms.length);
  for(const button of buttons)await act(async()=>button.click());assert.equal(calls.length,config.terms.length);
  for(const [i,term] of config.terms.entries()){assert.deepEqual(calls[i][0],{type:'open-keyterm',entryId:term.entryId,sourceAnimationId:config.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});assert.equal(calls[i][1].trigger,buttons[i]);assert.equal(calls[i][1].keyTermIndexLanguage,'en');}
  await act(async()=>mount.render(createElement(presentations[index].Renderer,request(config,1,{replay:1,onLessonHostRequest:()=>{throw new Error('Replay must have no term control');}}))));assert.equal(document.querySelectorAll('button[data-source-keyterm]').length,0);
 }
 // Complete text remains readable while source lifetime alone gates the
 // button. This bounded configuration variant exercises the missing guard.
 const config={...configs[1],terms:configs[1].terms.map(t=>({...t,firstSourceFrame:40,lastFrameExclusive:50}))};
 const capability=createNumberLineVocabularyPresentation(config,getCourseG04L03Vb004FrameState),calls:any[]=[];
 for(const [frame,count] of [[34,0],[39,0],[40,3],[49,3],[50,0]] as const){await act(async()=>mount.render(createElement(capability.Renderer,request(config,frame,{onLessonHostRequest:(...call)=>{calls.push(call);}}))));assert.equal(document.querySelectorAll('button[data-source-keyterm]').length,count);assert(document.querySelector('[data-lesson-text-block="definition"]')?.textContent?.includes('Positive numbers are greater than zero.'));}
 }finally{await act(async()=>mount.unmount());dom.window.close();}
});
test('figure keyboard and pointer intent survive resize/font callbacks; Replay/new phase reset and unmount cleanup',async()=>{
 const {JSDOM}=createRequire(import.meta.url)('jsdom'),dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),w=dom.window;
 const geometry={width:400,total:832},observers:{callback:()=>void;disconnected:boolean}[]=[];
 class Observer{record:{callback:()=>void;disconnected:boolean};constructor(callback:()=>void){this.record={callback,disconnected:false};observers.push(this.record);}observe(){}disconnect(){this.record.disconnected=true;}}
 Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,ResizeObserver:Observer,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
 Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return geometry.width;}});Object.defineProperty(w.HTMLElement.prototype,'scrollWidth',{get(){return geometry.total;}});
 const fonts=new w.EventTarget(),ready=Promise.resolve();Object.defineProperty(fonts,'ready',{value:ready});Object.defineProperty(w.document,'fonts',{value:fonts});
 const {createRoot}=await import('react-dom/client'),mount=createRoot(document.getElementById('root')!),config=configs[1],render=async(frame:number,replay=0)=>act(async()=>mount.render(createElement(presentations[1].Renderer,request(config,frame,{replay}))));
 const viewport=()=>document.querySelector<HTMLElement>('.lesson-text-presentation__figure-viewport')!,resize=async()=>act(async()=>{observers.filter(o=>!o.disconnected).forEach(o=>o.callback());fonts.dispatchEvent(new w.Event('loadingdone'));});
 try{await render(1);assert.equal(document.querySelector('.lesson-text-presentation__figure-viewport'),null);assert.equal(observers.length,0);const firstPanel=config.semanticStates.find(s=>s.panelAlpha>0)!.frame;await render(firstPanel);const v=viewport();assert.equal(v.scrollLeft,216,'first visible panel centers zero after frame1 had no figure');assert(observers.some(o=>!o.disconnected),'first panel attaches its observer');await render(50);
  const key=async(value:string,extra:KeyboardEventInit={})=>{const event=new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true,...extra});await act(async()=>v.dispatchEvent(event));return event;};
  assert((await key('Home')).defaultPrevented);assert.equal(v.scrollLeft,0);geometry.width=200;geometry.total=1664;await resize();assert.equal(v.scrollLeft,0);
  assert((await key('ArrowRight')).defaultPrevented);assert.equal(v.scrollLeft,40);await key('End');assert.equal(v.scrollLeft,1464);await key('ArrowRight');assert.equal(v.scrollLeft,1464);assert(!(await key('ArrowLeft',{altKey:true})).defaultPrevented);assert(!(await key('ArrowDown')).defaultPrevented);
  v.scrollLeft=123;await act(async()=>v.dispatchEvent(new w.Event('pointerdown',{bubbles:true})));await resize();assert.equal(v.scrollLeft,123);
  await render(81);assert.notEqual(v.scrollLeft,123,'new source scan phase resets follow');await key('Home');await render(82);assert.equal(v.scrollLeft,0,'same phase retains manual position');
  await render(50,1);assert.equal(v.scrollLeft,732,'Replay restores source origin follow');await key('Home');await resize();assert.equal(v.scrollLeft,0);
  const live=observers.filter(o=>!o.disconnected);await act(async()=>mount.unmount());assert(live.every(o=>o.disconnected));await resize();assert.equal(v.scrollLeft,0,'late callbacks cannot move detached viewport');
 }finally{if(document.getElementById('root')?.childNodes.length)await act(async()=>mount.unmount());dom.window.close();delete (globalThis as any).ResizeObserver;}
});
