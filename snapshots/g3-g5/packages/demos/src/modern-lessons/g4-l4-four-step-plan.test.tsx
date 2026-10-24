import TS002Module from '../modules/course-g04-l04-ts-002';
import TS003Module from '../modules/course-g04-l04-ts-003';
import TS006Module from '../modules/course-g04-l04-ts-006';
import {G4_L4_FOUR_STEP_HOST_AUDIO_CANDIDATES} from './generated/g4-l4-four-step-native-config';
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {G4_L4_FOUR_STEP_CONFIGS} from './generated/g4-l4-four-step-native-config';
import {FourStepPlanScene,getFourStepTeachingState,getFourStepTextSnapshot,sourceAlpha,isFourStepTermActive} from './g4-l4-four-step-plan';
import {G4_L4_TS002_TEXT_PRESENTATION} from './g4-l4-ts002';
import {G4_L4_TS003_TEXT_PRESENTATION} from './g4-l4-ts003';
import {G4_L4_TS006_TEXT_PRESENTATION} from './g4-l4-ts006';
import {getCourseG04L04Ts002FrameState} from '../modules/course-g04-l04-ts-002';
import {getCourseG04L04Ts003FrameState} from '../modules/course-g04-l04-ts-003';
import {getCourseG04L04Ts006FrameState} from '../modules/course-g04-l04-ts-006';
import type {RuntimeContext} from '../contract';
import type {FourStepPlanConfig} from './g4-l4-four-step-plan';
import {audioCueMatchesContext} from '../runtime';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const root=process.env.G4L4_SOURCE_TEST_ROOT??path.resolve(process.cwd());
const draft=JSON.parse(readFileSync(path.join(root,'work/typography-v1/g4-l4-four-step-core/source-model-r4/configs-draft-r1.json'),'utf8'));
const getters=[getCourseG04L04Ts002FrameState,getCourseG04L04Ts003FrameState,getCourseG04L04Ts006FrameState];
const caps=[G4_L4_TS002_TEXT_PRESENTATION,G4_L4_TS003_TEXT_PRESENTATION,G4_L4_TS006_TEXT_PRESENTATION];
const context=(c:FourStepPlanConfig,frame:number,extra:Partial<RuntimeContext>={}):RuntimeContext=>({frame,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,...extra});
for(const [index,c]of G4_L4_FOUR_STEP_CONFIGS.entries()){
 test(`${c.animationId}: every own frame preserves independent projector alpha`,()=>{
  const d=draft[c.animationId];const chars=Object.keys(c.alphaFrames[0].values).map(Number);
  for(let frame=1;frame<=c.frameCount;frame++){const row=d.frames.filter((r:{frame:number})=>r.frame<=frame).at(-1);for(const id of chars){const own=row.placements.filter((p:{characterId:number})=>p.characterId===id);const expected=own.length?Math.max(...own.map((p:{alpha:number})=>p.alpha)):0;assert.equal(sourceAlpha(c,frame,id),expected,`${frame}/${id}`);}
   const teaching=getFourStepTeachingState(c,frame);const reduced=getFourStepTeachingState(c,frame,true);assert.deepEqual(reduced.cells,teaching.cells);assert.deepEqual(reduced.heading,teaching.heading);assert.deepEqual(reduced.bullets,teaching.bullets);assert.deepEqual(reduced.emphasis,[]);
  }
 });
 test(`${c.animationId}: actual own module identity and every-frame snapshot`,()=>{
  for(let frame=1;frame<=c.frameCount;frame++){const ctx=context(c,frame);const state=getters[index](frame,ctx);const s=getFourStepTextSnapshot(c,state,ctx);assert.equal(s.status,'ready');assert.equal(s.identity.frame,frame);assert.equal(s.blocks[0].text,c.title);assert.deepEqual(s.blocks.filter(b=>/^step-\d$/.test(b.id)).map(b=>b.text),['1.','2.','3.','4.']);assert.equal(s.blocks.length,c.binding.blocks.length);}
  assert.deepEqual(caps[index].playbackEndFrameByDomain,{[c.frameDomain]:c.frameCount});assert.deepEqual(caps[index].reducedMotionFrameByDomain,{[c.frameDomain]:c.frameCount});assert.equal(caps[index].playbackMode,'once');
 });
 test(`${c.animationId}: wrong source, root, scenario, language and capture fail closed`,()=>{
  const ctx=context(c,c.frameCount),s=getters[index](c.frameCount,ctx);
  for(const delta of [{animationId:'other'},{sourceSwfSha256:'0'.repeat(64)},{rootFrame:5},{frameDomain:'root'},{seed:3}])assert.equal(getFourStepTextSnapshot(c,{...s,...delta},ctx).status,'blocked');
  for(const delta of [{lang:'es' as const},{scenario:'other'},{rootFrame:5},{entryStateSha256:'f'.repeat(64)},{frame:0},{frame:c.frameCount+1},{frame:c.frameCount-.5}])assert.equal(getFourStepTextSnapshot(c,s,{...ctx,...delta}).status,'blocked');
 });
 test(`${c.animationId}: Replay snapshot uses the same source frame with fresh host replay`,()=>{
  const ctx=context(c,1,{replay:4}),s=getters[index](1,ctx),a=getFourStepTextSnapshot(c,s,ctx);assert.equal(a.status,'ready');assert.equal(a.identity.replay,4);assert.deepEqual(a.blocks,getFourStepTextSnapshot(c,s,{...ctx,replay:0}).blocks);
 });
 test(`${c.animationId}: semantic DOM has exact title and source order, one copy per cell`,()=>{
  const dom=new JSDOM(renderToStaticMarkup(<FourStepPlanScene config={c} frame={c.frameCount} onOpenKeyTerm={()=>{}}/>));const q=dom.window.document;
  assert.equal(q.querySelector('[data-lesson-text-block="root-title"]')?.textContent,c.title);
  assert.deepEqual([...q.querySelectorAll('[data-step]')].map((x:Element)=>x.getAttribute('data-step')),['1','2','3','4']);
  for(const cell of c.cells){const copy=q.querySelector(`[data-lesson-text-block="step-copy-${cell.step}"]`);assert.equal(copy?.textContent??null,cell.copy);}
  assert.equal(q.querySelectorAll('canvas,svg').length,0);assert.equal(q.querySelectorAll('[data-source-keyterm]').length,c.terms.length);dom.window.close();
 });
 test(`${c.animationId}: main source cue retains its own stream start and exact hash`,()=>{
  assert.equal(c.sourceAudio.length,1);const cue=c.sourceAudio[0];assert.equal(cue.frame,index===1?6:1);assert.equal(cue.endFrame,c.frameCount+1);assert.equal(cue.frameDomain,c.frameDomain);assert.equal(cue.language,'en');assert.equal(cue.spokenLanguage,'undetermined');assert.match(cue.sha256,/^[a-f0-9]{64}$/);assert.equal(caps[index].sourceTimelineAudioCues?.[0].sha256,cue.sha256);
 });
 for(const term of c.terms)test(`${c.animationId}: own ${term.key} gate and paused enabled focus-return target`,()=>{
  const [first,last]=term.activeFrames[0];assert.equal(isFourStepTermActive(term,first-1),false);assert.equal(isFourStepTermActive(term,first),true);assert.equal(isFourStepTermActive(term,last-1),true);assert.equal(isFourStepTermActive(term,last),false);
  const Renderer=caps[index].Renderer!;const ctx=context(c,c.frameCount);const dom=new JSDOM(renderToStaticMarkup(<Renderer {...ctx} paused={true} onLessonHostRequest={()=>{}}/>));
  const button=dom.window.document.querySelector(`[data-source-button="${term.button}"]`);assert(button);assert.equal(button.disabled,false);assert.equal(button.textContent,term.text);assert.equal(button.getAttribute('data-keyterm-entry-id'),term.entryId);dom.window.close();
 });
}
test('own TS002 first reveal is86,147,218 and TS003 first reveal is16,109,161',()=>{
 const [a,b]=G4_L4_FOUR_STEP_CONFIGS;assert.equal(getFourStepTeachingState(a,85).heading.visible,false);assert.equal(getFourStepTeachingState(a,86).heading.visible,true);assert.equal(getFourStepTeachingState(a,146).bullets[0].visible,false);assert.equal(getFourStepTeachingState(a,147).bullets[0].visible,true);assert.equal(getFourStepTeachingState(a,217).bullets[1].visible,false);assert.equal(getFourStepTeachingState(a,218).bullets[1].visible,true);
 assert.equal(getFourStepTeachingState(b,15).heading.visible,false);assert.equal(getFourStepTeachingState(b,16).heading.visible,true);
 // The own source projector, not the old G4L3 configuration, owns bullet gates.
 for(const bullet of getFourStepTeachingState(b,b.frameCount).bullets){const first=Array.from({length:b.frameCount},(_,i)=>i+1).find(f=>sourceAlpha(b,f,bullet.character)>0)!;assert.equal(sourceAlpha(b,first-1,bullet.character),0);assert(sourceAlpha(b,first,bullet.character)>0);}
});
test('TS003 source heading punctuation and TS006 spacing-only alias disposition are preserved',()=>{
 const [,b,c]=G4_L4_FOUR_STEP_CONFIGS;assert.equal(getFourStepTeachingState(b,b.frameCount).heading.text,'2  Organize the information.');assert.deepEqual(getFourStepTeachingState(c,1).cells.map(x=>x.copyState.text),['Restate the question.','Organize the information.','Solve the problem.','Check your answer.']);assert.deepEqual(c.cells.map(x=>x.aliasCharacters),[[6],[7],[8],[9]]);assert.deepEqual(c.shapes.board,[4,10]);assert.deepEqual(c.terms,[]);
});

test('TS006 complete alias sentences map to number plus adjacent copy, with exact run partition',()=>{
 const c:FourStepPlanConfig=G4_L4_FOUR_STEP_CONFIGS[2],d=draft[c.animationId];
 for(const cell of c.cells){const alias=d.texts[String(cell.aliasCharacters[0])],number=c.binding.blocks.find(b=>b.id===`step-${cell.step}`)!,copy=c.binding.blocks.find(b=>b.id===`step-copy-${cell.step}`)!;
  const numberRuns=alias.runs.filter((r:{text:string})=>/^\s*[1-4]\s*\.\s*$/.test(r.text));const copyRuns=alias.runs.filter((r:{text:string})=>!/^\s*[1-4]\s*\.\s*$/.test(r.text));
  assert.equal(numberRuns.length,1);for(const r of numberRuns){assert(number.sourceTextIds.includes(r.sourceTextId));assert(!copy.sourceTextIds.includes(r.sourceTextId));}
  for(const r of copyRuns){assert(copy.sourceTextIds.includes(r.sourceTextId));assert(!number.sourceTextIds.includes(r.sourceTextId));}
  const normalized=alias.text.replace(/\s+/g,' ').trim().replace(/\s+\./g,'.');assert.equal(`${cell.number} ${cell.copy}`,normalized);
  for(const frame of [1,c.frameCount]){const ctx=context(c,frame),s=getFourStepTextSnapshot(c,getters[2](frame,ctx),ctx);assert.equal(`${s.blocks.find(b=>b.id===number.id)!.text} ${s.blocks.find(b=>b.id===copy.id)!.text}`,normalized);}
 }
});

test('own original mains match EN requested audio only, never Spanish fallback automatically',()=>{
 for(const c of G4_L4_FOUR_STEP_CONFIGS){const cue=c.sourceAudio[0];const ctx={frameDomain:c.frameDomain,scenario:'source-static-frame',seed:0};assert.equal(audioCueMatchesContext(cue,{...ctx,lang:'en'}),true);assert.equal(audioCueMatchesContext(cue,{...ctx,lang:'es'}),false);assert.equal(audioCueMatchesContext(cue,{...ctx,lang:'en',frameDomain:'root'}),false);assert.equal(cue.spokenLanguage,'undetermined');}
});

const ownSAModules=[TS002Module,TS003Module,TS006Module];
for(const i of [0,2])test(`${G4_L4_FOUR_STEP_CONFIGS[i].animationId}: own exact SA is public-user activated, ES/domain scoped and pauses the host timeline`,()=>{
 const c=G4_L4_FOUR_STEP_CONFIGS[i],module=ownSAModules[i],migration=JSON.parse(readFileSync(path.join(root,`migrations/${c.animationId}/migration.json`),'utf8')),cue=migration.audio.cues.find((x:{language:string})=>x.language==='es'),tracks=module.audioTracks??[];
 assert.equal(tracks.length,1);const t=tracks[0];assert.equal(t.sha256,cue.sha256);assert.equal(t.durationMs,cue.durationMs);assert.equal(t.source,`/lesson-typography-v1/audio/${c.animationId}/spanish-host-narration.mp3`);assert.equal(t.id,`${c.animationId}-spanish-host-narration`);assert.equal(t.language,'es');assert.equal(t.activation,'user');assert.deepEqual(t.visibleWhen,['es']);assert.deepEqual(t.frameDomains,[c.frameDomain]);assert.equal(t.timelineBehavior,'pause-while-playing');assert.equal(cue.startSemantics,'host-user-activated');assert.equal(module.runtime?.defaultFrameDomain,c.frameDomain);
 assert.equal(tracks.filter(x=>x.visibleWhen.includes('en')).length,0);assert.equal(tracks.filter(x=>x.frameDomains?.includes('root')).length,0);assert.deepEqual(module.audioCues,[]);
});
test('own TS003 missing SA remains no module track and no borrowed audio',()=>{
 assert.deepEqual(TS003Module.audioTracks??[],[]);assert.deepEqual(G4_L4_FOUR_STEP_HOST_AUDIO_CANDIDATES['course-g04-l04-ts-003'],{audioCues:[],audioTracks:[]});const migration=JSON.parse(readFileSync(path.join(root,'migrations/course-g04-l04-ts-003/migration.json'),'utf8'));assert.equal(migration.audio.cues.filter((x:{language:string})=>x.language==='es').length,0);
});
test('SA second-argument binding introduces no automatic timeline cue or changes to own native main source policy',()=>{
 for(const [i,c]of G4_L4_FOUR_STEP_CONFIGS.entries()){assert.deepEqual(ownSAModules[i].audioCues,[]);assert.equal(caps[i].sourceTimelineAudioCues?.[0].language,'en');assert.equal(caps[i].sourceTimelineAudioCues?.[0].sha256,c.sourceAudio[0].sha256);assert.deepEqual(ownSAModules[i].runtime?.frameDomains?.find(x=>x.id===c.frameDomain),{id:c.frameDomain,frameCount:c.frameCount,fps:12,rootFrame:6});}
});
