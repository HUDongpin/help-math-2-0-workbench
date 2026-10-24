import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG04L03Ts008FrameState} from '../modules/course-g04-l03-ts-008';
import {createCourseG04L03Ts008InteractionState as initial, reduceCourseG04L03Ts008Interaction as reduce,
  COURSE_G04_L03_TS_008_QUESTION as QUESTION, COURSE_G04_L03_TS_008_RIGHT_FEEDBACK_WINDOWS as RIGHT,
  COURSE_G04_L03_TS_008_WRONG_FEEDBACK_WINDOWS as WRONG, type CourseG04L03Ts008InteractionState} from '../timelines/course-g04-l03-ts-008-practice-question-interaction';
import {readTextSourceAsset} from '../../../../scripts/build-lesson-text-source-catalog-v1.mjs';
import {G4L3Ts008ModernRenderer, G4_L3_TS008_TEXT_BINDING as BINDING, G4_L3_TS008_WORD_REVEALS, G4_L3_TS008_KEY_TERMS, G4_L3_TS008_KEY_TERMS_CAPABILITY,
  getG4L3Ts008TeachingState, getG4L3Ts008TextSnapshot} from './g4-l3-ts008';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const context = (frame = 328, changes: Partial<RuntimeContext> = {}): RuntimeContext => ({frame, frameDomain: 'sprite-350', rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0, ...changes});
const snapshot = (interaction = initial(0), frame: number = interaction.frame, changes: Partial<RuntimeContext> = {}) => {
  const request = context(frame, changes);
  return getG4L3Ts008TextSnapshot(getCourseG04L03Ts008FrameState(frame, request), request, interaction);
};
const visible = (state: CourseG04L03Ts008InteractionState) => snapshot(state).blocks.filter(block => block.visible);
const visibleIds = (state: CourseG04L03Ts008InteractionState) => visible(state).map(block => block.id);
const quiz = (seed = 0) => ['continue-walkthrough','continue-walkthrough','reveal-walkthrough-box','close-walkthrough-box','reveal-walkthrough-box','close-walkthrough-box'].reduce((state, type) => reduce(state, {type} as Parameters<typeof reduce>[1]), initial(seed));
const sourceAsset = (async () => {
  const index = JSON.parse(await readFile(root + 'catalog/typography-v1/source-catalog/index.json', 'utf8'));
  return readTextSourceAsset(root, index.assets.find((entry: any) => entry.sourceSha256 === BINDING.sourceSwfSha256));
})();

test('page binding resolves every text and mathematical sign to the exact source SWF', async () => {
  assert.equal(BINDING.placementId, 'g04-l03-placement-036');
  assert.equal(BINDING.sourceSwfSha256, '9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885');
  const source = await sourceAsset;
  const ids = new Set(source.textDefinitions.flatMap((definition: any) => definition.runs.map((run: any) => run.sourceTextId)));
  const shapeIds = new Set(source.shapeDefinitions.map((shape: any) => shape.characterId));
  for (const block of BINDING.blocks) {
    for (const id of block.sourceTextIds) assert.ok(ids.has(id), id);
    for (const id of ('sourceShapeIds' in block ? block.sourceShapeIds : []) ?? []) assert.ok(shapeIds.has(id), String(id));
  }
  const logical = source.timelines.find((timeline: any) => timeline.timelineId === 'sprite-153');
  assert.deepEqual(logical.instances.filter((instance: any) => instance.characterId === 150).map((instance: any) => instance.depth), [15,17]);
  assert.equal(source.summary.unresolvedRuns, 0);
});

test('whole-word source thresholds are independently recomputed from source glyph advances and masks', async () => {
  const source = await sourceAsset;
  const canvas = await readFile(root + 'apps/web/public/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js', 'utf8');
  const font = canvas.slice(canvas.indexOf('function font3('), canvas.indexOf('function text4('));
  const maxX: Record<string, number> = {};
  for (const glyph of font.matchAll(/case "([^"]+)":([\s\S]*?)(?:break;)/g)) {
    const xs = [...glyph[2].matchAll(/pathData="([^"]+)"/g)].flatMap(match => (match[1].match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number).filter((_, index) => index % 2 === 0));
    maxX[glyph[1]] = Math.max(...xs);
  }
  const timeline = source.timelines.find((entry: any) => entry.timelineId === 'sprite-350');
  const expected: {text: string; frame: number}[] = [];
  for (const [character, mask, depth, finalFrame] of [[41,39,44,117],[47,46,50,123]]) {
    const maskCode = canvas.slice(canvas.indexOf(`function morphshape${mask}(`));
    const path = maskCode.match(/pathData="([^"]+)"/)![1];
    const coordinates = path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    const initialRight = Math.max(...coordinates.filter((_, index) => index % 4 === 0));
    const finalRight = Math.max(...coordinates.filter((_, index) => index % 4 === 1));
    const events = timeline.events.filter((event: any) => event.instanceId === `sprite-350/depth-${depth}/generation-1` && event.kind !== 'remove');
    let cursor = 0, right = 0, word = '';
    const flush = () => {
      if (!word) return;
      const event = events.find((event: any) => -7113 + initialRight + (finalRight - initialRight) * (event.ratio ?? 0) / 65535 >= right - 7037);
      expected.push({text: word, frame: event?.frame ?? finalFrame}); word = '';right = 0;
    };
    const definition = source.textDefinitions.find((definition: any) => definition.characterId === character);
    for (const run of definition.runs) for (const glyph of run.glyphs) {
      if (glyph.unicode === ' ') flush();
      else {word += glyph.unicode;right = Math.max(right, cursor + maxX[glyph.unicode] * run.fontHeightTwips / 1024);}
      cursor += glyph.advanceTwips;
    }
    flush();
  }
  assert.deepEqual(G4_L3_TS008_WORD_REVEALS, expected);
  assert.equal(expected.map(word => word.text).join(' '), QUESTION.prompt);
  for (const [index, word] of expected.entries()) {
    assert.equal(getG4L3Ts008TeachingState(word.frame).question, expected.slice(0,index + 1).map(word => word.text).join(' '));
    assert.equal(getG4L3Ts008TeachingState(word.frame - 1).question, expected.slice(0,index).map(word => word.text).join(' '));
  }
});

test('intro holds and first visible alpha do not expose all lesson text at frame one', () => {
  assert.equal(snapshot(initial(0), 1).blocks.filter(block => block.visible).length, 0);
  assert.deepEqual(snapshot(initial(0), 2).blocks.filter(block => block.visible).map(block => block.id), ['step-1','step-2','step-3','step-4']);
  assert.equal(snapshot(initial(0), 8).blocks.filter(block => block.id.startsWith('choice') && block.visible).length, 0);
  assert.equal(snapshot(initial(0), 9).blocks.filter(block => block.id.startsWith('choice') && block.visible).length, 4);
  assert.equal(getG4L3Ts008TeachingState(33).question, 'Toni has $7.');
  assert.equal(getG4L3Ts008TeachingState(57).question, 'Toni has $7. Elvin has $3.');
  assert.equal(getG4L3Ts008TeachingState(110).question, 'Toni has $7. Elvin has $3. Susan owes $10. Ricky owes $2.');
});

test('source strategies appear at their reveal or main placement and remain after being taught', () => {
  let state = initial(0);
  assert.ok(!visibleIds(state).includes('step-1-question'));
  state = reduce(state, {type:'continue-walkthrough'});
  assert.equal(state.frame, 465);assert.ok(visibleIds(state).includes('step-1-question'));assert.ok(!visibleIds(state).includes('given'));
  state = reduce(state, {type:'continue-walkthrough'});
  assert.equal(state.frame, 592);assert.ok(visibleIds(state).includes('given'));assert.ok(!visibleIds(state).includes('draw-answer'));
  state = reduce(state, {type:'reveal-walkthrough-box'});
  assert.ok(visibleIds(state).includes('draw-answer'));
  assert.deepEqual(visible(state).filter(block => block.id.startsWith('person-')).map(block => block.text), ['Susan −10','Ricky −2','Elvin 3','Toni 7']);
  assert.deepEqual(visible(state).filter(block => block.id.startsWith('tick-')).map(block => Number(block.text.replace('−','-'))), Array.from({length:25},(_,i)=>i-12));
  state = reduce(state, {type:'close-walkthrough-box'});
  assert.equal(state.frame, 712);assert.ok(visibleIds(state).includes('draw-answer'));assert.ok(!visibleIds(state).includes('logic-answer'));
  state = reduce(state, {type:'reveal-walkthrough-box'});
  assert.ok(visibleIds(state).includes('logic-answer'));
  assert.deepEqual(visible(state).filter(block => /^logic-\d$/.test(block.id)).map(block => block.text), ['Toni has $7 = +7','Elvin has $3 = +3','Susan owes $10 = −10','Ricky owes $2 = −2']);
  state = reduce(state, {type:'close-walkthrough-box'});
  assert.equal(state.phase,'quiz');assert.equal(state.frame,770);
  assert.ok(visibleIds(state).includes('draw-answer'));assert.ok(visibleIds(state).includes('logic-answer'));
});

test('all seven seeded feedback windows preserve retry and terminal branches', () => {
  for (const [choiceId, windows] of [['A',WRONG],['D',RIGHT]] as const) for (let seed = 0;seed < windows.length;seed++) {
    let state = reduce(quiz(seed), {type:'choose',choiceId});
    const report = snapshot(state,328,{seed});
    assert.equal(report.blocks.find(block => block.id === 'feedback')?.text, windows[seed].copy);
    assert.equal(state.feedback?.sourceWindow.projectedDurationMs, windows[seed].projectedDurationMs);
    assert.ok(!report.blocks.some(block => block.id === 'terminal' && block.visible));
    state = reduce(state,{type:'feedback-complete'});
    if (choiceId === 'A') {
      assert.equal(state.phase,'quiz');assert.equal(state.wrongTryCount,1);assert.equal(state.focusTarget,'choice-A');
      state = reduce(state,{type:'choose',choiceId:'B'});state = reduce(state,{type:'feedback-complete'});
    }
    assert.equal(state.phase,'terminal');assert.equal(state.frame,789);
    assert.ok(visibleIds(state).includes('terminal'));
    assert.deepEqual(visibleIds(state).filter(id => id.startsWith('choice-')),['choice-D']);
    state = reduce(state,{type:'replay',seed});
    assert.deepEqual(state,initial(seed));assert.ok(!visibleIds(state).includes('terminal'));
  }
});

test('Help control binds both source paints and follows actual modal/phase visibility', async () => {
  const block = BINDING.blocks.find(block => block.id === 'need-more-help')!;
  assert.deepEqual(block.sourceTextIds, ['character-4/run-0', 'character-5/run-0']);
  assert.equal(BINDING.blocks.length, 84);
  assert.equal(new Set(BINDING.blocks.flatMap(block => block.sourceTextIds)).size, 89);
  const source = await sourceAsset;
  const texts = source.textDefinitions.filter((definition: any) => [4,5].includes(definition.characterId))
    .flatMap((definition: any) => definition.runs.map((run: any) => run.text.trim()));
  assert.deepEqual(texts, ['Need More Help', 'Need More Help']);
  const helpBlock = (state: CourseG04L03Ts008InteractionState, frame = state.frame) =>
    snapshot(state, frame).blocks.find(block => block.id === 'need-more-help')!;
  let state = initial(0);
  for (const frame of [1,2,9,123,327,328]) assert.equal(helpBlock(state, frame).visible, false);
  state = reduce(state, {type:'continue-walkthrough'}); assert.equal(helpBlock(state).visible, false);
  state = reduce(state, {type:'continue-walkthrough'}); assert.equal(helpBlock(state).visible, false);
  for (const expectedFrame of [592,712]) {
    assert.equal(state.frame, expectedFrame);
    state = reduce(state, {type:'reveal-walkthrough-box'});
    assert.deepEqual({text:helpBlock(state).text,visible:helpBlock(state).visible}, {text:texts[0],visible:true});
    const help = reduce(state, {type:'open-need-more-help'});
    assert.equal(helpBlock(help).visible, false);
    state = reduce(help, {type:'close-need-more-help'}); assert.equal(helpBlock(state).visible, true);
    state = reduce(state, {type:'close-walkthrough-box'});
  }
  assert.equal(state.phase, 'quiz'); assert.equal(helpBlock(state).visible, true);
  assert.equal(helpBlock(reduce(state, {type:'open-need-more-help'})).visible, false);
  for (const choiceId of ['A','D'] as const) {
    const feedback = reduce(state, {type:'choose',choiceId}); assert.equal(helpBlock(feedback).visible, false);
    const finished = reduce(feedback, {type:'feedback-complete'});
    assert.equal(helpBlock(finished).visible, choiceId === 'A');
  }
});

test('help hides activity text, contains only same-source integers, and restores its prior state', () => {
  for (const start of [quiz(),reduce(reduce(reduce(initial(0),{type:'continue-walkthrough'}),{type:'continue-walkthrough'}),{type:'reveal-walkthrough-box'})]) {
    const help = reduce(start,{type:'open-need-more-help'});
    assert.equal(help.phase,'need-more-help');
    assert.ok(!visibleIds(help).includes('question'));assert.ok(!visibleIds(help).includes('draw-answer'));
    assert.deepEqual(visible(help).filter(block => block.id.startsWith('help-tick')).map(block => block.text),Array.from({length:21},(_,i)=>i-10).map(n=>n<0?`−${-n}`:String(n)));
    const restored = reduce(help,{type:'close-need-more-help'});
    assert.equal(restored.phase,start.phase);assert.equal(restored.walkthroughBoxRevealed,start.walkthroughBoxRevealed);assert.equal(restored.frame,start.frame);assert.equal(restored.focusTarget,'need-more-help');
  }
});

test('snapshot fails closed for mismatched source and unsupported frame, locale, and evidence contexts', () => {
  for (const [frame,changes] of [[328,{lang:'es'}],[790,{}],[0,{}],[328,{frameDomain:'root'}],[328,{rootFrame:5}],[328,{entryStateSha256:'a'.repeat(64)}]] as const) {
    const result = snapshot(initial(0),frame,changes);assert.equal(result.status,'blocked');assert.equal(result.blocks.length,0);
  }
  const request=context();const state=getCourseG04L03Ts008FrameState(328,request);
  assert.equal(getG4L3Ts008TextSnapshot({...state,sourceSwfSha256:'0'.repeat(64)},request).status,'blocked');
  assert.deepEqual(snapshot().suppressedInstances,[]);
});

test('modern surface emits real HTML and reuses one original controller without the source canvas', () => {
  const markup = renderToStaticMarkup(<G4L3Ts008ModernRenderer {...context()}/>);
  assert.match(markup,/shared-original-reducer/);assert.match(markup,/Reveal step 1/);assert.match(markup,/Toni has \$7/);
  assert.match(markup,/@media \(max-width:760px\).*data-lesson-platform-header='true'.*background:var\(--lesson-platform-bg\)/);
  assert.doesNotMatch(markup,/<canvas|<iframe|correct answer choice|source-window timing|original.runtime/);
  assert.equal((markup.match(/data-modern-text-page=/g)??[]).length,1);
});

test('blocked modern contexts render unavailable without dereferencing missing Help text', () => {
  for (const changes of [{entryStateSha256:'a'.repeat(64)}, {lang:'es' as const}]) {
    const request = context(328, changes);
    const state = getCourseG04L03Ts008FrameState(328, request);
    const blocked = getG4L3Ts008TextSnapshot(state, request);
    assert.equal(blocked.status, 'blocked'); assert.deepEqual(blocked.blocks, []);
    const markup = renderToStaticMarkup(<G4L3Ts008ModernRenderer {...request}/>);
    assert.match(markup, /role="status">This lesson view is unavailable in the selected context/);
    assert.doesNotMatch(markup, /data-lesson-text-block="need-more-help"/);
  }
});

test('checked binding receipt binds current renderer and controller dependency bytes', async () => {
  const workBinding=process.env.HELP_MATH_TS008_WORK_BINDING;
  if(workBinding)assert.match(workBinding,/^work\/typography-v1\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.json$/,'Explicit work candidate only');
  const receipt=JSON.parse(await readFile(root+(workBinding??'catalog/typography-v1/page-bindings/g04-l03-placement-036.json'),'utf8'));
  assert.equal(receipt.implementation.status,'candidate');
  assert.equal(receipt.sourceSwfSha256,BINDING.sourceSwfSha256);
  assert.equal(receipt.placementId,'g04-l03-placement-036');
  assert.equal(receipt.animationId,'course-g04-l03-ts-008');
  for(const required of ['packages/demos/src/modern-lessons/g4-l3-ts008.tsx','packages/demos/src/modern-lessons/g4-l3-ts008.test.tsx'])assert(receipt.implementation.files.some(file=>file.path===required));
  for(const file of receipt.implementation.files) assert.equal(createHash('sha256').update(await readFile(root+file.path)).digest('hex'),file.sha256,file.path);
  assert.equal(receipt.acceptanceEffects.strictComplete,false);
});


test('help glossary links bind actual source controls and exact bilingual source index entries', async () => {
  const bytes=await readFile(root+'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),G4_L3_TS008_KEY_TERMS_CAPABILITY.sourceSha256);
  const index=JSON.parse(await readFile(root+'apps/web/public/generated/g4-grade-wide-keyterms-en.json','utf8'));
  const actions=gunzipSync(await readFile(root+'migrations/course-g04-l03-ts-008/audit/machine/ffdec-scripts.txt.gz')).toString();
  for(const term of G4_L3_TS008_KEY_TERMS){
    const entry=index.entries.find((entry:any)=>entry.id===term.entryId);
    assert.equal(entry?.titles.en,term.term);assert.ok(entry.definitions.en);assert.ok(entry.definitions.es);
    assert.ok(actions.includes(`DefineButton2_${term.characterId}/BUTTONCONDACTION`));
    assert.ok(actions.includes(`_global.KeyAttribute = "${term.term}"`));
  }
});

test('modern source-stop audio retains original English and independent Spanish declarations',async()=>{
 const {default:original}=await import('../modules/course-g04-l03-ts-008');
 const {G4_L3_TS008_SOURCE_AUDIO_CUES}=await import('./g4-l3-ts008');
 assert.deepEqual(G4_L3_TS008_SOURCE_AUDIO_CUES,original.audioCues);assert.equal(G4_L3_TS008_SOURCE_AUDIO_CUES[0].frame,7);assert.equal(G4_L3_TS008_SOURCE_AUDIO_CUES[0].endFrame,783);assert.equal(G4_L3_TS008_SOURCE_AUDIO_CUES[0].language,'en');
 for(const cue of G4_L3_TS008_SOURCE_AUDIO_CUES)assert.equal(createHash('sha256').update(await readFile(root+'apps/web/public'+cue.source)).digest('hex'),cue.sha256);
 assert.equal(original.audioTracks?.find(track=>track.language==='es')?.sha256,'1f1b05f78d571ed7c756013377bee1a86d0e893b45c6bf381bf9340ae22a764c');
});


test('outlined minus signs and feedback caption retain distinct exact source decisions',async()=>{
 const receipt=JSON.parse(await readFile(root+'catalog/typography-v1/page-bindings/g04-l03-placement-036.json','utf8'));const source=await sourceAsset;
 for(const block of BINDING.blocks)for(const id of ('sourceShapeIds' in block?block.sourceShapeIds:[])??[]){
  const shape=source.shapeDefinitions.find((shape:any)=>shape.characterId===id);
  assert([128,150,163,180,181,188].includes(id),'Unknown outlined shape '+id);
  const caption=[180,181,188].includes(id);
  const expected=caption?"That's incorrect!":'−';
  const decision=receipt.sourceRoleDecisions.find((d:any)=>d.kind==='outlined-text'&&d.role===block.role&&d.sourceShapeIds.includes(id)&&d.semanticValue===expected&&d.sourceShapeHashes.some((h:any)=>h.characterId===id&&h.sourceTagSha256===shape.sourceTagSha256));
  assert(decision,block.id+':'+id);
  if(caption){const policy=JSON.parse(await readFile(root+'scripts/inputs/typography-v1/g4-l3-ts008/outlined-feedback-v2.json','utf8'));assert.equal(policy.pairedSourceText.characterId,175);assert.equal(policy.semanticValue,expected);assert.deepEqual(decision.branchScope,policy.branchScope);}
 }
});


test('actual host main frames reveal source content, not the reducer projected stop',async()=>{
 const source=await sourceAsset,main=source.timelines.find((t:any)=>t.timelineId==='sprite-350');
 for(const [character,first,blockId]of [[51,329,'step-1-question'],[92,466,'given'],[99,593,'draw-strategy'],[144,713,'logic-strategy']] as const){
  const instance=main.instances.find((i:any)=>i.characterId===character);assert.equal(instance.firstFrame,first);assert.equal(instance.lastFrameExclusive,790);
  assert.equal(snapshot(initial(),first-1).blocks.find(b=>b.id===blockId)?.visible,false);assert.equal(snapshot(initial(),first).blocks.find(b=>b.id===blockId)?.visible,true);assert.equal(snapshot(initial(),789).blocks.find(b=>b.id===blockId)?.visible,true);
 }
});

test('source child completion is accepted only for its placed instance at frame770',async()=>{
 const {G4_L3_TS008_ACTIVITY_TIMELINES:defs,getG4L3Ts008FeedbackActivity}=await import('./g4-l3-ts008');
 const source=await sourceAsset,main=source.timelines.find((t:any)=>t.timelineId==='sprite-350');assert.equal(defs.length,7);
 for(const d of defs){const event=main.events.find((e:any)=>e.frame===770&&'sprite-350/'+e.name?.text===d.sourceInstanceId);const instance=main.instances.find((i:any)=>i.instanceId===event?.instanceId);assert(instance);assert.deepEqual(d.parentLifetime,{firstFrame:770,lastFrameExclusive:771});assert.equal(instance.characterId,Number(d.frameDomain.replace('sprite-','')));
  const [kind,branch]=d.id.split('-');const i=reduce(quiz(Number(branch)-1),{type:'choose',choiceId:kind==='right'?'D':'A'});
  const a={id:d.id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:d.endFrame,revision:1,status:'completed' as const};assert.equal(getG4L3Ts008FeedbackActivity(i,a).complete,true);assert.equal(getG4L3Ts008FeedbackActivity(i,{...a,sourceInstanceId:'different-instance'}).complete,false);assert.equal(getG4L3Ts008FeedbackActivity(i,a,1).complete,false);
 }
});


test('modern module loader validates all declared source activities and completion frames',async()=>{
 const {loadAnimationModuleForPresentation}=await import('../animation-registry');const module=await loadAnimationModuleForPresentation('course-g04-l03-ts-008',{modernText:true});assert.equal(module?.textPresentation?.activityTimelines?.length,7);assert.deepEqual(module?.textPresentation?.completion?.frames,[789]);
});


test('main and help number-line keyboard scrolling preserves live teaching state and focus', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {url: 'http://localhost/', pretendToBeVisual: true});
  const prior = new Map<string, PropertyDescriptor | undefined>();
  class TestResizeObserver {observe() {} disconnect() {} unobserve() {}}
  const installed: Record<string, unknown> = {window: dom.window, document: dom.window.document,
    HTMLElement: dom.window.HTMLElement, HTMLButtonElement: dom.window.HTMLButtonElement, Node: dom.window.Node,
    navigator: dom.window.navigator, ResizeObserver: TestResizeObserver,
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    IS_REACT_ACT_ENVIRONMENT: true};
  for (const [name, value] of Object.entries(installed)) {
    prior.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {configurable: true, writable: true, value});
  }
  // JSDOM supplies no layout/scrollIntoView. This test exercises actual React handlers;
  // viewport dimensions below are synthetic, never browser reachability evidence.
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const doc = dom.window.document, reactRoot = createRoot(doc.getElementById('root')!);
  let frame = 328, pendingFrame: number | null = null;
  const transitions: unknown[] = [], activities: unknown[] = [];
  const render = async () => act(async () => reactRoot.render(<G4L3Ts008ModernRenderer {...context(frame)} paused={false}
    onLessonFrameRequest={request => {transitions.push(request); pendingFrame = request.stopFrame; return true;}}
    onLessonActivityRequest={request => {activities.push(request); return true;}}/>));
  const click = async (key: string) => {
    const button = doc.querySelector<HTMLButtonElement>(`[data-ts008-focus-control="${key}"]`)!;
    assert.ok(button, key); assert.equal(button.disabled, false, key);
    await act(async () => button.click());
    if (pendingFrame !== null) {frame = pendingFrame; pendingFrame = null; await render();}
  };
  const key = async (target: HTMLElement, value: string, changes: KeyboardEventInit = {}) => {
    const event = new dom.window.KeyboardEvent('keydown', {bubbles: true, cancelable: true, key: value, ...changes});
    await act(async () => target.dispatchEvent(event));
    return event.defaultPrevented;
  };
  const inspectViewport = async (viewport: HTMLElement, count: number) => {
    assert.equal(viewport.getAttribute('tabindex'), '0');
    assert.equal(viewport.getAttribute('aria-keyshortcuts'), 'ArrowLeft ArrowRight Home End');
    assert.equal(viewport.querySelectorAll('[data-lesson-text-block]').length, count);
    Object.defineProperties(viewport, {clientWidth: {configurable: true, value: 300}, scrollWidth: {configurable: true, value: 1248}});
    viewport.scrollLeft = 400; await act(async () => viewport.focus());
    const host = doc.querySelector('[data-ts008-controller]')!;
    const before = {phase: host.getAttribute('data-interaction-phase'), frame: host.getAttribute('data-ts008-interaction-frame'),
      teaching: [...doc.querySelectorAll('[data-lesson-text-block]')].map(node => [node.getAttribute('data-lesson-text-block'), node.textContent]),
      transitions: transitions.length, activities: activities.length};
    assert.equal(await key(viewport, 'ArrowRight'), true); assert.equal(viewport.scrollLeft, 460);
    assert.equal(await key(viewport, 'ArrowLeft'), true); assert.equal(viewport.scrollLeft, 400);
    assert.equal(await key(viewport, 'Home'), true); assert.equal(viewport.scrollLeft, 0);
    assert.equal(await key(viewport, 'ArrowLeft'), true); assert.equal(viewport.scrollLeft, 0);
    assert.equal(await key(viewport, 'End'), true); assert.equal(viewport.scrollLeft, 948);
    assert.equal(await key(viewport, 'ArrowRight'), true); assert.equal(viewport.scrollLeft, 948);
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
      assert.equal(await key(viewport, 'Home', {[modifier]: true}), false); assert.equal(viewport.scrollLeft, 948);
    }
    assert.equal(await key(viewport, 'x'), false); assert.equal(viewport.scrollLeft, 948);
    const tick = viewport.querySelector<HTMLElement>('[data-lesson-text-block]')!;
    assert.equal(await key(tick, 'Home'), false); assert.equal(viewport.scrollLeft, 948);
    assert.equal(doc.activeElement, viewport);
    Object.defineProperty(viewport, 'clientWidth', {configurable: true, value: 1248}); viewport.scrollLeft = 0;
    for (const value of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
      assert.equal(await key(viewport, value), false); assert.equal(viewport.scrollLeft, 0);
    }
    assert.deepEqual({phase: host.getAttribute('data-interaction-phase'), frame: host.getAttribute('data-ts008-interaction-frame'),
      teaching: [...doc.querySelectorAll('[data-lesson-text-block]')].map(node => [node.getAttribute('data-lesson-text-block'), node.textContent]),
      transitions: transitions.length, activities: activities.length}, before);
    assert.equal(doc.activeElement, viewport);
  };
  try {
    await render(); assert.equal(doc.querySelector('[data-lesson-text-block="need-more-help"]'), null); await click('walkthrough-step-1'); await click('walkthrough-step-2'); await click('walkthrough-step-3');
    assert.equal(frame, 592);
    const helpMarker = () => doc.querySelector<HTMLButtonElement>('[data-lesson-text-block="need-more-help"]');
    assert.equal(helpMarker()?.getAttribute('data-ts008-focus-control'), 'need-more-help');
    assert.equal(helpMarker()?.textContent, 'Need More Help');
    const main = doc.querySelector<HTMLElement>('.ts008-modern__content .ts008-modern__number-viewport')!;
    assert.ok(main); await inspectViewport(main, 25);
    await click('need-more-help');
    assert.equal(helpMarker(), null);
    const dialog = doc.querySelector<HTMLElement>('.ts008-modern__dialog')!;
    assert.ok(dialog); const help = dialog.querySelector<HTMLElement>('.ts008-modern__number-viewport')!;
    assert.ok(help); await inspectViewport(help, 21);
    await click('need-more-help-close');
    assert.equal(doc.querySelector('.ts008-modern__dialog'), null);
    assert.equal(doc.querySelector('[data-ts008-controller]')!.getAttribute('data-interaction-phase'), 'walkthrough');
    assert.equal(doc.querySelector('[data-ts008-controller]')!.getAttribute('data-ts008-interaction-frame'), '592');
    assert.deepEqual(activities, []);
    assert.equal(helpMarker()?.textContent, 'Need More Help');
    await click('walkthrough-box-3-close'); assert.equal(helpMarker(), null);
    await click('walkthrough-step-4'); assert.equal(helpMarker()?.textContent, 'Need More Help');
    await click('walkthrough-box-4-close'); assert.equal(frame, 770); assert.ok(helpMarker());
    await click('need-more-help'); assert.equal(helpMarker(), null);
    await click('need-more-help-close'); assert.ok(helpMarker());
    await click('choice-A'); assert.equal(helpMarker(), null);
  } finally {
    await act(async () => reactRoot.unmount()); dom.window.close();
    for (const [name, descriptor] of prior) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name);
    }
  }
});

test('new answer waits for its admitted activity revision before showing feedback', async () => {
  const {G4_L3_TS008_ACTIVITY_TIMELINES}=await import('./g4-l3-ts008');
  const first=reduce(quiz(0),{type:'choose',choiceId:'A'});
  const retry=reduce(reduce(first,{type:'feedback-complete'}),{type:'choose',choiceId:'A'});
  assert.equal(retry.feedback?.branch,first.feedback?.branch);
  const branch=G4_L3_TS008_ACTIVITY_TIMELINES.find(b=>b.id==='wrong-1')!;
  const activity={id:branch.id,sourceInstanceId:branch.sourceInstanceId,frameDomain:branch.frameDomain,frame:4,revision:7,status:'playing' as const};
  const request=context(770),state=getCourseG04L03Ts008FrameState(770,request);
  const feedback=(a:typeof activity)=>getG4L3Ts008TextSnapshot(state,request,retry,a,7).blocks.find(b=>b.id==='feedback');
  assert.equal(feedback(activity)?.visible,false,'Previous admitted revision must not paint new feedback');
  assert.equal(feedback({...activity,revision:8})?.visible,true);
  assert.equal(feedback({...activity,revision:8,frame:3})?.visible,false,'New revision must still respect source reveal');
});
