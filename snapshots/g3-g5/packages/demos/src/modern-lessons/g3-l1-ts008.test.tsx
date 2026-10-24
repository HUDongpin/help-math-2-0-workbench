import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG03L01Ts008FrameState, COURSE_G03_L01_TS_008_SOURCE} from '../timelines/course-g03-l01-ts-008';
import {readTextSourceAsset} from '../../../../scripts/build-lesson-text-source-catalog-v1.mjs';
import {
  G3L1Ts008ModernRenderer, G3_L1_TS008_BEATS, G3_L1_TS008_CHOICES,
  G3_L1_TS008_FEEDBACK, G3_L1_TS008_FRAME_TRANSITIONS, G3_L1_TS008_PLACES,
  G3_L1_TS008_TEXT_BINDING, G3_L1_TS008_TEXT_PRESENTATION,
  G3_L1_TS008_ACTIVITY_TIMELINES, getG3L1Ts008FeedbackActivity,
  G3_L1_TS008_ANGLE_PARAGRAPHS, G3_L1_TS008_KEY_TERMS,
  createG3L1Ts008Interaction, getG3L1Ts008TeachingState, getG3L1Ts008TextSnapshot,
  reduceG3L1Ts008Interaction, synchronizeG3L1Ts008Interaction,
} from './g3-l1-ts008';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const context = (frame: number, changes: Partial<RuntimeContext> = {}): RuntimeContext =>
  ({frame, frameDomain: 'sprite-348', rootFrame: 6, scenario: 'source-drawing-default', lang: 'en', seed: 0, replay: 0, ...changes});
const source = (async () => {
  const index = JSON.parse(await readFile(`${root}catalog/typography-v1/source-catalog/index.json`, 'utf8'));
  return readTextSourceAsset(root, index.assets.find((asset: any) => asset.sourceSha256 === COURSE_G03_L01_TS_008_SOURCE.swfSha256));
})();
const scripts = (async () => {
  const bytes = await readFile(`${root}migrations/course-g03-l01-ts-008/audit/machine/ffdec-scripts.txt.gz`);
  assert.equal(hash(bytes), '8732f240411fc572cf0e58c3bc5e620eb7f1c3ba459f797b9cc4ba7322a31ebd');
  const text = gunzipSync(bytes).toString();
  assert.equal(hash(text), 'e50e5e933915d9ee8c14a2b81728d7f17cdc4d897dbed94f1d200f8792c53bd3');
  return text;
})();
const snapshot = (frame: number, interaction = createG3L1Ts008Interaction(), changes: Partial<RuntimeContext> = {}) => {
  const request = context(frame, changes);
  return getG3L1Ts008TextSnapshot(getCourseG03L01Ts008FrameState(frame, request), request, interaction);
};
const visibleText = (frame: number, interaction = createG3L1Ts008Interaction()) =>
  snapshot(frame, interaction).blocks.filter(block => block.visible).map(block => block.text).join('\n');

test('every maintained source text ID and mathematical value resolves in the exact P1 asset', async () => {
  const asset = await source;
  const ids = new Set(asset.textDefinitions.flatMap((text: any) => text.runs.map((run: any) => run.sourceTextId)));
  for (const block of G3_L1_TS008_TEXT_BINDING.blocks) for (const id of block.sourceTextIds) assert(ids.has(id), id);
  assert.equal(G3_L1_TS008_TEXT_BINDING.placementId, 'g03-l01-placement-071');
  assert.equal(asset.summary.unresolvedRuns, 0);
  const sourceText = (id: number) => asset.textDefinitions.find((text: any) => text.characterId === id).runs.map((run: any) => run.text).join('');
  assert.equal(sourceText(39), 'Which digit in 93,816 is in the thousands place?');
  assert.equal(Number(G3_L1_TS008_PLACES.map(place => place.digit).join('')), 93816);
  assert.equal(Number(G3_L1_TS008_PLACES.map(place => place.exampleDigit).join('')), 17589);
  assert.equal(G3_L1_TS008_PLACES.find(place => place.key === 'thousands')?.digit, 3);
  for (const place of G3_L1_TS008_PLACES) {
    assert.equal(sourceText(place.labelCharacter), place.label);
    assert.equal(sourceText(place.digitCharacter), String(place.digit));
    assert.equal(sourceText(place.exampleCharacter), String(place.exampleDigit));
  }
  for (const choice of G3_L1_TS008_CHOICES) {
    assert.equal(sourceText(choice.letterCharacter), choice.letter);
    assert.equal(sourceText(choice.digitCharacter), String(choice.value));
  }
});

test('optional angle reference preserves exact source paragraphs and every separate glossary occurrence', async () => {
  const asset = await source;
  const definition = asset.textDefinitions.find((item: any) => item.characterId === 326);
  const exact = JSON.parse(await readFile(`${root}work/typography-v1/pipeline-v592/source-review/angle-reference-spans-candidate.json`, 'utf8'));
  const dictionary = JSON.parse(await readFile(`${root}apps/web/public/generated/g4-grade-wide-keyterms-en.json`, 'utf8'));
  assert.equal(dictionary.source.sha256,G3_L1_TS008_TEXT_PRESENTATION.keyTerms.sourceSha256);
  assert.equal(exact.sourceSwfSha256,asset.sourceSha256);
  const timeline = asset.timelines.find((item:any) => item.timelineId === 'sprite-346');
  let count = 0;
  for (const [index,paragraph] of G3_L1_TS008_ANGLE_PARAGRAPHS.entries()) {
    const words = paragraph.segments.map(segment => typeof segment === 'string' ? segment : segment.label).join('');
    const sourceRuns = definition.runs.slice(paragraph.firstRun,paragraph.lastRun+1);
    assert.equal(words,sourceRuns.map((run:any)=>run.text).join(''));
    assert.equal(words,exact.paragraphs[index].text);
    const binding = G3_L1_TS008_TEXT_BINDING.blocks.find(block=>block.id===paragraph.id)!;
    assert.deepEqual(binding.sourceTextIds,sourceRuns.map((run:any)=>run.sourceTextId));
    let offset = 0;
    const links = [];
    for (const segment of paragraph.segments) {
      if (typeof segment !== 'string') {
        const expected = exact.paragraphs[index].links[links.length];
        const entry = G3_L1_TS008_KEY_TERMS[segment.name];
        assert.equal(offset,expected.start);assert.equal(offset+segment.label.length,expected.end);
        assert.equal(segment.label,expected.text);assert.equal(segment.sourceInstanceId,expected.sourceInstanceId);
        assert.equal(segment.buttonCharacter,expected.sourceButtonCharacterId);assert.equal(segment.name,expected.sourceKeyAttribute);
        assert.equal(entry.entryId,expected.entryId);
        assert.equal(dictionary.entries.find((item:any)=>item.id===entry.entryId)?.titles.en,segment.name);
        const placement = timeline.instances.find((item:any)=>item.instanceId===segment.sourceInstanceId);
        assert.equal(placement.characterId,segment.buttonCharacter);assert.equal(placement.firstFrame,2);
        const button = asset.buttonDefinitions.find((item:any)=>item.characterId===segment.buttonCharacter);
        assert.equal(button.sourceTagSha256,expected.sourceButtonSha256);
        links.push(segment.sourceInstanceId);count++;
      }
      offset += typeof segment === 'string' ? segment.length : segment.label.length;
    }
    assert.equal(links.length,exact.paragraphs[index].links.length);
  }
  assert.equal(count,19);
  assert.deepEqual(G3_L1_TS008_TEXT_BINDING.blocks.find(block=>block.id==='angle-close')?.sourceTextIds,['character-331/run-0']);
  assert(!G3_L1_TS008_TEXT_BINDING.blocks.some(block=>block.sourceTextIds.some(id=>id.startsWith('character-323/'))));
});

test('angle reference is an explicit quiz Help subview and cannot alter main answer progression', () => {
  const initial = createG3L1Ts008Interaction();
  for (const frame of [1,295,434,550,659,728,747]) {
    assert.equal(reduceG3L1Ts008Interaction(initial,frame,{type:'open-angle-reference'}).allowed,false);
    assert(!snapshot(frame).blocks.some(block=>block.id.startsWith('angle-')&&block.visible));
  }
  const primary = reduceG3L1Ts008Interaction(initial,728,{type:'open-help'}).nextState;
  assert.equal(primary.help,'place-value');assert.equal(primary.helpView,'primary');
  assert.match(visibleText(728,primary),/17,589/);assert.doesNotMatch(visibleText(728,primary),/Right angles/);
  const opened = reduceG3L1Ts008Interaction(primary,728,{type:'open-angle-reference'});
  assert(opened.allowed);assert.equal(opened.frameRequest,null);
  const angles = opened.nextState;
  const blocks = snapshot(728,angles).blocks.filter(block=>block.visible);
  assert.deepEqual(blocks.filter(block=>block.id.startsWith('angle-')).map(block=>block.id),[
    'angle-right','angle-acute','angle-obtuse','angle-straight','angle-close']);
  assert(!blocks.some(block=>block.id.startsWith('help-')));
  assert.equal(reduceG3L1Ts008Interaction(angles,728,{type:'answer',value:3}).allowed,false);
  assert.equal(reduceG3L1Ts008Interaction(angles,728,{type:'continue'}).allowed,false);
  const back = reduceG3L1Ts008Interaction(angles,728,{type:'back-to-place-value'});
  assert.deepEqual(back.nextState,primary);assert.equal(back.frameRequest,null);
  const closed = reduceG3L1Ts008Interaction(angles,728,{type:'close-help'});
  assert.deepEqual(closed.nextState,initial);assert.equal(closed.frameRequest,null);
  assert(reduceG3L1Ts008Interaction(closed.nextState,728,{type:'answer',value:3}).allowed);
  for (const changes of [{replay:1},{seed:1}]) {
    const current = synchronizeG3L1Ts008Interaction(angles,context(728,changes));
    assert.equal(current.help,null);assert.equal(current.helpView,'primary');
  }
  assert(!snapshot(729,angles).blocks.some(block=>block.id.startsWith('angle-')&&block.visible));
  for (const frame of [550,659]) {
    const other = reduceG3L1Ts008Interaction(initial,frame,{type:'open-help'}).nextState;
    assert.equal(reduceG3L1Ts008Interaction(other,frame,{type:'open-angle-reference'}).allowed,false);
  }
});

test('question and step thresholds are exact source alpha and permanent-placement facts', async () => {
  const asset = await source;
  const timeline = asset.timelines.find((item: any) => item.timelineId === 'sprite-348');
  const questionEvents = timeline.events.filter((event: any) => event.instanceId === 'sprite-348/depth-45/generation-1');
  assert.equal(questionEvents.find((event: any) => event.colorTransform?.multiply[3] > 0).frame, G3_L1_TS008_BEATS.firstQuestionAndChoices);
  for (const [character, frame] of [[61,296],[102,435],[103,435],[106,551],[112,551],[136,660],[141,660]]) {
    assert.equal(timeline.instances.find((instance: any) => instance.characterId === character).firstFrame, frame);
  }
  for (const [lastHidden, firstVisible, id] of [[8,9,'question'],[295,296,'step1-instruction'],
    [434,435,'given'],[550,551,'chart-answer'],[659,660,'reasoning-answer']] as const) {
    assert.equal(snapshot(lastHidden).blocks.find(block => block.id === id)?.visible, false);
    assert.equal(snapshot(firstVisible).blocks.find(block => block.id === id)?.visible, true);
  }
});

test('explicit source-hidden help is not exposed by the old FFDec static popup drawing', async () => {
  const text = await scripts;
  for (const [frame, marker] of [[550,'Mc_box1._visible = false;'],[659,'Mc_box2._visible = false;'],[728,'Mc_Popup._visible = false;']] as const) {
    const block = text.split(`===== DefineSprite_348/frame_${frame}/DoAction.as =====`)[1]?.split('=====')[0];
    assert(block?.includes(marker), `${frame}: ${marker}`);
  }
  assert.doesNotMatch(visibleText(550), /correct answer choice/);
  assert.doesNotMatch(visibleText(659), /93 is in the thousands group/);
  assert.doesNotMatch(visibleText(728), /17,589|standard form/);
  assert.doesNotMatch(visibleText(480), /Nice try|incorrect|angle/i);
  const picture = reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(), 550, {type:'open-help'}).nextState;
  assert.match(visibleText(550,picture), /correct answer choice is A/);
  const general = reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(), 728, {type:'open-help'}).nextState;
  assert.match(visibleText(728,general), /17,589/);
  assert.equal(reduceG3L1Ts008Interaction(general,728,{type:'answer',value:3}).allowed,false);
  assert.equal(reduceG3L1Ts008Interaction(general,728,{type:'close-help'}).frameRequest,null);
});

test('all five requested host transitions match authored stops and release behavior', async () => {
  const text = await scripts;
  assert.deepEqual(G3_L1_TS008_FRAME_TRANSITIONS, [
    {fromFrame:295,toFrame:296,stopFrame:434},{fromFrame:434,toFrame:435,stopFrame:550},
    {fromFrame:550,toFrame:551,stopFrame:659},{fromFrame:659,toFrame:660,stopFrame:728},
    {fromFrame:728,toFrame:729,stopFrame:747},
  ]);
  for (const edge of G3_L1_TS008_FRAME_TRANSITIONS) {
    assert.match(text.split(`===== DefineSprite_348/frame_${edge.fromFrame}/DoAction.as =====`)[1]?.split('=====')[0] ?? '', /stop\(\);/);
    assert.match(text.split(`===== DefineSprite_348/frame_${edge.stopFrame}/DoAction.as =====`)[1]?.split('=====')[0] ?? '', /stop\(\);/);
  }
  assert.equal(G3_L1_TS008_TEXT_PRESENTATION.playbackEndFrameByDomain['sprite-348'],295);
  assert.equal(G3_L1_TS008_TEXT_PRESENTATION.frameControl.completionFrame,747);
  for (const frame of [295,434,550,659]) assert.equal(reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(),frame,{type:'continue'}).allowed,true);
  for (const frame of [294,296,435,551,660,728,747]) assert.equal(reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(),frame,{type:'continue'}).allowed,false);
  for (const frame of [550,659]) {
    const help=reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(),frame,{type:'open-help'}).nextState;
    assert.deepEqual(reduceG3L1Ts008Interaction(help,frame,{type:'close-help'}).frameRequest,G3_L1_TS008_FRAME_TRANSITIONS.find(edge=>edge.fromFrame===frame));
  }
});

test('correctness follows the placed A=3 button and source handler, not button array position', async () => {
  const text = await scripts;
  for (const choice of G3_L1_TS008_CHOICES) {
    const handler=text.split(`===== DefineButton2_${choice.buttonCharacter}/BUTTONCONDACTION on(release).as =====`)[1]?.split('=====')[0]??'';
    assert.match(handler,choice.value===3?/_root\.showRightFeed\(\)/:/_root\.showWrongFeed\(\)/);
    const result=reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(),728,{type:'answer',value:choice.value});
    assert.equal(result.nextState.feedback?.kind,choice.value===3?'correct':'wrong');
    assert.equal(result.frameRequest,null);
    assert.equal(reduceG3L1Ts008Interaction(result.nextState,728,{type:'answer',value:3}).allowed,false);
    assert.equal(reduceG3L1Ts008Interaction(result.nextState,728,{type:'open-help'}).allowed,false);
  }
  assert.equal(reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(),295,{type:'answer',value:3}).allowed,false);
});

test('first wrong retries; second wrong advances; correct advances only on authored feedback completion', () => {
  let state=createG3L1Ts008Interaction();
  state=reduceG3L1Ts008Interaction(state,728,{type:'answer',value:6}).nextState;
  assert.equal(state.quizTryCount,0);
  let response=reduceG3L1Ts008Interaction(state,728,{type:'feedback-complete'});
  assert.equal(response.frameRequest,null);assert.equal(response.nextState.quizTryCount,1);
  state=reduceG3L1Ts008Interaction(response.nextState,728,{type:'answer',value:8}).nextState;
  response=reduceG3L1Ts008Interaction(state,728,{type:'feedback-complete'});
  assert.deepEqual(response.frameRequest,{fromFrame:728,toFrame:729,stopFrame:747});
  assert.equal(response.nextState.quizTryCount,0);assert.equal(response.nextState.terminalOutcome,'two-wrong-continuation');
  const correct=reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(),728,{type:'answer',value:3}).nextState;
  assert.equal(correct.terminalOutcome,null);
  const acknowledged=reduceG3L1Ts008Interaction(correct,728,{type:'feedback-complete'});
  assert.equal(acknowledged.nextState.terminalOutcome,'correct');
  assert.deepEqual(acknowledged.frameRequest,{fromFrame:728,toFrame:729,stopFrame:747});
});

test('seeded feedback stays in the source host variant sets and Replay resets all local state', async () => {
  const host=JSON.parse(await readFile(`${root}migrations/course-g03-l01-ts-008/audit/host-function-binding.json`,'utf8'));
  const asset=await source;
  assert.equal(host.sourceContracts.wrongAnswer.feedbackVariantCount,3);
  assert.equal(host.sourceContracts.correctAnswer.feedbackVariantCount,4);
  for (const kind of ['wrong','correct'] as const) for (const variant of G3_L1_TS008_FEEDBACK[kind]) {
    const timeline=asset.timelines.find((item:any)=>item.timelineId===`sprite-${variant.sprite}`);
    assert(timeline);
    const reaches = (id: number, target: number, visited = new Set<number>()): boolean => {
      if (id === target) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      return asset.timelines.find((item:any)=>item.timelineId===`sprite-${id}`)?.instances.some((instance:any)=>reaches(instance.characterId,target,visited)) ?? false;
    };
    for(const character of variant.characters) assert(reaches(variant.sprite, character), `unreachable ${variant.sprite} -> ${character}`);
    assert.equal(asset.textDefinitions.find((text:any)=>text.characterId===variant.characters[0]).runs.map((run:any)=>run.text).join(''),variant.text);
  }
  for(const seed of [0,1,2,3,99,0xffffffff]) {
    const state=createG3L1Ts008Interaction(seed,2);
    const a=reduceG3L1Ts008Interaction(state,728,{type:'answer',value:6}).nextState;
    const b=reduceG3L1Ts008Interaction(state,728,{type:'answer',value:6}).nextState;
    assert.deepEqual(a,b);
    assert.deepEqual(synchronizeG3L1Ts008Interaction(a,context(1,{seed,replay:3})),createG3L1Ts008Interaction(seed,3));
  }
});

test('seven feedback activities use exact source completion and visible-text intervals, rejecting stale completions', async () => {
  const asset = await source, text = await scripts;
  assert.equal(G3_L1_TS008_ACTIVITY_TIMELINES.length,7);
  for (const kind of ['wrong','correct'] as const) for (const variant of G3_L1_TS008_FEEDBACK[kind]) {
    const definition=G3_L1_TS008_ACTIVITY_TIMELINES.find(item=>item.id===`${kind}-${variant.variant}`)!;
    const timeline=asset.timelines.find((item:any)=>item.timelineId===definition.frameDomain);
    const namedPlacement=asset.timelines.find((item:any)=>item.timelineId==='sprite-348').events.find((item:any)=>
      item.frame===728&&item.name?.text===`Mc_${kind==='wrong'?'Wrong':'Right'}_Feed${variant.variant}`);
    assert.equal(namedPlacement.characterId,variant.sprite);
    assert.equal(definition.startFrame,2);assert.equal(definition.fps,12);assert.deepEqual(definition.parentFrames,[728]);
    assert.equal(timeline.declaredFrameCount,variant.endFrame);
    const terminal=text.split(`===== DefineSprite_${variant.sprite}/frame_${variant.endFrame}/DoAction.as =====`)[1]?.split('=====')[0]??'';
    assert.match(terminal,/_parent\.play\(\)/);
    assert.match(terminal,kind==='wrong'?/_global\.quizTryCount\+\+/:/_root\.disableQuizButton\(\)/);
    const instance=timeline.instances.find((item:any)=>item.characterId===variant.characters[0]);
    const events=timeline.events.filter((item:any)=>item.instanceId===instance.instanceId);
    const firstVisible=events.find((item:any)=>item.kind==='place'&&(item.colorTransform?.multiply[3]??256)>0);
    assert.equal(firstVisible.frame,variant.firstVisibleFrame);
    const replacementInstances=timeline.instances.filter((item:any)=>item.characterId===variant.characters[0]);
    const lastInstance=replacementInstances.at(-1);
    const lastEvents=timeline.events.filter((item:any)=>item.instanceId===lastInstance.instanceId);
    const hidden=lastEvents.find((item:any)=>item.frame>variant.firstVisibleFrame&&item.colorTransform?.multiply[3]===0);
    assert.equal(hidden.frame,variant.hiddenFrame);
    const state=reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(variant.variant-1),728,{type:'answer',value:kind==='wrong'?6:3,activityRevisionFloor:4}).nextState;
    const activity={id:definition.id,frameDomain:definition.frameDomain,frame:definition.endFrame,revision:5,status:'completed' as const};
    assert.equal(getG3L1Ts008FeedbackActivity(state,activity).complete,true);
    assert.equal(getG3L1Ts008FeedbackActivity(state,{...activity,revision:4}).complete,false);
    assert.equal(getG3L1Ts008FeedbackActivity(state,{...activity,id:'wrong-id'}).complete,false);
    assert.equal(getG3L1Ts008FeedbackActivity(state,{...activity,frame:definition.endFrame-1,status:'playing'}).complete,false);
    assert.equal(getG3L1Ts008FeedbackActivity(state,{...activity,frame:variant.firstVisibleFrame,status:'playing'}).visible,true);
    assert.equal(getG3L1Ts008FeedbackActivity(state,{...activity,frame:variant.firstVisibleFrame-1,status:'playing'}).visible,false);
    assert.equal(getG3L1Ts008FeedbackActivity(state,{...activity,frame:variant.hiddenFrame,status:'playing'}).visible,false);
  }
});

test('all seven activity audio dependencies are exact extracted assets with source-frame timing', async () => {
  const receipt=JSON.parse(await readFile(`${root}work/typography-v1/g3-l1-ts008/feedback-audio.json`,'utf8'));
  assert.equal(receipt.sourceSha256,COURSE_G03_L01_TS_008_SOURCE.swfSha256);
  for(const definition of G3_L1_TS008_ACTIVITY_TIMELINES){
    const evidence=receipt.assets.find((item:any)=>item.id===definition.id);
    assert.equal(definition.audio.source,evidence.publicUrl);
    assert.equal(definition.audio.sha256,evidence.sha256);
    assert.equal(hash(await readFile(`${root}${evidence.path}`)),evidence.sha256);
    assert.equal(definition.audio.firstFrame,evidence.firstBlockFrame);
    assert.equal(definition.audio.lastFrame,evidence.lastBlockFrame);
    assert.equal(definition.audio.language,'shared');
    assert.equal(definition.audio.spokenLanguage,'undetermined');
    assert.equal(evidence.audioEndedControlsCompletion,false);
    assert.equal(evidence.decodeToEofPassed,true);
  }
});

test('new source scope and state mismatches remain blocked; existing EN visual sharing stays explicit', () => {
  const request=context(728),state=getCourseG03L01Ts008FrameState(728,request);
  assert.equal(getG3L1Ts008TextSnapshot({...state,sourceSwfSha256:'bad'} as any,request).status,'blocked');
  assert.equal(getG3L1Ts008TextSnapshot(state,context(727)).status,'blocked');
  assert.equal(snapshot(728,undefined,{scenario:'answer-correct-unavailable'}).status,'blocked');
  const shared=snapshot(728,undefined,{lang:'es',scenario:'source-static-frame'});
  assert.equal(shared.status,'ready');assert.equal(shared.identity.language,'es');
  assert(shared.blocks.every(block=>block.language==='en'));
});

test('root raster views become source-bound native text without retaining raster or Canvas text', () => {
  for(const frame of [1,5,6,7,10]) {
    const request=context(frame,{frameDomain:'root',rootFrame:frame,scenario:'root-standalone'});
    const state=getCourseG03L01Ts008FrameState(frame,request);
    const markup=renderToStaticMarkup(createElement(G3L1Ts008ModernRenderer,{...request,state}));
    assert.doesNotMatch(markup,/<img|<canvas|<image/);
    assert.equal(markup.includes('data-lesson-text-block="root-title"'),frame>=6);
    assert.equal(markup.includes('data-lesson-text-block="question"'),frame>=7);
    assert.doesNotMatch(markup,/Negative Numbers|right angle/);
  }
  const request=context(747);
  const markup=renderToStaticMarkup(createElement(G3L1Ts008ModernRenderer,{...request,state:getCourseG03L01Ts008FrameState(747,request)}));
  assert.doesNotMatch(markup,/<img|<canvas|<image/);
  assert.match(markup,/Thousands/);assert.match(markup,/correct answer choice is A/);
});

test('reflected wrong-1 outlines retain source provenance without duplicating the readable feedback', async () => {
  const asset = await source;
  const block = G3_L1_TS008_TEXT_BINDING.blocks.find(item => item.id === 'feedback-wrong-1')!;
  const canonical = JSON.parse(await readFile(`${root}catalog/typography-v1/page-bindings/g03-l01-placement-071.json`, 'utf8'));
  const decision = canonical.sourceRoleDecisions.find((item: any) => item.kind === 'outlined-text' && item.nativeBlockId === block.id);
  assert.deepEqual(block.sourceShapeIds, [178,179,186]);
  assert.deepEqual(canonical.blocks.find((item: any) => item.id === block.id).sourceShapeIds, block.sourceShapeIds);
  assert.equal(decision.semanticValue, "That's incorrect!");
  const timeline = asset.timelines.find((item: any) => item.timelineId === 'sprite-195');
  const caption = timeline.instances.find((item: any) => item.characterId === 173);
  for (const id of block.sourceShapeIds!) {
    const shape = asset.shapeDefinitions.find((item: any) => item.characterId === id);
    assert.equal(decision.sourceShapeHashes.find((item: any) => item.characterId === id).sourceTagSha256, shape.sourceTagSha256);
    const instances = timeline.instances.filter((item: any) => item.characterId === id);
    assert.ok(instances.length > 0);
    assert.ok(instances.every((item: any) => item.depth < caption.depth && item.firstFrame >= caption.firstFrame && item.lastFrameExclusive <= caption.lastFrameExclusive));
  }
  const ctx = context(728), state = getCourseG03L01Ts008FrameState(728, ctx);
  const interaction = reduceG3L1Ts008Interaction(createG3L1Ts008Interaction(0),728,{type:'answer',value:6,activityRevisionFloor:0}).nextState;
  for (const frame of [3,4,26,27]) {
    const snapshot = getG3L1Ts008TextSnapshot(state,ctx,interaction,{id:'wrong-1',frameDomain:'sprite-195',frame,revision:1,status:'playing'});
    assert.equal(snapshot.status,'ready');
    const visible = snapshot.blocks.filter(item=>item.role==='feedback' && item.visible);
    assert.deepEqual(visible.map(item=>item.text),frame>=4 && frame<27 ? ["That's incorrect!"] : []);
  }
});


test('ordinary child teaching retains its concurrent source root title exactly once', async () => {
  const asset = await source;
  const rootTimeline = asset.timelines.find((item: any) => item.timelineId === 'root');
  const titleSprite = asset.timelines.find((item: any) => item.timelineId === 'sprite-352');
  for (const characterId of [348, 352]) {
    const instances = rootTimeline.instances.filter((item: any) => item.characterId === characterId);
    assert.equal(instances.length, 1);
    assert.equal(instances[0].firstFrame, 6);
    assert.equal(instances[0].lastFrameExclusive, 11);
  }
  assert.equal(titleSprite.instances.length, 1);
  assert.equal(titleSprite.instances[0].characterId, 351);
  assert.equal(titleSprite.instances[0].firstFrame, 1);
  const definition = asset.textDefinitions.find((item: any) => item.characterId === 351);
  const expectedText = definition.runs.map((run: any) => run.text).join('').trim();
  assert.equal(expectedText, 'Place Value: Practice Test');
  const titleBinding = G3_L1_TS008_TEXT_BINDING.blocks.find(block => block.id === 'root-title')!;
  assert.deepEqual(titleBinding.sourceTextIds, definition.runs.map((run: any) => run.sourceTextId));
  for (const lang of ['en', 'es'] as const) for (const replay of [0, 1]) {
    for (const frame of [1, 9, 295, 434, 550, 659, 728, 747]) {
      const request = context(frame, {lang, replay});
      const state = getCourseG03L01Ts008FrameState(frame, request);
      assert.equal(state.rootFrame, 6);
      const current = getG3L1Ts008TextSnapshot(state, request);
      assert.equal(current.status, 'ready');
      const titles = current.blocks.filter(block => block.id === 'root-title' && block.visible);
      assert.equal(titles.length, 1);
      assert.equal(titles[0].text, expectedText);
      assert.equal(titles[0].language, 'en');
      const markup = renderToStaticMarkup(createElement(G3L1Ts008ModernRenderer, {...request, state}));
      assert.equal((markup.match(/data-lesson-text-block="root-title"/g) ?? []).length, 1);
      assert.match(markup, /Place Value: Practice Test/);
      assert.doesNotMatch(markup, /<canvas|<img|<image/);
    }
  }
  for (const frame of [1, 5]) assert.equal(getG3L1Ts008TeachingState(frame, 'root').rootTitle, false);
  assert.equal(getG3L1Ts008TeachingState(6, 'unsupported').rootTitle, false);
  const badRequest = context(295, {rootFrame: 5});
  const badState = getCourseG03L01Ts008FrameState(295, badRequest);
  assert.equal(getG3L1Ts008TextSnapshot(badState, badRequest).status, 'blocked');
});


test('Help dialogs own their names and angle reference keeps exact DOM text, occurrence focus and parent frame', async () => {
  const {JSDOM} = await import('jsdom');
  const {act} = await import('react');
  const {createRoot} = await import('react-dom/client');
  const dom = new JSDOM('<!doctype html><html><body><div id="mount"></div></body></html>', {url:'http://localhost'});
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const name of ['window','document','HTMLElement','Node','navigator','IS_REACT_ACT_ENVIRONMENT']) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {configurable:true,writable:true,
      value:name === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[name]});
  }
  // jsdom has no native dialog.show implementation; this models only its open attribute.
  dom.window.HTMLDialogElement.prototype.show = function () {this.setAttribute('open','');};
  const mounted = createRoot(dom.window.document.getElementById('mount')!);
  const frames = [550,659,728];
  const blocks = ['step3-heading','step4-heading','help-example'];
  const sourceCharacters = [[17,106],[18,136],[160]];
  const requests: unknown[][] = frames.map(() => []);
  const glossaryRequests: {request: unknown; trigger?: HTMLElement}[] = [];
  try {
    const asset = await source;
    await act(async () => {mounted.render(createElement('div', null, ...frames.map((frame,index) =>
      createElement(G3L1Ts008ModernRenderer, {...context(frame), key:frame,
        onLessonFrameRequest: request => {requests[index].push(request); return true;},
        onLessonHostRequest: (request,details) => {glossaryRequests.push({request,trigger:details?.trigger});}}))));});
    const sections = [...dom.window.document.querySelectorAll<HTMLElement>('[data-modern-lesson="g3-l1-ts008"]')];
    assert.equal(sections.length,3);
    for (const section of sections) {
      const trigger = [...section.querySelectorAll('button')].find(button => button.textContent === 'Help')!;
      assert(trigger);
      await act(async () => {trigger.click();});
    }
    const dialogs = sections.map(section => section.querySelector('dialog')!);
    const ids = dialogs.map(dialog => dialog.getAttribute('aria-labelledby'));
    assert.equal(new Set(ids).size,3,'Each mounted instance must own a distinct dialog heading ID');
    for (const [index,dialog] of dialogs.entries()) {
      assert(dialog.open);
      assert.equal(dialog.hasAttribute('aria-label'),false);
      assert(ids[index]);
      const heading = dom.window.document.getElementById(ids[index]!)!;
      assert(heading && dialog.contains(heading),'Dialog name must resolve inside that same dialog');
      assert.equal(heading.tagName,'H3');
      assert.equal(heading.getAttribute('data-lesson-text-block'),blocks[index]);
      assert.equal(heading.hidden,false);
      const expected = sourceCharacters[index].map(character => asset.textDefinitions.find((item:any) =>
        item.characterId === character).runs.map((run:any) => run.text).join('').trim()).join(' ').replace(/\s+/g,' ');
      assert.equal(heading.textContent,expected);
      assert.equal([...dom.window.document.querySelectorAll('[id]')].filter(node => node.id === ids[index]).length,1);
    }
    const quiz = sections[2], quizDialog = dialogs[2];
    const reference = [...quizDialog.querySelectorAll('button')].find(button=>button.textContent==='Angle reference')!;
    await act(async()=>{reference.click();});
    assert.equal(quiz.querySelector('dialog'),quizDialog,'Subview must keep the same Help session');
    assert.equal(quiz.dataset.helpView,'angles');
    const angleHeading = dom.window.document.getElementById(quizDialog.getAttribute('aria-labelledby')!)!;
    assert.equal(angleHeading.textContent,'Angle reference');assert.equal(dom.window.document.activeElement,angleHeading);
    assert.equal(quizDialog.querySelector('[data-lesson-text-block="help-example"]'),null);
    assert.equal(quizDialog.querySelector('[data-lesson-text-block="angle-close"]')?.textContent,'Close');
    const termNodes = [...quizDialog.querySelectorAll<HTMLButtonElement>('button[data-source-term-instance]')];
    assert.equal(termNodes.length,19);assert.equal(new Set(termNodes.map(node=>node.dataset.sourceTermInstance)).size,19);
    const mapping = JSON.parse(await readFile(`${root}work/typography-v1/pipeline-v592/source-review/angle-reference-spans-candidate.json`,'utf8'));
    for (const [index,paragraph] of G3_L1_TS008_ANGLE_PARAGRAPHS.entries()) {
      assert.equal(quizDialog.querySelector(`[data-lesson-text-block="${paragraph.id}"]`)?.textContent,mapping.paragraphs[index].text);
    }
    for (const [index,node] of termNodes.entries()) {
      node.focus();
      await act(async()=>{node.click();});
      assert.equal(glossaryRequests[index].trigger,node);
      assert.deepEqual(glossaryRequests[index].request,{type:'open-keyterm',entryId:node.dataset.keytermEntryId,
        sourceAnimationId:'course-g03-l01-ts-008',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});
      assert.equal(quiz.dataset.helpView,'angles');assert.equal(quiz.dataset.flashFrame,'728');
    }
    const back = [...quizDialog.querySelectorAll('button')].find(button=>button.textContent==='Back to place value')!;
    await act(async()=>{back.click();});
    assert.equal(quiz.dataset.helpView,'primary');
    const returnedReference = [...quizDialog.querySelectorAll('button')].find(button=>button.textContent==='Angle reference')!;
    assert.equal(dom.window.document.activeElement,returnedReference);
    assert.equal(quizDialog.querySelector('[data-lesson-text-block="help-example"]')?.textContent,'Example: 17,589');
    assert.equal(quizDialog.querySelector('[data-lesson-text-block="angle-close"]'),null);
    await act(async()=>{returnedReference.click();});
    assert.equal(quiz.dataset.helpView,'angles');assert.deepEqual(requests[2],[]);
    for (const [index,dialog] of dialogs.entries()) {
      const close = [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Close')!;
      await act(async () => {close.click();});
      assert.equal(sections[index].querySelector('dialog'),null);
      assert.equal(sections[index].dataset.helpView,'primary');
      assert.deepEqual(requests[index],index < 2 ? [G3_L1_TS008_FRAME_TRANSITIONS.find(edge => edge.fromFrame === frames[index])] : []);
      for (let later=index+1;later<dialogs.length;later++) {
        assert.equal(sections[later].querySelector('dialog'),dialogs[later]);
        assert(dialogs[later].open,'Closing one instance must not close another');
        assert.deepEqual(requests[later],[]);
      }
    }
  } finally {
    await act(async () => {mounted.unmount();});
    dom.window.close();
    for (const [name,descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis,name,descriptor);
      else Reflect.deleteProperty(globalThis,name);
    }
  }
});
