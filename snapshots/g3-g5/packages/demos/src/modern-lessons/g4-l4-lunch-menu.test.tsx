import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import module,{getCourseG04L04Rw002FrameState as readFrame} from '../modules/course-g04-l04-rw-002';
import {G4_L4_LUNCH_MENU_CONFIG as config,G4_L4_LUNCH_MENU_HOST_AUDIO as host} from './generated/g4-l4-lunch-menu-config';
import {G4_L4_RW002_TEXT_PRESENTATION as capability} from './g4-l4-rw002';
import {getLunchMenuSnapshot} from './g4-l4-lunch-menu-state';
import {LunchMenuSurface} from './g4-l4-lunch-menu';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),recipe=JSON.parse(fs.readFileSync(root+'scripts/inputs/typography-v1/g4-l4-lunch-menu/page.json','utf8'));
const ir=(k:string)=>JSON.parse(gunzipSync(fs.readFileSync(root+recipe.cachedExtraction[k].path)).toString());
const source=ir('source'),roles=ir('roles');
const context=(frame:number,overrides:Partial<RuntimeContext & {uiLanguage:'en'|'es'}>={}):RuntimeContext=>({frame,frameDomain:'sprite-589',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:27,replay:0,...overrides});
const at=(frame:number,overrides:Partial<RuntimeContext & {uiLanguage:'en'|'es'}>={})=>{const ctx=context(frame,overrides);return getLunchMenuSnapshot(config,readFrame,readFrame(frame,ctx),ctx)};
const htmlAt=(frame:number)=>renderToStaticMarkup(<LunchMenuSurface config={config} snapshot={at(frame)} figure={<div data-test-source-figure="true"/>}/>);
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');

test('RW002: source title and all8 menu pairs are18 native blocks with original text and exact graphics binding',()=>{
 const definitions=new Map<number,any>(source.textDefinitions.map((d:any)=>[d.characterId,d]));const text=(cid:number)=>definitions.get(cid).runs.map((r:any)=>r.text).join('');
 assert.equal(config.title.text,text(592));assert.equal(config.menuTitle.text,text(32));for(const[i,row]of config.menu.entries()){assert.equal(row.food,text(34+i));assert.equal(row.price,text(42+i));}
 assert.equal(config.binding.blocks.length,18);const covered=new Set<string>(config.binding.blocks.flatMap(b=>b.sourceTextIds));for(const cid of[32,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,592])assert(covered.has('character-'+cid));assert(!covered.has('character-590'));assert(!htmlAt(2).includes('Your World Activity'));assert.equal(hash(fs.readFileSync(root+'apps/web/public'+config.adapter.url)),config.adapter.sha256);
});
test('RW002: all1567frames suppress exactly source text and paired highlight shapes, retaining masks',()=>{
 for(let f=1;f<=1567;f++){
  const s=at(f);assert.equal(s.status,'ready');const texts=source.textInstances.filter((i:any)=>f>=i.firstFrame&&f<i.lastFrameExclusive).map((i:any)=>i.instanceId);
  const shapes=roles.highlights.filter((i:any)=>f>=i.firstFrame&&f<i.lastFrameExclusive).map((i:any)=>i.shapeInstanceId);
  assert.deepEqual(s.suppressedInstances.map(i=>i.id).sort(),[...texts,...shapes].sort());assert(!s.suppressedInstances.some(i=>i.path.some(p=>p.characterId===1)));
  assert.equal(s.blocks.filter(b=>b.visible).length,f===1?1:18);
 }
});
test('RW002: six food/price pairs preserve24normal-motion highlight intervals and steady reduced-motion group bounds',()=>{
 assert.equal(config.highlights.length,6);assert.deepEqual(config.highlights.map(g=>g.foodCharacterId),[36,38,37,39,41,40]);
 for(const g of config.highlights){assert.equal(g.intervals.length,4);assert.equal(g.firstFrame,g.intervals[0][0]);assert.equal(g.lastFrameExclusive,g.intervals.at(-1)![1]);
  for(let f=g.firstFrame-1;f<=g.lastFrameExclusive;f++){
   const expected=roles.highlights.some((h:any)=>h.foodCharacterId===g.foodCharacterId&&f>=h.firstFrame&&f<h.lastFrameExclusive);
   const row=htmlAt(f).match(new RegExp(`<tr data-source-food-id="${g.foodCharacterId}"[^>]+>`))?.[0];assert(row);assert(row.includes(`data-source-highlight="${expected}"`));assert(row.includes(`data-highlight-group="${f>=g.firstFrame&&f<g.lastFrameExclusive}"`));
  }
 }
});
test('RW002: source final removes cafeteria characters; native final menu starts exactly1567 and Replay restores scene',()=>{
 assert.deepEqual(roles.finalDisplayList.map((e:any)=>e.characterId),[1,588,587,585,32,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49]);
 assert(htmlAt(1548).includes('data-menu-focus="false"'));assert(htmlAt(1549).includes('data-menu-focus="true"'));assert(!htmlAt(1566).includes('<figure class="lunch-menu__scene" hidden=""'));assert(htmlAt(1567).includes('<figure class="lunch-menu__scene" hidden=""'));
 const reset=at(1,{replay:1,uiLanguage:'es'});assert.equal(reset.identity.replay,1);assert.equal(reset.identity.frame,1);assert.equal(reset.identity.language,'en');assert.equal(reset.blocks.filter(b=>b.visible).length,1);assert(!htmlAt(1).includes('<figure class="lunch-menu__scene" hidden=""'));assert.equal(capability.playbackEndFrameByDomain?.['sprite-589'],1567);assert.equal(capability.reducedMotionFrameByDomain?.['sprite-589'],1567);
});
test('RW002: mismatched frame identity blocks native text and source exclusions',()=>{
 const ctx=context(434),valid=readFrame(434,ctx);for(const change of[{animationId:'other'},{sourceSwfSha256:'0'.repeat(64)},{frame:433},{frameDomain:'root'},{rootFrame:5},{scenario:'other'},{language:'es'},{seed:9}]){const s=getLunchMenuSnapshot(config,readFrame,{...valid,...change}as typeof valid,ctx);assert.equal(s.status,'blocked');assert.equal(s.blocks.length,0);assert.equal(s.suppressedInstances.length,0)}
 for(const change of[{frameDomain:'root'},{rootFrame:5},{lang:'es'},{scenario:'other'},{replay:-1},{replay:Number.NaN}]as Partial<RuntimeContext>[])assert.equal(at(434,change).status,'blocked');
});
test('RW002: original five-part main stream and separate manual Spanish Audio keep hash and timing identity',()=>{
 const cue=capability.sourceTimelineAudioCues?.[0];assert(cue);assert.equal(cue.frame,11);assert.equal(cue.endFrame,1546);assert.equal(cue.frameDomain,'sprite-589');assert.equal(hash(fs.readFileSync(root+'apps/web/public'+cue.source)),cue.sha256);assert.deepEqual(recipe.audio.projection.segments.map((s:any)=>s.firstFrame),[11,495,676,782,1003]);assert.equal(recipe.audio.projection.preservedSamples,2687095);
 const es=host.audioTracks[0];assert.equal(es.activation,'user');assert.equal(es.timelineBehavior,'pause-while-playing');assert.deepEqual(es.visibleWhen,['es']);assert.equal(hash(fs.readFileSync(root+'apps/web/public'+es.source)),es.sha256);assert(module);assert.equal(config.sourceRisksGloballyResolved,false);assert.equal(capability.keyTerms,undefined);assert(!htmlAt(1567).includes('<button'));
});
