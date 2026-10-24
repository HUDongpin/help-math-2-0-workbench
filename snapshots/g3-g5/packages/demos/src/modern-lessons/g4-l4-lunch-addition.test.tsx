import assert from'node:assert/strict';
import test from'node:test';
import fs from'node:fs';
import {createHash}from'node:crypto';
import {gunzipSync}from'node:zlib';
import {fileURLToPath}from'node:url';
import React from'react';
import {renderToStaticMarkup}from'react-dom/server';
import type {RuntimeContext}from'../contract';
import {getCourseG04L04In008FrameState as readFrame}from'../modules/course-g04-l04-in-008';
import {G4_L4_LUNCH_ADDITION_CONFIG as config}from'./generated/g4-l4-lunch-addition-config';
import {G4_L4_IN008_TEXT_PRESENTATION as capability}from'./g4-l4-in008';
import {getLunchAdditionSnapshot}from'./g4-l4-lunch-addition';
import {LunchBillsScene,type LunchBillsConfig}from'./g4-l4-lunch-bills';
import {numberLineValue as value}from'./g4-l4-number-line';
import {LESSON_MANUAL_NARRATION_PCM as PCM}from'../generated/lesson-manual-narration-pcm';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),recipe=JSON.parse(fs.readFileSync(root+'scripts/inputs/typography-v1/g4-l4-lunch-addition/page.json','utf8'));
const ir=(key:string)=>JSON.parse(gunzipSync(fs.readFileSync(root+recipe.cachedExtraction[key].path)).toString());
const source=ir('source'),context=(frame:number,extra:Partial<RuntimeContext>={}):RuntimeContext=>({frame,frameDomain:'sprite-280',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:31,replay:0,...extra});
const snap=(f:number,extra:Partial<RuntimeContext>={})=>{const c=context(f,extra);return capability.getSnapshot(readFrame(f,c),c)},cfg:LunchBillsConfig=config;
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const html=(f:number)=>renderToStaticMarkup(<LunchBillsScene config={config} frame={f} figure={<canvas/>}/>);
test('IN008 binds all69source definitions and556instances; original menu and arithmetic remain source-backed',()=>{
 assert.equal(config.binding.blocks.length,130);const covered=new Set(config.binding.blocks.flatMap(b=>b.sourceTextIds));for(const d of source.textDefinitions)assert(covered.has(d.sourceTextId),d.characterId);
 const used=new Set([...config.menu.flatMap(x=>x.sourceInstances),...config.menuTitle.sourceInstances,...config.headings.flatMap(x=>x.sourceInstances),...config.labels.flatMap(x=>x.sourceInstances)].map(x=>x.instanceId));assert.deepEqual([...used].sort(),source.textInstances.map((x:any)=>x.instanceId).sort());
 const defs=new Map(source.textDefinitions.map((d:any)=>[d.characterId,d.runs.map((r:any)=>r.text).join('')]));assert.equal(config.title.text,defs.get(282));assert.equal(config.menuTitle.text,defs.get(194));for(const row of config.menu){assert.equal(row.text,defs.get(row.foodCharacter));assert.equal(row.price,defs.get(row.priceCharacter));}
 assert.equal(hash(fs.readFileSync(root+'apps/web/public'+config.adapter.url)),config.adapter.sha256);assert.equal(config.sourceRisksGloballyResolved,false);
});
test('IN008 all2082frames preserve source menu visibility, math instance visibility and exact17intro exclusions',()=>{
 for(let f=1;f<=2082;f++){
  const s=snap(f);assert.equal(s.status,'ready');assert.equal(s.identity.frame,f);
  assert.equal(s.suppressedInstances.length,f<=133?17:0);assert(s.suppressedInstances.every(x=>x.path[0].timelineId==='sprite-280'&&[34,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51].includes(x.path[0].characterId!)));
  const active=source.textInstances.filter((i:any)=>f>=i.firstFrame&&f<i.lastFrameExclusive&&i.states.some((x:any)=>f>=x.firstFrame&&f<x.endFrameExclusive&&x.state.sourceAlpha>0));
  const activeIds=new Set(active.map((i:any)=>i.instanceId));const byId=new Map(s.blocks.map(b=>[b.id,b]));
  for(const l of cfg.labels)assert.equal(byId.get(l.id)?.visible,l.sourceInstances.some(i=>activeIds.has(i.instanceId)),f+':'+l.id);
  const menuVisible=active.some((i:any)=>[34,194].includes(i.characterId));assert.equal(byId.get('menu-title')?.visible,menuVisible);
 }
});
test('IN008 retains blank transition, source headings, distinct food and price highlights and Replay',()=>{
 assert.equal(snap(133).blocks.filter(b=>b.visible).length,18);assert.equal(snap(134).blocks.filter(b=>b.visible).length,1);assert.equal(snap(141).blocks.filter(b=>b.visible).length,1);assert.equal(snap(142).blocks.filter(b=>b.visible).length,20);
 const chicken=cfg.menu[2];assert.equal(value(chicken.highlight,211,false),true);assert.equal(value(chicken.priceHighlight!,211,false),false);assert.equal(value(chicken.priceHighlight!,218,false),true);
 assert(!html(135).includes('<figure class="lunch-bills__intro" hidden=""'));assert(html(136).includes('<figure class="lunch-bills__intro" hidden=""'));assert(html(140).includes('<div class="lunch-bills__accounts" hidden=""'));assert(!html(141).includes('<div class="lunch-bills__accounts" hidden=""'));
 const reset=snap(1,{replay:2});assert.equal(reset.identity.replay,2);assert.equal(reset.suppressedInstances.length,17);assert.equal(capability.playbackEndFrameByDomain?.['sprite-280'],2082);assert.equal(capability.reducedMotionFrameByDomain?.['sprite-280'],2082);
});
function resultAt(owner:string,f:number){return cfg.labels.filter(l=>l.owner===owner&&!l.emphasis&&!l.accessibilityDuplicateOf).flatMap(l=>value(l.states,f,null)?.glyphs??[]).filter(g=>g.baseline===1598).sort((a,b)=>a.x-b.x).map(g=>g.text).join('')}
test('IN008 staged sums and final totals stay exact, including late decimal placement',()=>{
 assert.equal(resultAt('spark',827),'$10');assert.equal(resultAt('spark',1152),'$150');assert.equal(resultAt('spark',1509),'$2.50');assert.equal(resultAt('maria',1732),'$5');assert.equal(resultAt('maria',1744),'$125');assert.equal(resultAt('maria',2082),'$2.25');
 for(const l of cfg.labels.filter(l=>l.carryRoute)){
  const r=l.carryRoute!,first=value(l.states,r.startFrame,null)!,last=value(l.states,r.endFrame,null)!;assert.equal(first.glyphs[0].baseline,1598);assert(last.glyphs[0].baseline<0);assert(last.glyphs[0].fontScale!<1);let y=first.glyphs[0].baseline;for(let f=r.startFrame+1;f<=r.endFrame;f++){const now=value(l.states,f,null)!;assert(now.glyphs[0].baseline<y);y=now.glyphs[0].baseline;}assert(r.laneX>first.glyphs[0].x);
 }
});
test('IN008 pointer crosses to Maria at605 and six decimal markers apply to both bills',()=>{
 const pointer=cfg.guides.find(g=>g.character===254&&g.sourceInstances[0].firstFrame===585)!;assert.equal(value(pointer.states,604,null)?.owner,'spark');assert.equal(value(pointer.states,605,null)?.owner,'maria');assert.equal(cfg.guides.find(g=>g.character===258)?.owner,'both');
 const paths=cfg.guides.filter(g=>[233,251].includes(g.character));for(const g of paths){const first=g.sourceInstances[0].firstFrame,end=g.sourceInstances[0].lastFrameExclusive;assert.equal(value(g.states,first,null)?.alpha,0);assert(value(g.states,end-1,null)!.alpha>0);}
 assert.equal(cfg.labels.filter(l=>l.accessibilityDuplicateOf).length,29);
});
test('IN008 source identity and invalid runtime inputs fail closed',()=>{
 const c=context(600),s=readFrame(600,c);for(const change of[{animationId:'other'},{sourceSwfSha256:'0'.repeat(64)},{frame:599},{frameDomain:'root'},{rootFrame:5},{scenario:'other'},{language:'es'},{seed:9}]){const v=getLunchAdditionSnapshot(config,readFrame,{...s,...change}as typeof s,c);assert.equal(v.status,'blocked');assert.equal(v.blocks.length,0);assert.equal(v.suppressedInstances.length,0)}
 for(const change of[{frameDomain:'root'},{rootFrame:5},{lang:'es'},{scenario:'other'},{replay:-1},{replay:Number.NaN}]as Partial<RuntimeContext>[])assert.equal(snap(600,change).status,'blocked');
});
test('IN008 original continuous audio is bound, and missing Spanish narration is explicit',()=>{
 const cue=capability.sourceTimelineAudioCues?.[0];assert(cue);assert.equal(cue.frame,4);assert.equal(cue.endFrame,2082);assert.equal(cue.frameDomain,'sprite-280');assert.equal(hash(fs.readFileSync(root+'apps/web/public'+cue.source)),cue.sha256);const pcm=PCM[cue.sha256];assert(pcm,'Source cue must be in the actual runtime PCM index before build');assert.equal(pcm.sha256,recipe.audio.projection.outputSha256);assert.equal(pcm.frames,3820163);assert.equal(hash(fs.readFileSync(root+'apps/web/public'+pcm.source)),pcm.sha256);assert.equal(recipe.audio.projection.preservedSamples,3814903);assert.deepEqual(recipe.audio.projection.segments.map((s:any)=>s.firstFrame),[4]);assert.equal(recipe.audio.spanish.status,'source-missing');assert(!fs.existsSync(root+'apps/web/public/lesson-typography-v1/audio/g4-l4-lunch-addition/spanish-host-narration.mp3'));assert.equal(capability.keyTerms,undefined);
});

test('IN008 repeated source decimal points remain drawn once semantically across the35frame emphasis interval',()=>{
 const pairs=[['math-spark-d49-c227','math-spark-d30-c211'],['math-spark-d50-c227','math-spark-d31-c221'],['math-maria-d52-c227','math-maria-d38-c244'],['math-maria-d53-c227','math-maria-d39-c221']];
 for(const[id,baseId]of pairs){const l=cfg.labels.find(l=>l.id===id)!,base=cfg.labels.find(l=>l.id===baseId)!;assert.equal(l.accessibilityDuplicateOf,baseId);assert.equal(l.text,'.');
  assert.equal(value(l.states,588,null),null);assert.equal(value(l.states,624,null),null);
  for(let f=589;f<=623;f++){const s=value(l.states,f,null)!,b=value(base.states,f,null)!;assert(s.alpha>0&&b.alpha>0);for(const g of s.glyphs)assert(b.glyphs.some(q=>q.text===g.text&&q.x===g.x&&q.baseline===g.baseline&&q.fontScale===g.fontScale));}
  const dom=html(589);assert(dom.includes('data-source-duplicate-of="'+baseId+'"'));assert(snap(589).blocks.find(b=>b.id===id)?.visible);
 }
});
