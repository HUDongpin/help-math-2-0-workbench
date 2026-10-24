import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createElement, act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {readTextSourceAsset} from '../../../../scripts/build-lesson-text-source-catalog-v1.mjs';
import {getCourseG04L03In004FrameState} from '../modules/course-g04-l03-in-004';
import {G4L3In004ModernRenderer, G4_L3_IN004_TEXT_BINDING, G4_L3_IN004_ACTIVITIES, G4_L3_IN004_TEXT_PRESENTATION, getG4L3In004TeachingState, getG4L3In004TextSnapshot, getG4L3In004PlacementStatus} from './g4-l3-in004';
import {G4_L3_IN004_TEACHING_SOURCE as SOURCE} from './generated/g4-l3-in004-teaching-v1';
import {createCourseG04L03In004NumberLineDragState as initial, reduceCourseG04L03In004NumberLineDrag as reduce,
  COURSE_G04_L03_IN_004_NUMBER_CARDS as CARDS} from '../timelines/course-g04-l03-in-004-number-line-drag-interaction';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const context = (frame: number, changes: Partial<RuntimeContext> = {}): RuntimeContext => ({frame, frameDomain: 'sprite-160', rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0, ...changes});
const snapshot = (frame = 126, interaction = initial(), changes: Partial<RuntimeContext> = {}) => {
  const request = context(frame, changes);
  return getG4L3In004TextSnapshot(getCourseG04L03In004FrameState(frame, request), request, interaction);
};
const visible = (value: ReturnType<typeof snapshot>, id: string) => value.blocks.find(block => block.id === id)?.visible;
const asset = (async () => {
  const index = JSON.parse(await readFile(`${root}catalog/typography-v1/source-catalog/index.json`, 'utf8'));
  return readTextSourceAsset(root, index.assets.find((entry: any) => entry.sourceSha256 === SOURCE.sourceSwfSha256));
})();

test('all instructional text and outlined signs bind to real source definitions', async () => {
  const source = await asset;
  assert.equal(G4_L3_IN004_TEXT_BINDING.placementId, 'g04-l03-placement-015');
  assert.equal(G4_L3_IN004_TEXT_BINDING.sourceSwfSha256, source.sourceSha256);
  const textIds = new Set(source.textDefinitions.flatMap((definition: any) => definition.runs.map((run: any) => run.sourceTextId)));
  const shapes = new Set(source.shapeDefinitions.map((shape: any) => shape.characterId));
  for (const block of G4_L3_IN004_TEXT_BINDING.blocks) {
    for (const id of block.sourceTextIds) assert.ok(textIds.has(id), id);
    if ('sourceShapeIds' in block) for (const id of block.sourceShapeIds ?? []) assert.ok(shapes.has(id), `shape ${id}`);
  }
  assert.equal(source.textDefinitions.find((text: any) => text.characterId === 43).runs.map((run: any) => run.text).join(''), SOURCE.wordReveals.map(word => word.text).join(' '));
});

test('the source mask hold and complete-word reveal are retained', async () => {
  const source = await asset;
  const events = source.timelines.find((timeline: any) => timeline.timelineId === 'sprite-160').events;
  const masks = events.filter((event: any) => event.depth === 67 && event.matrix);
  for (const word of SOURCE.wordReveals) {
    const first = masks.find((event: any) => event.matrix[0] * 6649 + event.matrix[4] >= word.rightTwips);
    assert.equal(word.frame, first.frame);
  }
  assert.equal(getG4L3In004TeachingState(46).instruction, '');
  assert.equal(getG4L3In004TeachingState(50).instruction, 'Drag');
  assert.equal(getG4L3In004TeachingState(88).instruction, 'Drag and drop each number to its correct position on the number line.');
});

test('the minus-one demonstration follows source placement updates before interaction', async () => {
  assert.equal(getG4L3In004TeachingState(1).graphVisible, false);
  assert.equal(getG4L3In004TeachingState(2).graphVisible, true);
  assert.equal(getG4L3In004TeachingState(97).demoX, 272);
  assert.ok(getG4L3In004TeachingState(100).demoX > 272);
  assert.equal(getG4L3In004TeachingState(110).demoPlaced, false);
  assert.equal(getG4L3In004TeachingState(111).demoPlaced, true);
  assert.equal(getG4L3In004TeachingState(125).demoX, 512);
  assert.equal(getG4L3In004TeachingState(125).demoY, 66);
  assert.equal(getG4L3In004TeachingState(126).cardsVisible, false);
  const source = await asset;
  const timeline = source.timelines.find((entry: any) => entry.timelineId === 'sprite-160');
  const end = timeline.events.find((event: any) => event.instanceId === 'sprite-160/depth-84/generation-2' && event.frame === 111);
  assert.deepEqual(end.matrix, [1, 0, 0, 1, -820, -1374]);
});

test('feedback visibility consumes the existing reducer, including wrong close, five correct answers and Replay', () => {
  let interaction = initial();
  assert.equal(visible(snapshot(126, interaction), 'complete'), false);
  interaction = reduce(interaction, {type: 'place-card', cardId: '2', targetId: '3'});
  assert.equal(visible(snapshot(126, interaction), 'wrong'), true);
  assert.equal(visible(snapshot(126, interaction), 'correct'), undefined);
  assert.equal(getG4L3In004PlacementStatus(interaction), '');
  assert.equal(visible(snapshot(125, interaction), 'wrong'), false, 'No interactive feedback before the source hold');
  interaction = reduce(interaction, {type: 'close-wrong-feedback'});
  for (const card of CARDS) {
    interaction = reduce(interaction, {type: 'place-card', cardId: card.id, targetId: card.id});
    assert.equal(visible(snapshot(126, interaction), 'correct'), undefined, 'Dormant source visual feedback is not launched by the correct-drop path');
    assert.equal(getG4L3In004PlacementStatus(interaction), `${card.accessibleLabel} placed`);
    assert.equal(visible(snapshot(126, interaction), 'complete'), false);
    interaction = reduce(interaction, {type: 'feedback-complete'});
    assert.equal(getG4L3In004PlacementStatus(interaction), '');
  }
  assert.equal(visible(snapshot(126, interaction), 'complete'), true);
  interaction = reduce(interaction, {type: 'replay'});
  assert.equal(visible(snapshot(126, interaction), 'complete'), false);
  assert.deepEqual(interaction.placedCardIds, []);
});

test('all source frames are deterministic; changing presentation identity never creates another activity', () => {
  for (let frame = 1; frame <= 169; frame += 1) {
    assert.deepEqual(snapshot(frame), snapshot(frame));
    assert.equal(snapshot(frame).status, 'ready');
    assert.deepEqual(snapshot(frame).suppressedInstances, []);
  }
  assert.equal(snapshot(126, initial(), {lang: 'es'}).status, 'blocked');
  assert.equal(snapshot(126, initial(), {frameDomain: 'root'}).status, 'blocked');
  const evidence = snapshot(126, reduce(initial(), {type: 'place-card', cardId: '2', targetId: '3'}), {entryStateSha256: 'a'.repeat(64)});
  assert.equal(visible(evidence, 'wrong'), false);
});

test('modern initial render contains real HTML teaching text and no old canvas plane', () => {
  const request = context(125);
  const html = renderToStaticMarkup(createElement(G4L3In004ModernRenderer, {...request, state: getCourseG04L03In004FrameState(125, request), paused: true, reducedMotion: false}));
  assert.match(html, /Drag and drop each number to its correct position on the number line\./);
  assert.match(html, /data-lesson-text-block="tick--10"[^>]*>−10</);
  assert.match(html, /data-lesson-text-block="tick-10"[^>]*>\+10</);
  assert.match(html, /shared-original-reducer/);
  assert.doesNotMatch(html, /<canvas|foreignObject/);
  assert.doesNotMatch(html, /Correct!!!<\/p>/);
});


test('source feedback concurrency follows exact child placement lifetimes and parent completion',async()=>{
  const source=await asset,main=source.timelines.find((timeline:any)=>timeline.timelineId==='sprite-160');
  for(const activity of G4_L3_IN004_ACTIVITIES.filter(activity=>!('buttonPress' in activity))){
    const sourceChild=main.instances.find((instance:any)=>instance.characterId===Number(activity.frameDomain.slice(7)));
    assert.equal(activity.parentLifetime.firstFrame,sourceChild.firstFrame);
    assert.equal(activity.parentLifetime.lastFrameExclusive,sourceChild.lastFrameExclusive);
    assert.equal(activity.startFrame,2);
  }
  assert.equal(G4_L3_IN004_TEXT_PRESENTATION.frameControl?.completionFrame,169);
  assert.equal(G4_L3_IN004_TEXT_PRESENTATION.completion,undefined);
  assert.deepEqual(G4_L3_IN004_TEXT_PRESENTATION.frameControl?.transitions,[{fromFrame:126,toFrame:127,stopFrame:169}]);
});


test('placed target values survive source removal of draggable cards at parent frame127',async()=>{
  let interaction=initial();for(const card of CARDS){interaction=reduce(interaction,{type:'place-card',cardId:card.id,targetId:card.id});interaction=reduce(interaction,{type:'feedback-complete'});}
  const source=await asset,main=source.timelines.find((timeline:any)=>timeline.timelineId==='sprite-160');
  for(const id of [133,135,136,137,138])assert.equal(main.instances.find((instance:any)=>instance.characterId===id).lastFrameExclusive,170);
  for(const card of CARDS){assert.equal(visible(snapshot(169,interaction),`card-${card.id}`),true);assert.equal(visible(snapshot(169,initial()),`card-${card.id}`),false);}
});

test('placement accessibility status never invents a placement or binds dormant feedback artwork', () => {
  assert.equal(getG4L3In004PlacementStatus(initial()), '');
  assert.equal(getG4L3In004PlacementStatus({...initial(), mode: 'correct-feedback', lastPlacedCardId: '2'}), '');
  const placed = reduce(initial(), {type: 'place-card', cardId: '2', targetId: '2'});
  assert.equal(getG4L3In004PlacementStatus(placed), 'negative 6 placed');
  assert.equal(getG4L3In004PlacementStatus(reduce(placed, {type: 'replay'})), '');
  assert.ok(!G4_L3_IN004_TEXT_BINDING.blocks.some(block => block.sourceTextIds.includes('character-67/run-0')));
  assert.ok(!snapshot(126, placed).blocks.some(block => block.text === 'Correct!'));
});

test('negative axis labels bind the single and grouped source minus shapes separately', async () => {
  const audit = JSON.parse(await readFile(`${root}catalog/typography-v1/source-behavior/g4-l3-in004-axis-signs.json`, 'utf8'));
  assert.deepEqual(SOURCE.sourceShapes.negativeAxisSigns, [13, 33]);
  for (const label of audit.negativeLabels) {
    const block = G4_L3_IN004_TEXT_BINDING.blocks.find(block => block.id === `tick-${label.value}`);
    assert.ok(block);
    assert.deepEqual(block.sourceTextIds, [label.sourceTextId]);
    assert.deepEqual('sourceShapeIds' in block ? block.sourceShapeIds : [], [label.sourceShapeId]);
  }
  assert.equal(audit.negativeLabels.filter((label: any) => label.nearSourceNumeral).length, 10);
  for (const label of audit.positiveLabels) {
    const block = G4_L3_IN004_TEXT_BINDING.blocks.find(block => block.id === `tick-${label.value}`);
    assert.deepEqual(block?.sourceTextIds, [label.sourceTextId, 'character-32/run-0']);
  }
  assert.deepEqual(audit.numeralNineSourceIdentity.negativeCharacterId, 27);
  assert.deepEqual(audit.numeralNineSourceIdentity.positiveCharacterId, 28);
});


test('Close Down source is the nested button record and cannot use ordinary click activity admission',async()=>{
 const {lessonTextActivityRequestAllowed,validateLessonTextActivities}=await import('../lesson-text-frame-control');
 const audit=JSON.parse(await readFile(`${root}catalog/typography-v1/source-behavior/g4-l3-in004-control-roles.json`,'utf8'));
 const close=G4_L3_IN004_ACTIVITIES.find(activity=>activity.id==='in004-close-down')!;
 assert.ok(audit.closeButton.stateMembers.down.some(([id,depth]:number[])=>id===151&&depth===7));
 assert.equal(close.sourceInstanceId,'root/animation_mc/animation/Pop1_mc/BtnClose/button-152/record-10');
 assert.equal(close.startFrame,1);assert.equal(close.endFrame,5);assert.equal(close.audio.offsetSeconds,1673/22050);
 assert.doesNotThrow(()=>validateLessonTextActivities(G4_L3_IN004_ACTIVITIES,169,12));
 assert.equal(lessonTextActivityRequestAllowed(G4_L3_IN004_ACTIVITIES,{id:close.id,parentFrame:126},{frame:126,capture:false}),undefined);
});

test('Close pointer cancellation, keyboard release and click preserve feedback state and focus',async()=>{
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/'}),prior=new Map();
 for(const name of ['window','document','HTMLElement','HTMLButtonElement','Node','navigator','IS_REACT_ACT_ENVIRONMENT']){prior.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 const doc=dom.window.document,reactRoot=createRoot(doc.getElementById('root')!),phases:any[]=[],audio:string[]=[];
 const click=async(selector:string)=>{const e=doc.querySelector<HTMLButtonElement>(selector);assert.ok(e,selector);await act(async()=>e.click());};
 try{
  const runtime={...context(126),paused:false,onLessonActivityRequest:(r:any)=>{audio.push(r.id);return true;},onLessonButtonActivityRequest:(r:any)=>{phases.push(r);return true;}};
  await act(async()=>reactRoot.render(createElement(G4L3In004ModernRenderer,runtime)));
  await click('[data-in004-focus-control="card-2"]');await click('[data-in004-focus-control="target-3"]');
  const close=doc.querySelector<HTMLButtonElement>('[data-in004-focus-control="close-wrong"]')!;assert.ok(close);assert.equal(doc.activeElement,close);
  await act(async()=>{const e=new dom.window.MouseEvent('pointerdown',{bubbles:true,button:0,buttons:1});Object.defineProperty(e,'pointerId',{value:1});close.dispatchEvent(e);});
  await act(async()=>close.dispatchEvent(new dom.window.MouseEvent('pointercancel',{bubbles:true})));
  assert.deepEqual(phases.map(r=>r.phase),['press','release']);assert.equal(phases[0].token,phases[1].token);assert.equal(phases[0].id,'in004-close-down');
  assert.equal(doc.querySelector('[data-interaction-outcome]')?.getAttribute('data-interaction-outcome'),'wrong-feedback');
  await act(async()=>close.dispatchEvent(new dom.window.KeyboardEvent('keydown',{bubbles:true,key:' '})));
  await act(async()=>close.dispatchEvent(new dom.window.KeyboardEvent('keyup',{bubbles:true,key:' '})));
  assert.deepEqual(phases.map(r=>r.phase),['press','release','press','release']);assert.equal(phases[2].token,phases[3].token);assert.notEqual(phases[0].token,phases[2].token);
  await click('[data-in004-focus-control="close-wrong"]');assert.equal(phases.length,4,'click does not synthesize another press');
  assert.equal(doc.querySelector('[data-in004-focus-control="close-wrong"]'),null);assert.equal(doc.activeElement?.getAttribute('data-in004-focus-control'),'card-2');
  assert.deepEqual(audio,['in004-wrong-popup'],'Close does not start another coach or wrong-popup');
 }finally{await act(async()=>reactRoot.unmount());dom.window.close();for(const[name,d]of prior){if(d)Object.defineProperty(globalThis,name,d);else Reflect.deleteProperty(globalThis,name);}}
});

test('number-line keyboard scrolling leaves answer state and child controls alone', async () => {
 const dom = new JSDOM('<!doctype html><div id="root"></div>', {url:'http://localhost/'}), prior = new Map();
 for (const name of ['window','document','HTMLElement','HTMLButtonElement','Node','navigator','IS_REACT_ACT_ENVIRONMENT']) {
  prior.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});
 }
 const doc=dom.window.document, reactRoot=createRoot(doc.getElementById('root')!), activities:string[]=[];
 try {
  await act(async()=>reactRoot.render(createElement(G4L3In004ModernRenderer,{...context(126),paused:false,onLessonActivityRequest:(r:any)=>{activities.push(r.id);return true;}})));
  const viewport=doc.querySelector<HTMLElement>('.in004-modern__viewport')!;
  Object.defineProperties(viewport,{clientWidth:{configurable:true,value:300},scrollWidth:{configurable:true,value:1120}});
  viewport.scrollLeft=400;viewport.focus();
  const key=async(target:HTMLElement,key:string,changes:KeyboardEventInit={})=>{
   const event=new dom.window.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key,...changes});
   await act(async()=>target.dispatchEvent(event));return event.defaultPrevented;
  };
  assert.equal(await key(viewport,'ArrowRight'),true);assert(viewport.scrollLeft>400);
  assert.equal(await key(viewport,'Home'),true);assert.equal(viewport.scrollLeft,0);
  assert.equal(await key(viewport,'ArrowLeft'),true);assert.equal(viewport.scrollLeft,0);
  assert.equal(await key(viewport,'End'),true);assert.equal(viewport.scrollLeft,820);
  assert.equal(await key(viewport,'ArrowRight',{ctrlKey:true}),false);assert.equal(viewport.scrollLeft,820);
  const card=doc.querySelector<HTMLButtonElement>('[data-in004-focus-control="card-2"]')!;
  await act(async()=>card.click());
  const target=doc.querySelector<HTMLButtonElement>('[data-in004-focus-control="target-2"]')!;target.focus();
  assert.equal(await key(target,'Home'),false);assert.equal(viewport.scrollLeft,820);
  assert.equal(doc.activeElement,target);assert.equal(card.getAttribute('aria-pressed'),'true');
  assert.equal(doc.querySelector('[data-interaction-outcome]')?.getAttribute('data-interaction-outcome'),'ready');
  assert.deepEqual(activities,[]);
 } finally {
  await act(async()=>reactRoot.unmount());dom.window.close();
  for(const [name,descriptor]of prior){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}
 }
});
