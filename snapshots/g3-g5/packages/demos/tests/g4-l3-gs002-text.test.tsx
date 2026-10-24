import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GS002_BINDING,getGs002TextSnapshot} from '../src/modern-lessons/g4-l3-gs002-text';
import {GS002_PRESENTATION} from '../src/modern-lessons/g4-l3-gs002-capability';
import {CourseG04L03Gs002NativeRenderer,getCourseG04L03Gs002FrameState} from '../src/modules/course-g04-l03-gs-002';
import {Gs002Activity} from '../src/modern-lessons/g4-l3-gs002-activity';
import {Gs002Help} from '../src/modern-lessons/g4-l3-gs002-help';
import {createCourseG04L03Gs002InteractionState as initial,reduceCourseG04L03Gs002Interaction as reduce} from '../src/timelines/course-g04-l03-gs-002-interaction';
import {validateLessonTextBinding} from '../src/lesson-text-snapshot';
import {validateLessonTextKeyTerms,lessonTextKeyTermRequestAllowed} from '../src/lesson-text-keyterms';
import {validateLessonTextFrameControl} from '../src/lesson-text-frame-control';
import type {TextPresentationSnapshot} from '../src/lesson-text-contract';
const {JSDOM}=createRequire(import.meta.url)('jsdom') as {JSDOM:new(html:string)=>{window:{document:Document;close():void}}};
const context=(frame:number)=>({frame,frameDomain:'sprite-321',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0,replay:0});
const state=(frame:number)=>getCourseG04L03Gs002FrameState(frame,context(frame));
function compare(snapshot:TextPresentationSnapshot,html:string,omitTitle=false){
  assert.equal(snapshot.status,'ready');
  const dom=new JSDOM(html);
  try{
    const found=Array.from(dom.window.document.querySelectorAll<HTMLElement>('[data-lesson-text-block]'));
    const expected=snapshot.blocks.filter(b=>b.visible&&(!omitTitle||b.id!=='title'));
    assert.deepEqual(found.map(e=>e.dataset.lessonTextBlock).sort(),expected.map(b=>b.id).sort());
    for(const b of expected){
      const e=found.find(e=>e.dataset.lessonTextBlock===b.id)!;
      const actual=e.tagName==='INPUT'?(e as HTMLInputElement).value:e.textContent;
      assert.equal(actual?.replace(/\s+/g,' ').trim(),b.text.replace(/\s+/g,' ').trim(),b.id);
    }
  }finally{dom.window.close();}
}
test('GS002 binding validates and all references exist in its independent source catalog',()=>{
  validateLessonTextBinding(GS002_BINDING);
  const c=JSON.parse(gunzipSync(fs.readFileSync(new URL(`../../../catalog/typography-v1/source-catalog/assets/${GS002_BINDING.sourceSwfSha256}.json.gz`,import.meta.url))).toString());
  const ids=new Set(c.textDefinitions.flatMap((t:{sourceTextId:string;runs?:{sourceTextId:string}[]})=>[t.sourceTextId,...(t.runs??[]).map(r=>r.sourceTextId)]));
  for(const b of GS002_BINDING.blocks)for(const id of b.sourceTextIds)assert(ids.has(id),`${b.id}:${id}`);
  assert.equal(new Set(GS002_BINDING.blocks.map(b=>b.readingOrder)).size,GS002_BINDING.blocks.length);
  assert(!GS002_BINDING.blocks.some(b=>b.id==='intro-score'||b.id.startsWith('instructions-')));
});
test('GS002 snapshot agrees with the actual native DOM across source reveal and replacement boundaries',()=>{
  for(const frame of [1,86,90,91,104,137,197,263,426,427]){
    const p={...context(frame),state:state(frame),paused:true};
    compare(getGs002TextSnapshot(p.state,p,frame===427?initial(0):undefined),renderToStaticMarkup(<CourseG04L03Gs002NativeRenderer {...p}/>));
  }
  for(let frame=1;frame<=426;frame++){
    const s=getGs002TextSnapshot(state(frame),context(frame));
    assert.equal(s.status,'ready');
    assert.equal(s.blocks.find(b=>b.id==='timer')!.text,'00:00:00');
    assert(!s.blocks.find(b=>b.id==='game-score')!.visible);
    assert.equal(s.blocks.filter(b=>b.visible&&b.id.startsWith('intro-tick-')).length,15);
  }
});
test('GS002 live snapshots match reducer-driven input, feedback, help, scoring, expiry and Replay',()=>{
  const start=initial(0),signed=reduce(start,{type:'set-sign',sign:'+'});
  const entered=reduce(signed,{type:'set-distance',value:'7'});
  let moving=reduce(entered,{type:'submit-move'});
  const states=[start,signed,entered,moving,reduce(start,{type:'submit-move'}),reduce(entered,{type:'open-help'}),
    reduce(reduce(signed,{type:'set-distance',value:'0'}),{type:'submit-move'}),
    reduce(start,{type:'advance-time',elapsedMs:240000})];
  for(let i=0;i<7;i++)moving=reduce(moving,{type:'movement-step'});
  states.push(moving,reduce(moving,{type:'replay'}));
  assert.equal(moving.score,1);
  for(const game of states){
    const snapshot=getGs002TextSnapshot(state(427),context(427),game);
    compare(snapshot,renderToStaticMarkup(<Gs002Activity state={game} dispatch={()=>{}} art={{ship:'ship.png',virus:'virus.png'}} help={<Gs002Help/>}/>),true);
  }
});
test('GS002 snapshot fails closed on missing live game state, capture and stale context',()=>{
  assert.deepEqual(getGs002TextSnapshot(state(427),context(427)).blockers,['interaction-state-required']);
  for(const p of [{...context(200),frame:201},{...context(200),entryStateSha256:'capture'},
    {...context(200),rootFrame:1},{...context(200),frame:NaN},{...context(200),lang:'es' as const}]){
    const s=getGs002TextSnapshot(state(200),p);assert.equal(s.status,'blocked');assert.deepEqual(s.blocks,[]);
  }
});
test('GS002 prepared capability restricts glossary to source index and exact page terms',()=>{
  validateLessonTextKeyTerms(GS002_PRESENTATION.keyTerms!);
  validateLessonTextFrameControl(GS002_PRESENTATION.frameControl!,428);
  const cap=GS002_PRESENTATION.keyTerms!;
  assert.equal(cap.entryIds.length,2);
  for(const entryId of cap.entryIds){
    const request={type:'open-keyterm' as const,entryId,sourceAnimationId:GS002_BINDING.animationId,
      playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};
    assert(lessonTextKeyTermRequestAllowed(cap,request,GS002_BINDING.animationId));
    assert(!lessonTextKeyTermRequestAllowed(cap,{...request,entryId:'en-unknown'},GS002_BINDING.animationId));
    assert(!lessonTextKeyTermRequestAllowed(cap,{...request,sourceAnimationId:'other'},GS002_BINDING.animationId));
  }
});

test('GS002 registry opts in exact native capability without replacing legacy renderer',async()=>{
  const {loadAnimationModuleForPresentation}=await import('../src/animation-registry');
  const modern=await loadAnimationModuleForPresentation(GS002_BINDING.animationId,{modernText:true});
  const legacy=await loadAnimationModuleForPresentation(GS002_BINDING.animationId,{modernText:false});
  assert.equal(modern?.textPresentation,GS002_PRESENTATION);
  assert.equal(legacy?.textPresentation,undefined);
  assert.equal(modern?.Renderer,legacy?.Renderer);
  assert.equal(modern?.textPresentation?.Renderer,CourseG04L03Gs002NativeRenderer);
  assert.equal(modern?.textPresentation?.binding.placementId,'g04-l03-placement-029');
});
