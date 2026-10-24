import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
import {FourStepPlanScene,getFourStepTeachingState,getFourStepTextSnapshot,sourceAlpha,isFourStepTermActive} from './g4-l4-four-step-plan';
import {G4_L4_STRATEGY_CONFIGS as configs} from './generated/g4-l4-strategy-config';
import {getCourseG04L04Ts004FrameState as get4} from '../modules/course-g04-l04-ts-004';
import {getCourseG04L04Ts005FrameState as get5} from '../modules/course-g04-l04-ts-005';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const model=JSON.parse(fs.readFileSync('scripts/inputs/typography-v1/g4-l4-four-step/strategy-source-model-r1.json','utf8'));
test('Two own strategy sources retain all 610 frames, exact text, native action windows and identity failures',()=>{
let newFrames=0,sourceValues=0,domFrames=0;
for(const [i,c] of configs.entries()){
 validateLessonTextBinding(c.binding);const p=model.pages[i],getter=[get4,get5][i];
 for(let frame=1;frame<=c.frameCount;frame++){
  const placements=p.frames.filter((r:any)=>r.frame<=frame).at(-1).placements;
  for(const id of Object.keys(p.texts).map(Number)){if(id===2)continue;const expected=Math.max(0,...placements.filter((r:any)=>r.characterId===id).map((r:any)=>r.alpha));assert.equal(sourceAlpha(c,frame,id),expected,`${c.animationId}/${frame}/${id}`);sourceValues++;}
  const teaching=getFourStepTeachingState(c,frame),reduced=getFourStepTeachingState(c,frame,true);assert.deepEqual(teaching.strategy,reduced.strategy);assert.deepEqual(reduced.emphasis,[]);
  const ctx={frame,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0,replay:3},state=getter(frame,ctx),snap=getFourStepTextSnapshot(c,state,ctx);assert.equal(snap.status,'ready');assert.equal(snap.identity.replay,3);
  for(const b of p.blocks){const actual=snap.blocks.find(x=>x.id===b.id);assert(actual);assert.equal(actual.text,b.text);let expected=true;
   if(b.id.startsWith('step-copy-'))expected=placements.some((r:any)=>r.characterId===b.characters[0]&&r.alpha>0);
   else if(!b.id.startsWith('step-')&&b.id!=='root-title'){const chars=b.id==='active-step'?p.headingCharacters:b.id==='final-instruction'?[p.finalCharacter]:b.characters;expected=chars.every((ch:number)=>placements.some((r:any)=>r.characterId===ch&&r.alpha>0));}assert.equal(actual.visible,expected,`${c.animationId}/${frame}/${b.id}`);
  }
  for(const term of c.terms){const s=p.terms.find((t:any)=>t.button===term.button);assert.equal(isFourStepTermActive(term,frame),s.nativeVisibleActionRanges.some(([a,b]:number[])=>frame>=a&&frame<b));}
  newFrames++;
  if([1,12,13,14,41,43,45,49,51,53,74,75,104,105,110,140,141,238,239,243,244,245,247,248,273,274,275,335].includes(frame)){
   const dom=new JSDOM(renderToStaticMarkup(<FourStepPlanScene config={c} frame={frame} onOpenKeyTerm={()=>{}}/>)),doc=dom.window.document;
   for(const b of snap.blocks){const element=doc.querySelector(`[data-lesson-text-block="${b.id}"]`);assert.equal(!!element,b.visible,`${c.animationId}/${frame}/${b.id}/dom`);if(element)assert.equal(element.textContent,b.text);}
   for(const term of c.terms){const button=doc.querySelector(`[data-source-button="${term.button}"]`),visible=snap.blocks.find(b=>b.id===term.block)?.visible;assert.equal(!!button,visible);if(button)assert.equal(button.disabled,!isFourStepTermActive(term,frame));}
   if(i===1){const show=doc.querySelector('[data-source-button="34"]');assert.equal(doc.querySelectorAll('[data-source-button="37"]').length,0);assert.equal(show?.getAttribute('data-source-equivalent-buttons')??null,frame===243?'37':null);}
   assert.equal(doc.querySelectorAll('canvas,svg').length,0);dom.window.close();domFrames++;
  }
 }
 const ctx={frame:c.frameCount,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0},state=getter(c.frameCount,ctx);
 for(const delta of [{animationId:'other'},{sourceSwfSha256:'0'.repeat(64)},{rootFrame:5},{frameDomain:'root'},{seed:3}])assert.equal(getFourStepTextSnapshot(c,{...state,...delta},ctx).status,'blocked');
 for(const delta of [{lang:'es' as const},{scenario:'other'},{rootFrame:5},{entryStateSha256:'f'.repeat(64)},{frame:0},{frame:c.frameCount+1},{frame:c.frameCount-.5}])assert.equal(getFourStepTextSnapshot(c,state,{...ctx,...delta}).status,'blocked');
}
assert.equal(newFrames,610);assert.equal(sourceValues,20145);assert.equal(domFrames,55);
});
