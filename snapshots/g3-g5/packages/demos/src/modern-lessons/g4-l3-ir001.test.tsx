import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {loadAnimationModuleForPresentation} from '../animation-registry';
import type {RuntimeContext} from '../contract';
import original,{getCourseG04L03Ir001341242ccFrameState as frameState} from '../modules/course-g04-l03-ir-001-341242cc';
import {readTextSourceAsset} from '../../../../scripts/build-lesson-text-source-catalog-v1.mjs';
import {G4_L3_IR001_SOURCE_DATA as DATA} from './generated/g4-l3-ir001-source';
import {G4_L3_IR001_TEXT_BINDING as BINDING,G4_L3_IR001_TEXT_PRESENTATION as CAPABILITY,getG4L3Ir001TextSnapshot as snapshot,G4L3Ir001ModernRenderer as Renderer} from './g4-l3-ir001';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const context=(frame:number,overrides:Partial<RuntimeContext>={}):RuntimeContext=>({frame,frameDomain:'sprite-27',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0,...overrides});
const snap=(frame:number,overrides:Partial<RuntimeContext>={})=>{const c=context(frame,overrides);return snapshot(frameState(frame,c),c)};
const source=(async()=>{const index=JSON.parse(await readFile(root+'catalog/typography-v1/source-catalog/index.json','utf8'));return readTextSourceAsset(root,index.assets.find((a:any)=>a.sourceSha256===DATA.sourceSha256))})();

test('all136 host frames match original instance lifetime and opaque source alpha, including replacement gaps',async()=>{
 const s=await source,t=s.timelines.find((t:any)=>t.timelineId==='sprite-27'),textIds=new Set(s.textDefinitions.map((d:any)=>d.characterId));
 for(let frame=1;frame<=136;frame++){
  const visible=t.instances.filter((i:any)=>textIds.has(i.characterId)&&i.firstFrame<=frame&&i.lastFrameExclusive>frame).filter((i:any)=>{
   let color={multiply:[256,256,256,256],add:[0,0,0,0]};
   for(const e of t.events)if(e.instanceId===i.instanceId&&e.frame<=frame&&e.colorTransform)color=e.colorTransform;
   return color.multiply[3]+color.add[3]>0;
  });
  const expected=visible.filter((i:any)=>![12,13].includes(i.characterId)).map((i:any)=>i.instanceId);if(visible.some((i:any)=>[12,13].includes(i.characterId)))expected.push('title');
  const got=snap(frame);assert.equal(got.status,'ready');assert.deepEqual(got.blocks.filter(b=>b.visible).map(b=>b.id).sort(),expected.sort(),'frame'+frame);
 }
 assert.deepEqual(snap(78).blocks.filter(b=>b.visible).map(b=>b.id),['title']);
});

test('binding covers exact source runs and preserves generation identities; title collapses only its two paint runs',async()=>{
 const s=await source,ids=new Set(s.textDefinitions.flatMap((d:any)=>d.runs.map((r:any)=>r.sourceTextId)));
 assert.equal(BINDING.sourceSwfSha256,'2af6431db3ed786d9b48feec5a649887af92fb219a04e5dbd42e7e4b04087df4');
 const bound=new Set(BINDING.blocks.flatMap(b=>b.sourceTextIds));assert.deepEqual([...bound].sort(),[...ids].sort());
 assert.deepEqual(BINDING.blocks[0].sourceTextIds,['character-12/run-0','character-13/run-0']);
 assert.equal(new Set(BINDING.blocks.map(b=>b.id)).size,BINDING.blocks.length);
 for(const b of BINDING.blocks.slice(1)){assert(b.instance);assert.equal(b.instance.id,b.id);assert.equal(b.instance.path[0].timelineId,'sprite-27');assert.equal(b.instance.path[0].generation,Number(b.id.split('generation-')[1]));}
});

test('native intro retains genuine triplicates, source minus semantics and blank boundaryframes',()=>{
 for(const [frame,value]of [[2,'−4'],[19,'−17'],[38,'−25'],[57,'−40']] as const){const html=renderToStaticMarkup(<Renderer {...context(frame)}/>);assert.equal((html.match(/class="ir001-modern__number"/g)??[]).length,3);assert.equal(html.split('>'+value+'<').length-1,3);assert(!html.includes('<canvas'));}
 for(const frame of [1,18,37,56,78]){const html=renderToStaticMarkup(<Renderer {...context(frame)}/>);assert.equal((html.match(/class="ir001-modern__number"/g)??[]).length,0);}
 assert(!renderToStaticMarkup(<Renderer {...context(12)}/>).includes('<h2'));assert.equal((renderToStaticMarkup(<Renderer {...context(13)}/>).match(/<h2/g)??[]).length,1);
});

test('all136 rendered frames expose a named negative-number group only for source-visible instances',()=>{
 for(let frame=1;frame<=DATA.frameCount;frame++){
  const expected=DATA.instances.filter(i=>i.role==='negative'&&i.visibleRanges.some(([first,last])=>frame>=first&&frame<=last));
  const html=renderToStaticMarkup(<Renderer {...context(frame)}/>),group=html.match(/<div class="ir001-modern__numbers"([^>]*)>([\s\S]*?)<\/div>/);
  assert(group,'The visual number container must remain present at frame '+frame);
  const [,attributes,children]=group;
  if(expected.length){
   assert.match(attributes,/\brole="group"/,'Named semantic group missing at frame '+frame);
   assert.match(attributes,/\baria-label="Negative numbers"/,'Accessible group name missing at frame '+frame);
  }else{
   assert.doesNotMatch(attributes,/\b(?:role|aria-label)=/,'Empty source interval must not announce a named group at frame '+frame);
  }
  const rendered=[...children.matchAll(/<span\b([^>]*)>([^<]*)<\/span>/g)].map(([,attrs,text])=>({id:attrs.match(/data-source-instance="([^"]+)"/)?.[1],text}));
  assert.deepEqual(rendered,expected.map(i=>({id:i.instanceId,text:i.text.replace(/^–\s*/,'−').trim()})),'Source instance order, multiplicity or minus meaning changed at frame '+frame);
 }
});

test('final graph preserves all3 source shapes and all5 native labels in left-to-right order without early disclosure',()=>{
 const before=renderToStaticMarkup(<Renderer {...context(78)}/>),after=renderToStaticMarkup(<Renderer {...context(79)}/>);
 assert(!before.includes('<svg'));assert(after.includes('<svg'));assert(!after.includes('<canvas'));
 assert.deepEqual(DATA.graph.shapes.map(s=>s.characterId),[18,19,20]);assert.deepEqual(DATA.graph.labels.map(l=>l.text.trim()),['412','498','389','602','537']);
 for(const id of [18,19,20])assert(after.includes(`data-source-shape="${id}"`));
 for(const label of DATA.graph.labels)assert(after.includes(`data-source-character="${label.characterId}"`));
 assert.equal((after.match(/<text /g)??[]).length,5);assert.equal((after.match(/class="ir001-modern__number"/g)??[]).length,4);
 assert(DATA.graph.labels.every((label,i,labels)=>i===0||label.anchor.x>labels[i-1].anchor.x));
 // Source sequence rises/falls; do not sort values or replace the line with a list.
 assert(DATA.graph.shapes.find(s=>s.characterId===20)!.paths.some(p=>p.stroke&&p.stroke!=='none'));
 const dimensions=DATA.graph.viewBox;assert(dimensions[2]>0&&dimensions[3]>0);
 for(const l of DATA.graph.labels)assert(l.anchor.x>dimensions[0]&&l.anchor.x<dimensions[0]+dimensions[2]&&l.anchor.y>dimensions[1]&&l.anchor.y<dimensions[1]+dimensions[3]);
});

test('snapshot rejects mixed source/state/context identities instead of displaying substituted teaching text',()=>{
 const c=context(79),state=frameState(79,c);
 for(const patch of [{animationId:'other'},{sourceSwfSha256:'0'.repeat(64)},{status:'blocked'},{frameDomain:'root'},{rootFrame:1},{scenario:'other'},{language:'es'},{frame:78},{seed:1},{entryStateSha256:'a'.repeat(64)}]){
  const result=snapshot({...state,...patch} as typeof state,c);assert.equal(result.status,'blocked');assert.deepEqual(result.blocks,[]);
 }
 for(const patch of [{frame:0},{frame:137},{frame:79.5},{frameDomain:'root'},{rootFrame:1},{lang:'es' as const},{seed:-1},{seed:1},{replay:-1},{entryStateSha256:'a'.repeat(64)}])assert.equal(snapshot(state,{...c,...patch}).status,'blocked');
});

test('Replay and layout changes consume the same frame without a second clock or early final plot',()=>{
 assert.deepEqual(snap(79).blocks,snap(79,{replay:4}).blocks);assert.equal(snap(1,{replay:4}).blocks.filter(b=>b.visible).length,0);
 const paused=renderToStaticMarkup(<Renderer {...context(79)} paused reducedMotion/>),normal=renderToStaticMarkup(<Renderer {...context(79)}/>);assert.equal(paused,normal);
 assert.equal(CAPABILITY.playbackEndFrameByDomain?.['sprite-27'],136);assert.equal(CAPABILITY.reducedMotionFrameByDomain?.['sprite-27'],136);
});

test('real modern loader resolves native renderer and preserves both original base-audio seed branches',async()=>{
 const loaded=await loadAnimationModuleForPresentation('course-g04-l03-ir-001-341242cc',{modernText:true});
 assert(loaded);assert.equal(loaded.textPresentation?.Renderer,Renderer);assert.equal(loaded.textPresentation,CAPABILITY);
 assert.equal(CAPABILITY.sourceTimelineAudioCues,undefined);assert.deepEqual(loaded.audioCues,original.audioCues);assert.equal(loaded.audioCues?.length,2);
 for(const seed of [0,1,2,3]){
  const selected=loaded.audioCues!.filter(c=>seed%c.seedModulo!.divisor===c.seedModulo!.remainder);assert.equal(selected.length,1);assert.equal(selected[0].frame,5);assert.equal(selected[0].language,'en');assert.equal(selected[0].spokenLanguage,'undetermined');
 }
 for(const cue of loaded.audioCues!){const bytes=await readFile(root+'apps/web/public'+cue.source);assert.equal(createHash('sha256').update(bytes).digest('hex'),cue.sha256)}
 const html=renderToStaticMarkup(<Renderer {...context(79)}/>);assert(!html.includes('<audio')&&!html.includes('<canvas'));
});
