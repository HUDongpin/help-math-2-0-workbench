import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import type {RuntimeContext} from '../contract';
import {G4_L3_RW002_SOURCE_DATA as GENERATED} from './generated/g4-l3-rw002-source';
import {G4_L3_RW002_TEXT_BINDING as BINDING,G4_L3_RW002_TEXT_PRESENTATION as CAPABILITY,G4L3Rw002ModernRenderer as Renderer,getRw002NativeFrameState as frameState,getRw002TextSnapshot as snapshot,getRw002NativeScene as scene,createRw002GlossaryRequest,rw002SourceHitIntersection,RW002_NATIVE_DISPOSITIONS} from './g4-l3-rw002';
import {Rw002ShapePaints,interpolateRw002Path,rw002Rgba,type Rw002Shape,type Rw002Bitmap,type Rw002ColorTransform} from './g4-l3-rw002-source-paints';
const DATA=GENERATED as unknown as {sourceSha256:string;texts:readonly any[];shapes:readonly Rw002Shape[];bitmaps:readonly Rw002Bitmap[];instances:readonly any[];rootTitles:readonly any[];rootMatrix:readonly number[];stage:{width:number};signedLinePairings:readonly any[];minusGlyphInk:any;glossary:{terms:readonly any[]};verification:any;allOriginalRisksResolved:boolean;sourceWarnings:readonly any[]};
const context=(frame:number,patch:Partial<RuntimeContext>={}):RuntimeContext=>({frame,frameDomain:'sprite-421',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0,...patch});
const snap=(f:number)=>{const c=context(f);return snapshot(frameState(f,c),c);};
const documentAt=(frame:number)=>new JSDOM(renderToStaticMarkup(<Renderer {...context(frame)} onLessonHostRequest={()=>{}}/>)).window.document;
const catalog=readFile(new URL('../../../../catalog/typography-v1/source-catalog/assets/8b2aa7afd7e82fc582b8e7b936d178c87fea16106b26061f872c81ea7d422785.json.gz',import.meta.url)).then(b=>JSON.parse(gunzipSync(b).toString()));
const oracle=readFile(new URL('../../../../work/typography-v1/pipeline-v575/next-rw002-intake/source-generator-static-review-r1/direct-gradient-source-oracle-r3.json',import.meta.url),'utf8').then(s=>JSON.parse(s));
const IDENTITY:Rw002ColorTransform={multiply:[256,256,256,256],add:[0,0,0,0],divisor:256};

/** Independent catalog event replay; replacement keeps live depth channels,
 * a non-move placement starts fresh, and removal deletes the old actor. */
function catalogFrames(raw:any){
 const t=raw.timelines.find((t:any)=>t.timelineId==='sprite-421'),live=new Map<number,any>(),out:any[][]=[];
 for(let f=1;f<=1289;f++){
  for(const e of t.events.filter((e:any)=>e.frame===f)){
   if(e.kind==='remove'){assert(live.delete(e.depth));continue;}
   if(e.tagName!=='PlaceObject2')continue;
   const before=live.get(e.depth);let actor=before;
   if(e.characterId!==undefined){if(e.move)assert(before);actor={...(e.move?before:{matrix:[1,0,0,1,0,0],colorTransform:IDENTITY,ratio:0,clipDepth:null}),instanceId:e.instanceId,characterId:e.characterId,depth:e.depth};}
   assert(actor);actor={...actor};for(const key of ['matrix','colorTransform','ratio','clipDepth'])if(Object.hasOwn(e,key))actor[key]=e[key];live.set(e.depth,actor);
  }
  const nodes=[...live.values()].sort((a,b)=>a.depth-b.depth);out.push(nodes.map(n=>({...n,sourceAlpha:(n.colorTransform.multiply[3]+n.colorTransform.add[3])/256,maskInstanceIds:nodes.filter(m=>m.clipDepth!==null&&m.depth<n.depth&&n.depth<=m.clipDepth).map(m=>m.instanceId)})));
 }
 return out;
}

test('own002 binds all43 definitions/47 runs/359 shapes/17 bitmaps and preserves offstage dispositions',async()=>{
 const raw=await catalog;
 assert.equal(DATA.sourceSha256,raw.sourceSha256);assert.equal(DATA.texts.length,43);assert.equal(DATA.shapes.length,359);assert.equal(DATA.bitmaps.length,17);
 assert.deepEqual([...new Set(BINDING.blocks.flatMap(b=>b.sourceTextIds))].sort(),raw.textDefinitions.flatMap((t:any)=>t.runs.map((r:any)=>r.sourceTextId)).sort());
 assert.deepEqual(BINDING.blocks.find(b=>b.id==='figure-description')!.sourceShapeIds,[...DATA.shapes.map(s=>s.characterId)]);
 assert.deepEqual(BINDING.blocks.find(b=>b.id==='figure-description')!.sourceBitmapIds,[2,3,4,5,6,10,11,83,84,85,86,87,124,126,128,226,229]);
 assert.equal(new Set(BINDING.blocks.map(b=>b.id)).size,BINDING.blocks.length);
 const d=documentAt(1289);assert.equal(d.querySelector('[data-source-character="365"]'),null);assert.equal(d.querySelector('[data-source-character="422"]'),null);
 assert.equal(d.querySelector('h2[data-source-character="424"]')!.textContent,'Negative Numbers: Your World');
 assert.equal(d.querySelector('h2')!.getAttribute('data-source-combined-matrix'),'1 0 0 1 3781 584');
 for(const id of [365,422]){assert.equal(DATA.texts.find(t=>t.characterId===id).nativeReadableRequired,false);assert(snap(1289).blocks.filter(b=>BINDING.blocks.find(x=>x.id===b.id)?.instance?.path[0].characterId===id).every(b=>!b.visible));}
 assert.equal(DATA.allOriginalRisksResolved,false);assert.deepEqual(DATA.sourceWarnings,raw.risks);
});

test('all1289 source frames retain independent catalog channel inheritance and source text lifetimes',async()=>{
 const expected=catalogFrames(await catalog),textIds=new Set<number>(DATA.texts.filter(t=>t.nativeReadableRequired).map(t=>t.characterId));
 for(let f=1;f<=1289;f++){
  assert.deepEqual(scene(f),expected[f-1],'source actor/channel/depth/mask frame'+f);
  const got=snap(f);assert.equal(got.status,'ready');
  assert.deepEqual(got.blocks.filter(b=>b.visible&&b.id.startsWith('sprite-421/')).map(b=>b.id).sort(),expected[f-1].filter(p=>p.sourceAlpha>0&&textIds.has(p.characterId)).map(p=>p.instanceId).sort(),'text lifetime frame'+f);
  assert.equal(got.identity.frame,f);assert.equal(got.identity.frameDomain,'sprite-421');
 }
 const e=expected[120].find(p=>p.depth===49);assert.equal(e.characterId,55);assert.deepEqual(e.matrix,[0.8798065185546875,-0.7280120849609375,0.7280120849609375,0.8798065185546875,2158,-553]);
});

test('table has three exact zero-alpha boundaries, own Fahrenheit rows and distinct black/yellow captions',()=>{
 const intervals=[[184,276],[304,444],[966,1289]];
 for(const [first,last] of intervals){
  assert.equal(scene(first).filter(p=>p.characterId>=90&&p.characterId<=109).length,20);
  assert(scene(first).filter(p=>p.characterId>=90&&p.characterId<=109).every(p=>p.sourceAlpha===0));
  assert.equal(snap(first).blocks.filter(b=>{const ch=BINDING.blocks.find(x=>x.id===b.id)?.instance?.path[0].characterId;return b.visible&&ch!==undefined&&ch>=90&&ch<=109;}).length,0);
  const d=documentAt(first+1),captions=[...d.querySelectorAll('text[data-source-character="91"],text[data-source-character="92"]')];assert.equal(captions.length,2);assert.equal(captions[0].textContent,captions[1].textContent);
  assert.notEqual(captions[0].getAttribute('data-source-instance'),captions[1].getAttribute('data-source-instance'));assert.notEqual(captions[0].getAttribute('x'),captions[1].getAttribute('x'));
  assert.equal(captions[0].querySelector('tspan')!.getAttribute('fill'),'rgba(0,0,0,1)');assert.equal(captions[1].querySelector('tspan')!.getAttribute('fill'),'rgba(255,255,0,1)');
  assert(d.querySelector('text[data-source-character="94"]')!.textContent!.includes('°F'));assert(d.querySelector('text[data-source-character="95"]')!.textContent!.includes('°F'));
  for(const id of [94,95]){
   const text=d.querySelector('text[data-source-character="'+id+'"]')!,runs=[...text.querySelectorAll('tspan')],source=DATA.texts.find(t=>t.characterId===id),actor=scene(first+1).find(p=>p.instanceId===text.getAttribute('data-source-instance'))!;
   assert.equal(text.getAttribute('text-anchor'),'start','Source temperature headers keep their two left-aligned lines');
   assert.deepEqual(runs.map(r=>r.textContent),id===94?['Highest Recorded ','Temperature (in °F)']:['Lowest Recorded ','Temperature (in °F)']);
   assert.deepEqual(runs.map(r=>Number(r.getAttribute('data-source-run-baseline-twips'))),[180,380]);
   assert(Math.abs((Number(runs[1].getAttribute('y'))-Number(runs[0].getAttribute('y')))-actor.matrix[3]*200/20)<1e-10,'Source200-twip baseline separation through own placement matrix; sub-1e-10 SVG rounding only');
   const expectedX=(actor.matrix[0]*source.boundsTwips.left+actor.matrix[4]+DATA.rootMatrix[4])/20;
   assert.equal(Number(runs[0].getAttribute('x')),expectedX);assert.equal(Number(runs[1].getAttribute('x')),expectedX,'Second source run x reset0 preserves left column edge');
   assert.equal(text.getAttribute('data-source-text-matrix'),'1 0 0 1 774 0');
  }
  for(const id of [105,106,107,108,109])assert.equal(d.querySelector('text[data-source-character="'+id+'"]')!.textContent,DATA.texts.find(t=>t.characterId===id).text);
  if(last<1289)assert.equal(scene(last+1).filter(p=>p.characterId>=90&&p.characterId<=109).length,0);
 }
 assert(scene(276).filter(p=>p.characterId>=90&&p.characterId<=109).every(p=>p.sourceAlpha===0),'First table is placed but fully faded at276 before removal277');assert.equal(documentAt(276).querySelectorAll('text[data-source-character="91"],text[data-source-character="92"]').length,0);
 const highlights=DATA.instances.filter(i=>i.characterId===123);assert.deepEqual(highlights.map(i=>[i.firstFrame,i.lastFrameExclusive-1]),[[363,363],[365,365],[367,367],[400,416],[984,984],[986,986],[988,988],[990,1087]]);
 for(const i of highlights){assert.equal(i.depth,173);assert(scene(i.firstFrame).find(p=>p.instanceId===i.instanceId)!.maskInstanceIds.length===0);assert.equal(snap(i.firstFrame).blocks.find(b=>b.id===i.instanceId)!.text,'-80°');}
});

test('final source keeps eight separate400 minus actors at their exact ink anchors and full35-character explanation',()=>{
 assert.deepEqual(DATA.signedLinePairings.map(p=>p.value),[-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8]);
 const signs=scene(1126).filter(p=>p.characterId===400);assert.equal(signs.length,8);assert.deepEqual(signs.map(p=>p.depth),[146,147,148,149,150,151,152,153]);assert(signs.every(p=>p.sourceAlpha===0));
 const d=documentAt(1289),paint=[...d.querySelectorAll('text[data-source-character="400"]')];assert.equal(paint.length,8);assert.equal(new Set(paint.map(p=>p.getAttribute('data-source-instance'))).size,8);
 for(const p of paint){assert.equal(p.textContent,'−');assert.equal(p.getAttribute('text-anchor'),'end');const actor=scene(1289).find(a=>a.instanceId===p.getAttribute('data-source-instance'))!,ink=DATA.minusGlyphInk.inkCharacterBoundsTwips;assert.equal(Number(p.getAttribute('x')),(actor.matrix[0]*ink.right+actor.matrix[4]+DATA.rootMatrix[4])/20);assert.equal(p.getAttribute('data-source-matrix'),actor.matrix.join(' '));}
 const explanation=d.querySelector('text[data-source-character="375"]')!;assert.equal(explanation.textContent,'Negative numbers are less than zero');assert.equal([...explanation.textContent!].length,35);
 assert.deepEqual([...explanation.querySelectorAll('tspan')].map(s=>s.textContent),['Negative numbers',' are ','less than zero']);assert.deepEqual([...explanation.querySelectorAll('tspan')].map(s=>s.getAttribute('fill')),['rgba(0,0,204,1)','rgba(0,0,0,1)','rgba(0,0,204,1)']);
 assert.equal(RW002_NATIVE_DISPOSITIONS.signTransfer,false);
});

test('all45 direct fills and1649 ordered overlays retain source coordinates/stops/rules without dropping any path',async()=>{
 const raw=await oracle,byId=new Map<number,Rw002Shape>(DATA.shapes.map(s=>[s.characterId,s]));
 assert.equal(raw.orderedAll1694GradientOperations.length,1694);assert.equal(raw.all45DirectGradientFullWitnesses.length,45);
 let count=0;
 for(const helper of raw.orderedAll13968PathPrimaryPaintMapping){
  const shape=byId.get(helper.characterId)!,d=new JSDOM(renderToStaticMarkup(<svg><Rw002ShapePaints shape={shape} ratio={0} idPrefix={'own'+shape.characterId} colorTransform={IDENTITY} bitmaps={new Map(DATA.bitmaps.map(b=>[b.characterId,b]))}/></svg>)).window.document;
  assert.equal(shape.paths.length,helper.pathCount);count+=shape.paths.length;
  const observed=[...d.querySelectorAll('[data-source-paint-kind]')].map(n=>n.getAttribute('data-source-paint-kind'));
  assert.deepEqual(observed,shape.paths.flatMap(p=>p.paintOperations.map(o=>o.kind)),'ordered source paints shape'+shape.characterId);
  for(const w of raw.orderedAll1694GradientOperations.filter((w:any)=>w.characterId===shape.characterId)){
   const p=shape.paths[w.pathIndex],op=p.paintOperations[w.operationIndexInPath],node=d.querySelector('[data-source-gradient-witness="'+w.gradientSequenceIndex+'"]')!;
   assert(node);assert.deepEqual(op.coordinates,w.gradientCoordinates);assert.deepEqual(op.transforms,w.gradientTransforms);
   assert.deepEqual(op.stops!.map(s=>({offset:s.offset,rgba:'rgba' in s.color?s.color.rgba:null})),w.gradientStops.map((s:any)=>({offset:s.offset,rgba:s.rgba})));
   const gradient=d.getElementById(node.tagName.toLowerCase()==='path'?node.getAttribute('fill')!.slice(5,-1):node.querySelector('rect')!.getAttribute('fill')!.slice(5,-1))!;
   assert.deepEqual([...gradient.querySelectorAll('stop')].map(s=>s.getAttribute('stop-color')),w.gradientStops.map((s:any)=>'rgba('+s.rgba.join(',')+')'));
   if(w.operationIndexInPath===0){assert.equal(node.tagName.toLowerCase(),'path');assert.equal(node.getAttribute('d'),w.fullPathData??p.d);assert.equal(node.getAttribute('fill-rule'),'evenodd');assert.equal(node.getAttribute('clip-path'),null);assert.equal(gradient.tagName.toLowerCase(),'lineargradient');assert.equal(gradient.getAttribute('gradientTransform'),null);}
   else{assert.equal(p.paintOperations[0].kind,'solid-fill');assert.equal(gradient.tagName.toLowerCase(),'radialgradient');const clip=d.getElementById(node.getAttribute('clip-path')!.slice(5,-1))!;assert.equal(clip.children.length,1);assert.equal(clip.children[0].getAttribute('d'),p.d);assert.equal(clip.children[0].getAttribute('clip-rule'),'nonzero');assert.equal(node.querySelector('rect')!.getAttribute('transform'),'matrix('+op.transforms![0].join(' ')+')');}
  }
 }
 assert.equal(count,13968);assert.deepEqual(DATA.verification.paintCounts,{'solid-fill':9036,'source-gradient-fill':45,'source-gradient-overlay':1649,'source-bitmap-fill':95,'source-stroke':4793});
});

test('own bitmaps preserve all95 real fill operations and RGB filters keep source pixel alpha separate',()=>{
 const transformed:Rw002ColorTransform={multiply:[128,192,256,128],add:[9,11,16,0],divisor:256},bitmaps=new Map(DATA.bitmaps.map(b=>[b.characterId,b]));let count=0;
 for(const shape of DATA.shapes.filter(s=>s.paths.some(p=>p.paintOperations.some(o=>o.kind==='source-bitmap-fill')))){
  const d=new JSDOM(renderToStaticMarkup(<svg><Rw002ShapePaints shape={shape} ratio={0} idPrefix={'bitmap'+shape.characterId} colorTransform={transformed} bitmaps={bitmaps}/></svg>)).window.document;
  count+=d.querySelectorAll('[data-source-paint-kind="source-bitmap-fill"]').length;
  for(const image of d.querySelectorAll('image')){const b=bitmaps.get(Number(image.getAttribute('data-source-bitmap-id')))!;assert.equal(image.getAttribute('href'),b.href);assert.equal(image.getAttribute('data-source-bitmap-sha256'),b.cacheBytesSha256);const filter=d.getElementById(image.getAttribute('filter')!.slice(5,-1))!;assert.equal(filter.querySelector('feFuncA')!.getAttribute('type'),'identity');assert.equal(filter.querySelector('feFuncR')!.getAttribute('slope'),'0.5');assert.equal(image.getAttribute('opacity'),null);}
  assert([...d.querySelectorAll('clipPath path')].every(p=>p.getAttribute('clip-rule')==='nonzero'));
 }
 assert.equal(count,95);assert.equal(bitmaps.has(65535),false);
 assert.deepEqual(rw002Rgba({kind:'static-rgba',rgba:[20,40,60,.5]},0,transformed),[19,41,76,.5]);
 assert.throws(()=>rw002Rgba({kind:'static-rgba',rgba:[20,40,60,.5]},0,{...transformed,add:[0,0,0,1]}),/alpha-offset/);
});

test('display-list masks use only direct paths and preserve all source depth ranges, morph endpoints and paint ordering',()=>{
 for(const f of [1,185,305,363,530,967,1099,1115,1127,1289]){
  const nodes=scene(f),d=documentAt(f);
  for(const m of nodes.filter(n=>n.clipDepth!==null)){const clip=d.querySelector('clipPath[data-source-mask="'+m.characterId+'"]')!,shape=DATA.shapes.find(s=>s.characterId===m.characterId)!;assert.equal(clip.querySelectorAll('g').length,0);assert.equal(clip.children.length,shape.paths.length);assert.equal(clip.getAttribute('data-source-clip-depth'),String(m.clipDepth));for(let k=0;k<shape.paths.length;k++){assert.equal(clip.children[k].tagName.toLowerCase(),'path');assert.equal(clip.children[k].getAttribute('d'),interpolateRw002Path(shape.paths[k],m.ratio));assert.equal(clip.children[k].getAttribute('transform'),'scale(.05) matrix('+DATA.rootMatrix.join(' ')+') matrix('+m.matrix.join(' ')+')');assert.equal(clip.children[k].getAttribute('clip-rule'),'evenodd');}}
  for(const n of d.querySelectorAll('svg [data-source-instance]:not([data-source-root-shape])')){const actor=nodes.find(a=>a.instanceId===n.getAttribute('data-source-instance'))!,masks:number[]=[];for(let p=n.parentElement;p&&p.tagName.toLowerCase()!=='svg';p=p.parentElement){const m=p.getAttribute('clip-path')?.match(/-mask-(\d+)\)/);if(m)masks.push(Number(m[1]));}assert.deepEqual(masks.sort((a,b)=>a-b),nodes.filter(m=>m.clipDepth!==null&&m.depth<actor.depth&&actor.depth<=m.clipDepth).map(m=>m.depth).sort((a,b)=>a-b));}
  assert.equal(d.querySelector('[data-source-root-shape]')!.getAttribute('data-source-root-shape'),'426');assert.equal(d.querySelectorAll('canvas,audio').length,0);
 }
 const morphs=DATA.shapes.filter(s=>s.paths.some(p=>p.morph));assert.deepEqual(morphs.map(s=>s.characterId),[133,134,135,136,137,402]);
 for(const s of morphs)for(const p of s.paths){assert(p.morph);assert.equal(interpolateRw002Path(p,0),p.morph!.start.replace(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g,n=>String(Number(n))));assert.equal(interpolateRw002Path(p,65535),p.morph!.end.replace(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g,n=>String(Number(n))));}
 const p=morphs[0].paths[0];assert.throws(()=>interpolateRw002Path({...p,morph:{start:p.morph!.start,end:'L '+p.morph!.end}},32768),/topology/);
 assert.equal(RW002_NATIVE_DISPOSITIONS.originalMorphFidelityEstablished,false);
});

test('morph133 preserves source multiply-before-divide at frame515 ratio14564',()=>{
 const actor=scene(515).find(n=>n.characterId===133);assert(actor);assert.equal(actor.ratio,14564);
 const path=DATA.shapes.find(s=>s.characterId===133)!.paths[0];assert(path.morph);
 const tokens=(d:string)=>d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)!;
 assert.deepEqual([Number(tokens(path.morph.start)[7]),Number(tokens(path.morph.end)[7])],[-190,-79]);
 // Original canvas useRatio and frozen source path yield this exact binary64 copy.
 assert.equal(tokens(interpolateRw002Path(path,actor.ratio))[7],'-165.33220416571297');
});

test('own377/378/379 source hit intersections gate typed English host requests through authored reveal',()=>{
 assert.equal(createRw002GlossaryRequest(1098,'negative-number'),null);assert.equal(createRw002GlossaryRequest(1099,'negative-number'),null);
 for(const [term,first] of [['negative-number',1100],['less-than',1112],['zero',1117]] as const){assert.equal(createRw002GlossaryRequest(first-1,term),null);assert(createRw002GlossaryRequest(first,term),'Exact source rectangle intersection begins at'+first);}
 for(let f=1099;f<=1289;f++)for(const t of DATA.glossary.terms){const intersection=rw002SourceHitIntersection(scene(f),t),result=createRw002GlossaryRequest(f,t.id);assert.equal(!!result,!!intersection);if(result){assert.deepEqual(result.request,{type:'open-keyterm',entryId:t.entryIds.en,sourceAnimationId:'course-g04-l03-rw-002',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});assert.equal(result.term.keyAttribute,t.sourceKeyAttribute);}}
 const d=documentAt(1289),buttons=[...d.querySelectorAll('button[data-source-button-id]')];assert.deepEqual(buttons.map(b=>Number(b.getAttribute('data-source-button-id'))),[377,378,379]);assert.deepEqual(buttons.map(b=>Number(b.getAttribute('data-source-depth'))),[101,103,105]);assert.deepEqual(buttons.map(b=>b.textContent),['Negative number','Less than','Zero']);assert(buttons.every(b=>b.getAttribute('data-source-hit-shape-id')==='376'&&b.getAttribute('data-source-mask-instances')!.split('|').length===2));assert.equal(d.querySelector('[data-source-shape-id="376"]'),null);
 assert.equal(RW002_NATIVE_DISPOSITIONS.originalCloseAutoResumeEstablished,false);
});

test('host frame/Replay/locale identity fails closed and capability does not add a clock or audio owner',()=>{
 const c=context(1289),state=frameState(1289,c);
 for(const patch of [{animationId:'wrong'},{sourceSwfSha256:'0'.repeat(64)},{status:'blocked'},{frameDomain:'root'},{rootFrame:1},{scenario:'invented'},{language:'es'},{frame:1288},{seed:1}])assert.equal(snapshot({...state,...patch} as typeof state,c).status,'blocked');
 for(const patch of [{frame:0},{frame:1290},{frame:1.5},{frameDomain:'root'},{rootFrame:1},{scenario:'invented'},{lang:'es' as const},{seed:-1},{seed:1},{replay:-1},{entryStateSha256:'a'.repeat(64)}]){const got=snapshot(state,{...c,...patch});assert.equal(got.status,'blocked');assert.deepEqual(got.blocks,[]);}
 assert.deepEqual(snapshot(state,{...c,replay:3}).blocks,snapshot(state,c).blocks);assert.equal(snapshot(state,{...c,replay:3}).identity.replay,3);
 assert.equal(CAPABILITY.playbackEndFrameByDomain?.['sprite-421'],1289);assert.equal(CAPABILITY.reducedMotionFrameByDomain?.['sprite-421'],1289);assert.equal(CAPABILITY.sourceTimelineAudioCues,undefined);assert.equal(CAPABILITY.frameControl,undefined);
 const html=renderToStaticMarkup(<Renderer {...c} uiLanguage="es"/>);assert.match(html,/source-English-fallback/);assert.match(html,/Negative numbers are less than zero/);assert.match(html,/Con la ilustración enfocada/);assert.equal(CAPABILITY.keyTerms?.indexLanguage,'en');
});
