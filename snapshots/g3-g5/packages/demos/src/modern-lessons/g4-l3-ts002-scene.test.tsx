import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {renderToStaticMarkup} from 'react-dom/server';
import source from './generated/g4-l3-ts002-text.json';
import {G4L3Ts002Scene, getTs002SceneState} from './g4-l3-ts002-scene';
import {getCourseG04L03Ts002FrameState} from '../modules/course-g04-l03-ts-002';
import {getTs002TextSnapshot, TS002_BINDING, TS002_PRESENTATION, Ts002NativeRenderer} from './g4-l3-ts002-capability';
import type {RuntimeContext} from '../contract';
import {loadAnimationModuleForPresentation} from '../animation-registry';

const context = (frame: number): RuntimeContext => ({frame, frameDomain: 'sprite-27', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0});
const sourceState = (frame: number) => getCourseG04L03Ts002FrameState(frame, context(frame));

test('TS002 native copy retains source title and only source-authored four-cell content', () => {
  const state = getTs002SceneState(355);
  assert.equal(state.title, source.texts['2'].text);
  assert.deepEqual(state.numbers, ['1.', '2.', '3.', '4.']);
  assert.equal(state.stepCell, source.texts['11'].text);
  assert.equal(state.heading, source.texts['14'].text);
  assert.equal(state.firstBullet, source.texts['21'].text);
  assert.equal(state.secondBullet, source.texts['25'].text);
  const html = renderToStaticMarkup(<G4L3Ts002Scene frame={355}/>);
  assert.equal((html.match(/class="ts002-native__cell"/g) ?? []).length, 4);
  assert(!html.includes('Step 2:'), 'no invented plan-step prose');
  assert(html.includes('question<br class="ts002-native__source-break"/> is asking.'));
  assert.match(html, /class="ts002-native__term-punctuation"><button[^>]*>question<\/button>\.<\/span>/);
  const renderedCopy = (blockId: string) => {
    const block = html.match(new RegExp(`<(?:h3|li) data-lesson-text-block="${blockId}"[^>]*>(.*?)<\\/(?:h3|li)>`))?.[1];
    assert(block, `${blockId} must be rendered`);
    return block.replace(/<br[^>]*\/>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  };
  assert.equal(renderedCopy('step-heading'), source.texts['14'].text);
  assert.equal(renderedCopy('first-bullet'), source.texts['21'].text);
});

test('all 355 source frames drive native text visibility and exact blink windows', () => {
  for (let frame = 1; frame <= source.frameCount; frame++) {
    const state = getTs002SceneState(frame);
    const placed = (id: number) => source.frames[frame - 1].placements.find(item => item.characterId === id);
    for (const [id, value] of [[11, state.stepCell], [14, state.heading], [21, state.firstBullet], [25, state.secondBullet]] as const) {
      assert.equal(Boolean(value), Boolean(placed(id) && placed(id)!.alpha > 0), `source text ${id} at frame ${frame}`);
    }
    assert.equal(state.emphasis.restate, Boolean(placed(18) && placed(18)!.alpha > 0), `Restate at ${frame}`);
    assert.equal(state.emphasis.question, Boolean(placed(19) && placed(19)!.alpha > 0), `question at ${frame}`);
    assert.equal(state.emphasis.problem, Boolean(placed(24) && placed(24)!.alpha > 0), `problem at ${frame}`);
  }
  assert.equal(getTs002SceneState(1).stepCell, null);
  assert.equal(getTs002SceneState(146).firstBullet, null); // source fade starts at alpha 0
  assert.equal(getTs002SceneState(217).secondBullet, null);
});

test('reduced motion removes emphasis flashes without losing authored copy', () => {
  for (const frame of [85, 124, 133, 146, 165, 217, 355]) {
    const state = getTs002SceneState(frame, true);
    assert.deepEqual(state.emphasis, {restate: false, question: false, problem: false});
    assert.equal(state.stepCellOpacity, 1);
  }
});

test('source glossary buttons are exact, optional and keyboard-native', () => {
  assert.deepEqual(source.glossary.map(item => [item.buttonId, item.term, item.entryId]), [
    [16, 'Restate', 'en-0576-07b54a02117d'],
    [17, 'question', 'en-0536-4421c49635ec'],
    [23, 'problem', 'en-0513-fdeed4fcabb5'],
  ]);
  const html = renderToStaticMarkup(<G4L3Ts002Scene frame={355} onOpenKeyTerm={() => {}}/>);
  for (const buttonId of [16, 17, 23]) assert(html.includes(`data-source-button="${buttonId}"`));
  assert.equal((html.match(/data-source-button=/g) ?? []).length, 3);
  assert(!html.includes('disabled=""'));
  const noHost = renderToStaticMarkup(<G4L3Ts002Scene frame={355}/>);
  assert.equal((noHost.match(/disabled=""/g) ?? []).length, 3);
});

test('invalid frames fail closed', () => {
  for (const frame of [0, 356, -1, 1.5, NaN]) assert.throws(() => getTs002SceneState(frame));
});

test('native binding is exact, snapshot ready only for supported English main-domain product state', () => {
  assert.equal(TS002_BINDING.placementId, 'g04-l03-placement-030');
  assert.equal(TS002_BINDING.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(TS002_PRESENTATION.sourceTimelineAudioCues?.[0].sha256,
    '3f47325f09641062c5437e8f0f87f57785f06269102cdb186efc03ed123bcde1');
  assert.deepEqual(TS002_PRESENTATION.keyTerms?.entryIds, source.glossary.map(item => item.entryId));
  const ready = getTs002TextSnapshot(sourceState(355), context(355));
  assert.equal(ready.status, 'ready');
  assert.equal(ready.blocks.filter(block => block.visible).length, 9);
  assert.deepEqual(ready.blocks.map(block => block.text), [source.texts['2'].text, '1.', source.texts['11'].text,
    '2.', '3.', '4.', source.texts['14'].text, source.texts['21'].text, source.texts['25'].text]);
  assert.equal(getTs002TextSnapshot(sourceState(85), context(85)).blocks.find(block => block.id === 'step-cell')?.visible, false);
  for (const override of [{lang: 'es' as const}, {frameDomain: 'root'}, {entryStateSha256: 'capture'}]) {
    assert.equal(getTs002TextSnapshot(sourceState(355), {...context(355), ...override}).status, 'blocked');
  }
  const html = renderToStaticMarkup(<Ts002NativeRenderer {...context(355)} state={sourceState(355)}/>);
  assert(html.includes('data-modern-text-page="course-g04-l03-ts-002"'));
  assert(!html.includes('<canvas'));
});

test('actual modern product loader opts TS002 into native text without changing default module', async () => {
  const original = await loadAnimationModuleForPresentation('course-g04-l03-ts-002');
  assert.equal(original?.textPresentation, undefined);
  const modern = await loadAnimationModuleForPresentation('course-g04-l03-ts-002', {modernText: true});
  assert.equal(modern?.textPresentation?.binding.version, TS002_BINDING.version);
  assert.equal(modern?.textPresentation?.Renderer, Ts002NativeRenderer);
  assert.equal(modern?.runtime?.frameDomains?.find(domain => domain.id === 'sprite-27')?.frameCount, 355);
});

test('six source shapes retain their teaching roles without copying old shell artwork', () => {
  const disposition = JSON.parse(readFileSync(new URL(
    '../../../../scripts/inputs/typography-v1/g4-l3-ts002/shape-role-disposition.json', import.meta.url), 'utf8')) as {
    sourceSwfSha256: string;
    sourceCatalogContentSha256: string;
    swfmillXmlGzipSha256: string;
    shapes: {characterId: number; sourceTagSha256: string; sourceFrames: [number, number] | null}[];
  };
  const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  const catalogBytes = gunzipSync(readFileSync(new URL(
    '../../../../catalog/typography-v1/source-catalog/assets/777224c6e7c1da786ce6f4af46532cb1617aaa0020c214e15cc6e2539c71e831.json.gz', import.meta.url)));
  const catalog = JSON.parse(catalogBytes.toString()) as {
    shapeDefinitions: {characterId: number; sourceTagSha256: string}[];
    buttonDefinitions: {characterId: number; statePlacements: {characterId: number; states: {hitTest: boolean; up: boolean; over: boolean; down: boolean}}[]}[];
  };
  assert.equal(disposition.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(sha256(catalogBytes), disposition.sourceCatalogContentSha256);
  assert.equal(sha256(readFileSync(new URL(
    '../../../../migrations/course-g04-l03-ts-002/audit/machine/swfmill.xml.gz', import.meta.url))),
  disposition.swfmillXmlGzipSha256);
  assert.deepEqual(disposition.shapes.map(({characterId, sourceTagSha256}) => ({characterId, sourceTagSha256})),
    catalog.shapeDefinitions.map(({characterId, sourceTagSha256}) => ({characterId, sourceTagSha256})));
  for (const shape of disposition.shapes) {
    const frames = source.frames.filter(frame => frame.placements.some(item => item.characterId === shape.characterId));
    assert.deepEqual(frames.length ? [frames[0].frame, frames.at(-1)?.frame] : null, shape.sourceFrames);
  }
  assert.deepEqual(catalog.buttonDefinitions.map(button => button.characterId), [16, 17, 23]);
  assert(catalog.buttonDefinitions.every(button => button.statePlacements.length === 1 &&
    button.statePlacements[0].characterId === 15 && button.statePlacements[0].states.hitTest &&
    !button.statePlacements[0].states.up && !button.statePlacements[0].states.over &&
    !button.statePlacements[0].states.down));
  for (const [textId, markerId] of [[21, 22], [25, 26]]) {
    for (const frame of source.frames) {
      assert.equal(frame.placements.find(item => item.characterId === textId)?.alpha ?? null,
        frame.placements.find(item => item.characterId === markerId)?.alpha ?? null);
    }
  }
  const html = renderToStaticMarkup(<G4L3Ts002Scene frame={355} onOpenKeyTerm={() => {}}/>);
  for (const shapeId of [4, 13, 20, 22, 26]) assert(html.includes(`data-source-shape="${shapeId}"`));
  assert(TS002_BINDING.blocks.every(block => !block.sourceShapeIds?.length),
    'layout artwork and bullet markers are not outlined mathematical text');
  assert(html.includes('.ts002-native__explanation li::before'), 'only the explanation bullets need visible markers');
  assert(!html.includes('.ts002-native li::before'), 'plan cells are not source bullet items');
  assert(!html.includes('<img'), 'no source drawing is flattened into an image');
});
