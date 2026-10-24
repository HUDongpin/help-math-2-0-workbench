import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {renderToStaticMarkup} from 'react-dom/server';
import source from './generated/g4-l3-ts003-text.json';
import {G4L3Ts003Scene, getTs003SceneState} from './g4-l3-ts003-scene';
import {getCourseG04L03Ts003FrameState} from '../modules/course-g04-l03-ts-003';
import {getTs003TextSnapshot, TS003_BINDING, TS003_PRESENTATION, Ts003NativeRenderer} from './g4-l3-ts003-capability';
import type {RuntimeContext} from '../contract';
import {loadAnimationModuleForPresentation} from '../animation-registry';

const context = (frame: number): RuntimeContext => ({frame, frameDomain: 'sprite-25', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0});
const sourceState = (frame: number) => getCourseG04L03Ts003FrameState(frame, context(frame));

test('TS003 projection stays bound to the shipped SWF, parsed catalog and source actions', () => {
  const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  const swf = readFileSync(new URL('../../../../source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS03.swf', import.meta.url));
  const raw = gunzipSync(readFileSync(new URL(
    '../../../../catalog/typography-v1/source-catalog/assets/1ff4291c2d5009ad33b877bd03d5c31bf1842e0b8b0ff7acb74ae559b833ce44.json.gz',
    import.meta.url)));
  const scripts = gunzipSync(readFileSync(new URL(
    '../../../../migrations/course-g04-l03-ts-003/audit/machine/ffdec-scripts.txt.gz', import.meta.url)));
  assert.equal(hash(swf), source.sourceSwfSha256);
  assert.equal(hash(raw), source.sourceCatalogContentSha256);
  assert.equal(hash(scripts), source.sourceScriptsSha256);
  assert.equal(source.frameDomain, 'sprite-25');
  assert.equal(source.frameCount, 241);
  assert.deepEqual(source.glossary.map(entry => [entry.buttonId, entry.term, entry.entryId]), [
    [17, 'Organize', 'en-0442-5722e95ef2b8'],
    [18, 'Information', 'en-0301-ce7f6e5c58b3'],
  ]);
});

test('all five source shapes have exact non-glyph teaching roles', () => {
  const disposition = JSON.parse(readFileSync(new URL(
    '../../../../scripts/inputs/typography-v1/g4-l3-ts003/shape-role-disposition.json', import.meta.url), 'utf8')) as {
    sourceSwfSha256: string; sourceCatalogContentSha256: string; swfmillXmlGzipSha256: string;
    shapes: {characterId: number; sourceTagSha256: string; sourceFrames: [number, number] | null}[];
  };
  const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  const raw = gunzipSync(readFileSync(new URL(
    '../../../../catalog/typography-v1/source-catalog/assets/1ff4291c2d5009ad33b877bd03d5c31bf1842e0b8b0ff7acb74ae559b833ce44.json.gz',
    import.meta.url)));
  const catalog = JSON.parse(raw.toString()) as {
    shapeDefinitions: {characterId: number; sourceTagSha256: string}[];
    buttonDefinitions: {characterId: number; statePlacements: {characterId: number;
      states: {hitTest: boolean; up: boolean; over: boolean; down: boolean}}[]}[];
  };
  assert.equal(disposition.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(hash(raw), disposition.sourceCatalogContentSha256);
  assert.equal(hash(readFileSync(new URL(
    '../../../../migrations/course-g04-l03-ts-003/audit/machine/swfmill.xml.gz', import.meta.url))),
  disposition.swfmillXmlGzipSha256);
  assert.deepEqual(disposition.shapes.map(({characterId, sourceTagSha256}) => ({characterId, sourceTagSha256})),
    catalog.shapeDefinitions.map(({characterId, sourceTagSha256}) => ({characterId, sourceTagSha256})));
  for (const shape of disposition.shapes) {
    const frames = source.frames.filter(frame => frame.placements.some(item => item.characterId === shape.characterId));
    assert.deepEqual(frames.length ? [frames[0].frame, frames.at(-1)?.frame] : null, shape.sourceFrames);
  }
  assert.deepEqual(catalog.buttonDefinitions.map(button => button.characterId), [17, 18]);
  assert(catalog.buttonDefinitions.every(button => button.statePlacements.length === 1 &&
    button.statePlacements[0].characterId === 16 && button.statePlacements[0].states.hitTest &&
    !button.statePlacements[0].states.up && !button.statePlacements[0].states.over &&
    !button.statePlacements[0].states.down));
  assert(TS003_BINDING.blocks.every(block => !block.sourceShapeIds?.length),
    'board, link decoration, hit regions and list markers are not outlined mathematical glyphs');
  const html = renderToStaticMarkup(<G4L3Ts003Scene frame={241} onOpenKeyTerm={() => {}}/>);
  for (const shapeId of [4, 14, 22, 24]) assert(html.includes(`data-source-shape="${shapeId}"`));
  assert(html.includes('.ts003-native__explanation li::before'));
  assert(!html.includes('<img'));
});

test('native scene presents only source-authored text in a modern four-step relationship', () => {
  const state = getTs003SceneState(241);
  assert.equal(state.title, source.texts['2'].text);
  assert.deepEqual(state.numbers, ['1.', '2.', '3.', '4.']);
  assert.equal(state.stepOne, source.texts['11'].text);
  assert.equal(state.stepTwo, source.texts['13'].text);
  assert.equal(state.heading, source.texts['15'].text);
  assert.equal(state.firstBullet, source.texts['21'].text);
  assert.equal(state.secondBullet, source.texts['23'].text);
  const html = renderToStaticMarkup(<G4L3Ts003Scene frame={241} onOpenKeyTerm={() => {}}/>);
  assert.equal((html.match(/class="ts003-native__cell"/g) ?? []).length, 4);
  assert(!html.includes('Step 3:'), 'no invented step 3 copy');
  assert(!html.includes('Step 4:'), 'no invented step 4 copy');
  for (const [id, copy] of [['step-one', state.stepOne], ['step-two', state.stepTwo],
    ['first-bullet', state.firstBullet], ['second-bullet', state.secondBullet]] as const) {
    const block = html.match(new RegExp(`<[^>]+data-lesson-text-block="${id}"[^>]*>(.*?)<\\/[^>]+>`))?.[1];
    assert.equal(block?.replace(/<[^>]+>/g, ''), copy, `${id} must match source`);
  }
  const heading = html.match(/<h3 data-lesson-text-block="step-heading"[^>]*>(.*?)<\/h3>/)?.[1];
  assert(heading);
  assert.equal(heading.replace(/<[^>]+>/g, ''), state.heading);
  assert.match(html, /data-source-button="18"[^>]*>information<\/button>\.<\/span>/);
  assert(!html.includes('<canvas'));
  assert(!html.includes('<img'));
});

test('all 241 source frames determine teaching-copy visibility and paired bullet markers', () => {
  for (let frame = 1; frame <= source.frameCount; frame++) {
    const state = getTs003SceneState(frame);
    const placed = (id: number) => source.frames[frame - 1].placements.find(item => item.characterId === id);
    for (const [id, value] of [[11, state.stepOne], [13, state.stepTwo], [15, state.heading],
      [21, state.firstBullet], [23, state.secondBullet]] as const) {
      assert.equal(Boolean(value), Boolean(placed(id) && placed(id)!.alpha > 0),
        `source text ${id} at frame ${frame}`);
    }
    assert.equal(state.glossaryEnabled.Organize, Boolean(placed(17) && placed(17)!.alpha > 0));
    assert.equal(state.glossaryEnabled.Information, Boolean(placed(18) && placed(18)!.alpha > 0));
    assert.equal(state.emphasis.Organize, Boolean(placed(19) && placed(19)!.alpha > 0));
    assert.equal(state.emphasis.Information, Boolean(placed(20) && placed(20)!.alpha > 0));
    for (const [textId, shapeId] of [[21, 22], [23, 24]]) {
      assert.equal(placed(textId)?.alpha ?? null, placed(shapeId)?.alpha ?? null,
        `bullet marker ${shapeId} at frame ${frame}`);
    }
  }
  assert.equal(getTs003SceneState(16).stepTwo, null);
  assert.equal(getTs003SceneState(109).firstBullet, null);
  assert.equal(getTs003SceneState(161).secondBullet, null);
});

test('glossary buttons activate only after their source placement and remain optional', () => {
  const early = renderToStaticMarkup(<G4L3Ts003Scene frame={17} onOpenKeyTerm={() => {}}/>);
  assert.equal((early.match(/disabled=""/g) ?? []).length, 2);
  const active = renderToStaticMarkup(<G4L3Ts003Scene frame={24} onOpenKeyTerm={() => {}}/>);
  assert.equal((active.match(/disabled=""/g) ?? []).length, 0);
  assert.equal((active.match(/data-source-button=/g) ?? []).length, 2);
  const noHost = renderToStaticMarkup(<G4L3Ts003Scene frame={241}/>);
  assert.equal((noHost.match(/disabled=""/g) ?? []).length, 2);
});

test('reduced motion suppresses source emphasis flashes but not authored teaching copy', () => {
  for (const frame of [24, 39, 41, 43, 50, 52, 54, 109, 161, 241]) {
    const state = getTs003SceneState(frame, true);
    assert.deepEqual(state.emphasis, {Organize: false, Information: false});
    assert.equal(state.stepTwoOpacity, 1);
    assert.equal(state.headingOpacity, 1);
  }
});

test('native candidate binding and snapshot use the exact source and fail closed elsewhere', () => {
  assert.equal(TS003_BINDING.placementId, 'g04-l03-placement-031');
  assert.equal(TS003_BINDING.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(TS003_BINDING.blocks.length, 10);
  assert.equal(TS003_PRESENTATION.sourceTimelineAudioCues?.[0].sha256,
    'f8419e0465dbb60235084af4229a2c6dfca15b0674e5dba5e1b42e6cc28f1aa5');
  assert.deepEqual(TS003_PRESENTATION.keyTerms?.entryIds, source.glossary.map(item => item.entryId));
  const ready = getTs003TextSnapshot(sourceState(241), context(241));
  assert.equal(ready.status, 'ready');
  assert.equal(ready.blocks.filter(block => block.visible).length, 10);
  assert.deepEqual(ready.blocks.map(block => block.text), [source.texts['2'].text, '1.',
    source.texts['11'].text, '2.', source.texts['13'].text, '3.', '4.', source.texts['15'].text,
    source.texts['21'].text, source.texts['23'].text]);
  assert.equal(getTs003TextSnapshot(sourceState(16), context(16)).blocks.find(block => block.id === 'step-two')?.visible, false);
  for (const override of [{lang: 'es' as const}, {frameDomain: 'root'}, {entryStateSha256: 'capture'}]) {
    assert.equal(getTs003TextSnapshot(sourceState(241), {...context(241), ...override}).status, 'blocked');
  }
  const html = renderToStaticMarkup(<Ts003NativeRenderer {...context(241)} state={sourceState(241)}/>);
  assert(html.includes('data-modern-text-page="course-g04-l03-ts-003"'));
  assert(!html.includes('<canvas'));
});

test('modern product loader opts TS003 into native text without changing the default Canvas module', async () => {
  const original = await loadAnimationModuleForPresentation('course-g04-l03-ts-003');
  assert.equal(original?.textPresentation, undefined);
  const modern = await loadAnimationModuleForPresentation('course-g04-l03-ts-003', {modernText: true});
  assert.equal(modern?.textPresentation?.binding.version, TS003_BINDING.version);
  assert.equal(modern?.textPresentation?.Renderer, Ts003NativeRenderer);
  assert.equal(modern?.runtime?.frameDomains?.find(domain => domain.id === 'sprite-25')?.frameCount, 241);
});

test('out-of-domain frames fail closed', () => {
  for (const frame of [0, 242, -1, 1.5, NaN]) assert.throws(() => getTs003SceneState(frame));
});
