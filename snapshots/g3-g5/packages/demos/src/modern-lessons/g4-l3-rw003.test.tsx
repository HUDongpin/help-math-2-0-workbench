import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import type {RuntimeContext} from '../contract';
import {getCourseG04L03Rw003FrameState as frameState} from '../timelines/course-g04-l03-rw-003';
import {G4_L3_RW003_SOURCE_DATA as DATA} from './generated/g4-l3-rw003-source';
import {G4_L3_RW003_TEXT_BINDING as BINDING, G4_L3_RW003_TEXT_PRESENTATION as CAPABILITY, G4L3Rw003ModernRenderer as Renderer, getG4L3Rw003TextSnapshot as snapshot, getG4L3Rw003Scene, getRw003StaticSignTransfers, RW003_MATHEMATICAL_DISPOSITION, RW003_SHAPE_DISPOSITIONS, createRw003GlossaryRequest, interpolateRw003Path} from './g4-l3-rw003';
const context = (frame: number, overrides: Partial<RuntimeContext> = {}): RuntimeContext => ({frame, frameDomain: 'sprite-49', rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0, ...overrides});
const snap = (frame: number) => {const c = context(frame); return snapshot(frameState(frame, c), c);};
const catalog = readFile(new URL('../../../../catalog/typography-v1/source-catalog/assets/783b74b036a7af4031f17ce9e1aab7536665c84a73400b3a980cfa3e89a9a335.json.gz', import.meta.url)).then(bytes => JSON.parse(gunzipSync(bytes).toString()));

test('binding classifies all existing source runs, distinct titles and all28 shape roles', async () => {
 const raw = await catalog;
 assert.equal(DATA.sourceSha256, raw.sourceSha256);
 assert.equal(DATA.texts.length, 20); assert.equal(DATA.shapes.length, 28);
 assert.deepEqual([...new Set(BINDING.blocks.flatMap(b => b.sourceTextIds))].sort(), raw.textDefinitions.flatMap((t: any) => t.runs.map((r: any) => r.sourceTextId)).sort());
 assert.deepEqual(BINDING.blocks.find(b => b.id === 'figure-description')!.sourceShapeIds!.slice().sort((a,b) => a-b), raw.shapeDefinitions.map((s: any) => s.characterId).sort((a:number,b:number) => a-b));
 assert(DATA.shapes.every(s => s.role && s.paths.length));
 assert.deepEqual(DATA.rootTitles.map(t => t.characterId), [50, 52]);
 assert.deepEqual(DATA.rootTitles.map(t => t.text), ['Negative Numbers: Real World Activity', 'Negative Numbers: Your World']);
 assert.equal(new Set(BINDING.blocks.map(b => b.id)).size, BINDING.blocks.length);
 assert.equal(RW003_SHAPE_DISPOSITIONS.glossaryHitCharacter, 32);
 for(const button of raw.buttonDefinitions) assert(button.statePlacements.every((p: any) => p.characterId === 32 && p.states.hitTest && !p.states.up && !p.states.over && !p.states.down));
});

test('all278 frames preserve independent catalog text lifetimes/alpha and original frame identity', async () => {
 const raw = await catalog, timeline = raw.timelines.find((t: any) => t.timelineId === 'sprite-49');
 const textIds = new Set(raw.textDefinitions.map((t: any) => t.characterId));
 for(let frame = 1; frame <= 278; frame++) {
  const expected = timeline.instances.filter((i: any) => textIds.has(i.characterId) && i.firstFrame <= frame && i.lastFrameExclusive > frame).filter((i: any) => {
   let color = {multiply:[256,256,256,256],add:[0,0,0,0]};
   for(const event of timeline.events) if(event.instanceId === i.instanceId && event.frame <= frame && event.colorTransform) color = event.colorTransform;
   return (color.multiply[3] + color.add[3]) / 256 > 0;
  }).map((i: any) => i.instanceId).sort();
  const got = snap(frame); assert.equal(got.status, 'ready');
  assert.deepEqual(got.blocks.filter(b => b.visible && b.id.startsWith('sprite-49/')).map(b => b.id).sort(), expected, 'source text frame ' + frame);
  assert.deepEqual(getG4L3Rw003Scene(frame).visibleTextInstanceIds.slice().sort(), expected);
  assert.equal(got.identity.frame, frame); assert.equal(got.identity.frameDomain, 'sprite-49'); assert.equal(got.identity.rootFrame, 6);
 }
});

test('below-zero scale pairs and dynamic sign actors preserve their own source identities and removal', () => {
 assert.deepEqual(DATA.signedScalePairings.map(p => p.value), [120,100,80,60,40,20,0,-20,-40,-60,-80,-100]);
 const at1 = snap(1), byId = new Map(at1.blocks.map(b => [b.id,b]));
 for(const pair of DATA.signedScalePairings) {
  assert.equal(byId.get(pair.digitInstanceId)!.text, pair.value < 0 ? '−' + Math.abs(pair.value) : String(pair.value));
  if(pair.value < 0) {assert(pair.minusInstanceId); assert.equal(byId.get(pair.minusInstanceId)!.text, '−');}
  else assert.equal(pair.minusInstanceId, null);
 }
 assert.equal(RW003_MATHEMATICAL_DISPOSITION.sourceTextRetained, '_');
 const signs = DATA.instances.filter(i => i.timelineId === 'sprite-49' && i.characterId === 35);
 assert.equal(signs.length, 5);
 for(const i of signs) for(const frame of [146,147,149,151,153,155,171,172,278]) {
  const b = snap(frame).blocks.find(b => b.id === i.instanceId)!;
  assert.equal(b.visible, i.visibleRanges.some(([first,last]) => frame >= first && frame <= last));
  assert.equal(b.text, '−');
 }
 const final = getG4L3Rw003Scene(172).placements;
 assert(final.some(p => p.characterId === 25 && p.depth === 37 && p.instanceId.endsWith('generation-7')));
 const staticSigns = DATA.signedScalePairings.flatMap(p => p.minusInstanceId ? [p.minusInstanceId] : []).sort();
 for(let frame = 1; frame <= 278; frame++) assert.deepEqual([...getRw003StaticSignTransfers(getG4L3Rw003Scene(frame).placements)].sort(),staticSigns,'transfer requires own source alpha/masks at frame '+frame);
 const scene = getG4L3Rw003Scene(1), sign = staticSigns[0];
 assert(!getRw003StaticSignTransfers(scene.placements.map(p => p.instanceId === sign ? {...p,sourceAlpha:0} : p)).has(sign),'An invisible source minus cannot be transferred');
 assert(!getRw003StaticSignTransfers(scene.placements.map(p => p.instanceId === sign ? {...p,sourceAlpha:.5} : p)).has(sign),'A separately fading source minus must retain its own actor');
});

test('native labels use source character bounds once and retain their mask depth ancestry', async () => {
 const raw = await catalog, timeline = raw.timelines.find((t: any) => t.timelineId === 'sprite-49'), root = raw.timelines.find((t: any) => t.timelineId === 'root');
 const rootPlacement = root.events.filter((e: any) => e.characterId === 49 && e.frame <= 6 && e.matrix).at(-1).matrix;
 const textById = new Map<number,any>(raw.textDefinitions.map((t: any) => [t.characterId,t]));
 const transform = (m: readonly number[], x: number, y: number) => [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
 const scaleIds = new Set(DATA.signedScalePairings.map(p => p.digitInstanceId));
 for(const frame of [1,7,8,38,39,120,147,159,171,172,278]) {
  const d = new JSDOM(renderToStaticMarkup(<Renderer {...context(frame)}/>)).window.document, scene = getG4L3Rw003Scene(frame);
  for(const node of d.querySelectorAll('svg text[data-source-instance]')) {
   const id = node.getAttribute('data-source-instance')!, instance = timeline.instances.find((i: any) => i.instanceId === id), sourceText = textById.get(instance.characterId);
   const matrix = timeline.events.filter((e: any) => e.instanceId === id && e.frame <= frame && e.matrix).at(-1).matrix;
   assert.equal(matrix[1],0); assert.equal(matrix[2],0); assert(matrix[0]>0 && matrix[3]>0,'All actual source text directions remain upright');
   const bounds = sourceText.boundsTwips;
   const local = transform(matrix,scaleIds.has(id) ? bounds.right : (bounds.left+bounds.right)/2,(bounds.top+bounds.bottom)/2), global = transform(rootPlacement,local[0],local[1]);
   assert.equal(Number(node.getAttribute('x')),global[0]/20,'source character bounds x '+id+' frame'+frame);
   assert.equal(Number(node.getAttribute('y')),global[1]/20,'source character bounds y '+id+' frame'+frame);
   assert.equal(node.getAttribute('data-source-text-matrix'),sourceText.matrix.join(' '));
   assert.equal(Number(node.getAttribute('font-size'))*60/DATA.stage.width,1.125,'Native glyph scale is 1.125rem in the 60rem plane');
   const actor = scene.placements.find(p => p.instanceId === id)!;
   const expectedMasks = scene.placements.filter(p => p.clipDepth !== null && p.depth < actor.depth && p.clipDepth >= actor.depth).map(p => p.depth).sort((a,b)=>a-b);
   const actualMasks:number[]=[];
   for(let parent=node.parentElement;parent && parent.tagName.toLowerCase()!=='svg';parent=parent.parentElement) {
    const clip=parent.getAttribute('clip-path');if(clip)actualMasks.push(Number(clip.match(/-mask-(\d+)\)/)![1]));
   }
   assert.deepEqual(actualMasks.sort((a,b)=>a-b),expectedMasks,'actual SVG ancestry '+id+' frame'+frame);
  }
  if(frame >= 7) {
   const explanation=d.querySelector('svg [data-source-character="16"]')!;
   assert.equal(explanation.textContent,'A thermometer is a tool used to measure temperature.');
   assert.equal(Number(explanation.getAttribute('x')),479.3,'The baked -3094 TextMatrix translation is not applied a second time');
  }
 }
 const rootTitle = DATA.rootTitles.find(t=>t.characterId===50)!;
 assert(rootTitle.matrix[5] + textById.get(50).boundsTwips.bottom < 0,'Root title50 is authored above the source stage');
 const titles = new JSDOM(renderToStaticMarkup(<Renderer {...context(1)}/>)).window.document;
 assert.equal(titles.querySelector('h2[data-source-character="50"]')!.textContent,'Negative Numbers: Real World Activity');
 assert.equal(titles.querySelector('h3[data-source-character="52"]')!.textContent,'Negative Numbers: Your World');
});

test('native geometry retains outer/local masks and interpolates exact morph endpoints', () => {
 for(const frame of [1,7,38,39,98,99,139,140,147,159,172,278]) {
  const c = context(frame), d = new JSDOM(renderToStaticMarkup(<Renderer {...c}/>)).window.document;
  const scene = getG4L3Rw003Scene(frame);
  const masks = scene.placements.filter(p => p.clipDepth !== null).map(p => p.characterId).sort((a,b) => a-b);
  assert.deepEqual([...d.querySelectorAll('[data-source-mask]')].map(n => Number(n.getAttribute('data-source-mask'))).sort((a,b) => a-b), masks);
  const shapeIds = new Set<number>(DATA.shapes.map(s => s.characterId));
  assert.equal(d.querySelectorAll('[data-source-shape-id]:not([data-source-root-shape])').length, scene.placements.filter(p => p.clipDepth === null && p.sourceAlpha > 0 && shapeIds.has(p.characterId)).length);
  assert.equal(d.querySelector('[data-source-root-shape]')!.getAttribute('data-source-shape-id'), '54');
  const transferred = new Set<string>(DATA.signedScalePairings.flatMap(p => p.minusInstanceId ? [p.minusInstanceId] : []));
  const texts = new Set<number>(DATA.texts.map(t => t.characterId));
  const expectedOrder = scene.placements.filter(p => p.clipDepth === null && p.sourceAlpha > 0 && (shapeIds.has(p.characterId) || texts.has(p.characterId) && !transferred.has(p.instanceId))).map(p => p.instanceId);
  assert.deepEqual([...d.querySelectorAll('svg [data-source-instance]:not([data-source-root-shape])')].map(n => n.getAttribute('data-source-instance')), expectedOrder);
  assert.equal(d.querySelectorAll('canvas,image,audio').length, 0);
  assert.equal(d.querySelector('.rw003-viewport')!.getAttribute('tabindex'), '0');
  assert.match(d.querySelector('style')!.textContent!, /inline-size:60rem/);
 }
 for(const shape of DATA.shapes) for(const p of shape.paths) if('morph' in p && p.morph) {
  assert.equal(interpolateRw003Path(p,0).replace(/\s+/g,' '), p.morph.start.replace(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g,n => String(Number(n))).replace(/\s+/g,' '));
  assert.equal(interpolateRw003Path(p,65535).replace(/\s+/g,' '), p.morph.end.replace(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g,n => String(Number(n))).replace(/\s+/g,' '));
 }
 const paths: Parameters<typeof interpolateRw003Path>[0][]=[];
 for(const shape of DATA.shapes) for(const path of shape.paths) paths.push(path);
 const morph = paths.find(p=>p.morph)!;
 assert(morph.morph);
 assert.throws(()=>interpolateRw003Path({...morph,morph:{...morph.morph!,end:'L '+morph.morph!.end}},32768),/topology mismatch/,'Do not weaken source morph topology checks');
});

test('clipPath uses direct source paths with exact transform and clip rule', () => {
 // A group is not an SVG1.1 clipPath shape child. DOM text bounds and path
 // isPointInFill can succeed while an unsupported group yields an empty clip.
 // This guards the actual content model; Root still verifies real painted PNGs.
 for(const frame of [1,7,8,38,39,120,172,278]) {
  const d=new JSDOM(renderToStaticMarkup(<Renderer {...context(frame)}/>)).window.document;
  for(const mask of getG4L3Rw003Scene(frame).placements.filter(p=>p.clipDepth!==null)) {
   const clip=d.querySelector('clipPath[data-source-mask="'+mask.characterId+'"]')!;
   const sourceShape=DATA.shapes.find(s=>s.characterId===mask.characterId)!;
   assert(clip,'Exact source mask exists at frame'+frame);
   assert.equal(clip.getAttribute('clipPathUnits'),'userSpaceOnUse');
   assert.equal(clip.getAttribute('data-source-clip-depth'),String(mask.clipDepth));
   assert.equal(clip.querySelectorAll('g').length,0,'Unsupported group must not empty source clip'+mask.characterId);
   assert.equal(clip.children.length,sourceShape.paths.length,'All source mask paths remain direct children');
   for(let ix=0;ix<sourceShape.paths.length;ix++) {
    const path=clip.children[ix],sourcePath=sourceShape.paths[ix];
    assert.equal(path.tagName.toLowerCase(),'path','Every source clip child is a directly paintable path');
    assert.equal(path.getAttribute('transform'),'scale(.05) matrix('+DATA.rootMatrix.join(' ')+') matrix('+mask.matrix.join(' ')+')','Move the identical source transform onto each direct path');
    assert.equal(path.getAttribute('d'),interpolateRw003Path(sourcePath,mask.ratio),'Mask ratio and exact source geometry remain unchanged');
    assert.equal(path.getAttribute('fill-rule'),sourcePath.fillRule);
    assert.equal(path.getAttribute('clip-rule'),sourcePath.fillRule,'Source evenodd geometry also governs clip silhouettes');
   }
  }
 }
});

test('exact glossary windows dispatch existing typed stop-until-explicit-resume requests', () => {
 assert.equal(createRw003GlossaryRequest(119,'positive'), null);
 assert.equal(createRw003GlossaryRequest(158,'negative'), null);
 for(const [frame,term,entry] of [[120,'positive','en-0496-498b59d01013'],[159,'negative','en-0408-196ea5a45df3']] as const) {
  const result = createRw003GlossaryRequest(frame,term)!;
  assert.deepEqual(result.request,{type:'open-keyterm',entryId:entry,sourceAnimationId:'course-g04-l03-rw-003',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});
  assert.equal(result.observedFrame,frame);
 }
 for(const frame of [119,120,158,159,278]) {
  const html = renderToStaticMarkup(<Renderer {...context(frame)} onLessonHostRequest={() => {}}/>);
  const d = new JSDOM(html).window.document;
  assert.equal(d.querySelectorAll('[data-source-term-id="positive"]').length, frame >= 120 ? 1 : 0);
  assert.equal(d.querySelectorAll('[data-source-term-id="negative"]').length, frame >= 159 ? 1 : 0);
 }
});

test('mixed source/context identities fail closed and Replay uses the same source frame', () => {
 const c = context(172), state = frameState(172,c);
 for(const patch of [{sourceSwfSha256:'0'.repeat(64)},{status:'blocked'},{frameDomain:'root'},{rootFrame:1},{scenario:'invented'},{language:'es'},{frame:171},{seed:1}]) assert.equal(snapshot({...state,...patch} as typeof state,c).status,'blocked');
 for(const patch of [{frame:0},{frame:279},{frame:172.5},{frameDomain:'root'},{rootFrame:1},{scenario:'invented'},{lang:'es' as const},{seed:-1},{seed:1},{replay:-1},{entryStateSha256:'a'.repeat(64)}]) {const got=snapshot(state,{...c,...patch});assert.equal(got.status,'blocked');assert.deepEqual(got.blocks,[]);}
 const replay = snapshot(state,{...c,replay:3});assert.deepEqual(replay.blocks,snapshot(state,c).blocks);assert.equal(replay.identity.replay,3);
 assert.equal(CAPABILITY.playbackEndFrameByDomain?.['sprite-49'],278);assert.equal(CAPABILITY.reducedMotionFrameByDomain?.['sprite-49'],278);
 assert.equal(CAPABILITY.sourceTimelineAudioCues,undefined,'Original module remains the source-audio owner');
 const html=renderToStaticMarkup(<Renderer {...c} uiLanguage="es"/>);
 assert.match(html,/lang="en"/);assert.match(html,/source-English-fallback/);assert.match(html,/Con el termómetro enfocado/);
 assert.doesNotMatch(html,/Positivo|Negativo/,'UI language does not replace source glossary labels');
});
