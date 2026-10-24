import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import module, {getCourseG04L04Rw004FrameState as readFrame} from '../modules/course-g04-l04-rw-004';
import {G4_L4_LUNCH_ACTIVITY_CONFIG as config, G4_L4_LUNCH_ACTIVITY_HOST_AUDIO as host} from './generated/g4-l4-lunch-activity-config';
import {G4_L4_RW004_TEXT_PRESENTATION as capability} from './g4-l4-rw004';
import {getLunchActivitySnapshot} from './g4-l4-lunch-activity-state';
import {LunchActivitySurface} from './g4-l4-lunch-activity';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const input=root+'scripts/inputs/typography-v1/g4-l4-lunch-activity/';
const recipe=JSON.parse(fs.readFileSync(input+'page.json','utf8'));
const ir=(key:string)=>JSON.parse(gunzipSync(fs.readFileSync(root+recipe.cachedExtraction[key].path)).toString());
const source=ir('source'),question=ir('question'),scene=ir('scene');
const context=(frame:number,overrides:Partial<RuntimeContext & {uiLanguage:'en'|'es'}>={}):RuntimeContext=>({frame,frameDomain:'sprite-1075',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:27,replay:0,...overrides});
const at=(frame:number,overrides:Partial<RuntimeContext & {uiLanguage:'en'|'es'}>={})=>{const ctx=context(frame,overrides);return getLunchActivitySnapshot(config,readFrame,readFrame(frame,ctx),ctx);};
const htmlAt=(frame:number)=>renderToStaticMarkup(<LunchActivitySurface config={config} snapshot={at(frame)} figure={<div/>} onLessonHostRequest={()=>{}}/>);
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');

test('RW004: all source menu pairs, visible title, question and bitmap value retain their own bindings',()=>{
 const definitions=new Map<number,any>(source.textDefinitions.map((d:any)=>[d.characterId,d]));
 const text=(cid:number)=>definitions.get(cid).runs.map((r:any)=>r.text).join('');
 assert.equal(config.title.text,text(1078));assert.equal(config.menuTitle.text,text(46));
 for(const [i,row]of config.menu.entries()){assert.equal(row.food,text(48+i));assert.equal(row.price,text(56+i));}
 assert.equal(config.words.map(w=>w.text).join(' '),text(1063).trim());
 assert.equal(config.binding.blocks.length,31);assert.deepEqual(config.binding.blocks.find(b=>b.id==='money-value')?.sourceBitmapIds,[183]);
 const covered=new Set<string>(config.binding.blocks.flatMap(b=>b.sourceTextIds));for(const cid of [46,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,1063,1078])assert(covered.has('character-'+cid));
 assert(!covered.has('character-1076'));assert(!htmlAt(1).includes('Your World Activity'));
 assert.equal(hash(fs.readFileSync(root+'apps/web/public'+config.adapter.url)),config.adapter.sha256);
});

test('RW004: every one of1027 source frames uses exact instance suppression, word order and money lifetime',()=>{
 let priorWords=0;
 for(const plan of scene.plans){const f=plan.frame,s=at(f);assert.equal(s.status,'ready');assert.deepEqual(s.suppressedInstances.map(i=>i.id).sort(),[...plan.excludedInstanceIds].sort());
  const words=s.blocks.filter(b=>b.id.startsWith('question-')&&b.visible);const expected=question.words.filter((w:any)=>f>=w.firstCompleteInkFrame);assert.deepEqual(words.map(w=>w.text),expected.map((w:any)=>w.text));assert(words.length>=priorWords);priorWords=words.length;
  assert.equal(s.blocks.find(b=>b.id==='money-value')?.visible,f>=523&&f<536);
 }
 assert.equal(priorWords,12);assert.equal(at(951).blocks.filter(b=>b.id.startsWith('question-')&&b.visible).length,0);
});

test('RW004: four links appear only after their complete source words and use exact source dictionary actions',()=>{
 const dictionary=JSON.parse(fs.readFileSync(root+recipe.dictionary.path,'utf8'));
 for(const t of config.terms){assert(source.sourceActions.includes(`_global.KeyAttribute = "${t.sourceKey}";`));assert.equal(dictionary.entries.find((e:any)=>e.id===t.entryId).titles.en,t.title);
  assert(!htmlAt(t.visibleFrom-1).includes(`data-source-button-id="${t.sourceButtonId}"`));assert(htmlAt(t.visibleFrom).includes(`data-source-button-id="${t.sourceButtonId}"`));
 }
 assert.equal((htmlAt(1027).match(/<button\b/g)||[]).length,4);
 const early=htmlAt(1005);assert(early.includes('question-8'));assert(early.includes('data-lesson-text-block="question-9" aria-hidden="true" style="visibility:hidden"'));assert(!early.includes('data-source-button-id="1067"'));
});

test('RW004: mismatched identity fails closed without suppressing source art',()=>{
 const ctx=context(1027),valid=readFrame(1027,ctx);
 for(const changed of [{animationId:'other'},{sourceSwfSha256:'0'.repeat(64)},{frame:1026},{frameDomain:'root'},{rootFrame:5},{scenario:'other'},{language:'es'},{seed:9}]){
  const s=getLunchActivitySnapshot(config,readFrame,{...valid,...changed} as typeof valid,ctx);assert.equal(s.status,'blocked');assert.equal(s.blocks.length,0);assert.equal(s.suppressedInstances.length,0);
 }
 for(const override of [{frameDomain:'root'},{rootFrame:5},{lang:'es'},{scenario:'other'},{replay:-1},{replay:Number.NaN}]as Partial<RuntimeContext>[]){assert.equal(at(1027,override).status,'blocked');}
});

test('RW004: Replay resets question, money and frame identity; source English remains under Spanish UI',()=>{
 const end=at(1027,{replay:0}),start=at(1,{replay:1,uiLanguage:'es'});assert.equal(end.blocks.filter(b=>b.id.startsWith('question-')&&b.visible).length,12);
 assert.equal(start.identity.replay,1);assert.equal(start.identity.frame,1);assert.equal(start.identity.language,'en');assert.equal(start.blocks.filter(b=>b.id.startsWith('question-')&&b.visible).length,0);
 assert.equal(start.blocks.find(b=>b.id==='money-value')?.visible,false);assert.equal(start.status,'ready');
 assert.equal(capability.playbackEndFrameByDomain?.['sprite-1075'],1027);assert.equal(capability.reducedMotionFrameByDomain?.['sprite-1075'],1027);
});

test('RW004: main source audio and separate manual Spanish track are hash-bound and retain source timing',()=>{
 const cue=capability.sourceTimelineAudioCues?.[0];assert(cue);assert.equal(cue.frame,6);assert.equal(cue.endFrame,1027);assert.equal(cue.frameDomain,'sprite-1075');assert.equal(cue.language,'en');assert.equal(hash(fs.readFileSync(root+'apps/web/public'+cue.source)),cue.sha256);
 const es=host.audioTracks[0];assert.equal(es.activation,'user');assert.equal(es.timelineBehavior,'pause-while-playing');assert.deepEqual(es.visibleWhen,['es']);assert.equal(es.durationMs,22680);assert.equal(hash(fs.readFileSync(root+'apps/web/public'+es.source)),es.sha256);
 assert(module);assert.equal(config.sourceRisksGloballyResolved,false);
});
