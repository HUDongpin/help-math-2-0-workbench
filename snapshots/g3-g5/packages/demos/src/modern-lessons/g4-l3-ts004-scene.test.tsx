import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {renderToStaticMarkup} from 'react-dom/server';
import source from './generated/g4-l3-ts004-text.json';
import glossaryTargets from '../../../../scripts/inputs/typography-v1/g4-l3-ts004/glossary-target-disposition.json';
import {G4L3Ts004Scene, getTs004SceneState} from './g4-l3-ts004-scene';

test('eight source shapes are dispositioned without treating hit regions or underlines as text', () => {
  const disposition = JSON.parse(readFileSync(new URL(
    '../../../../scripts/inputs/typography-v1/g4-l3-ts004/shape-role-disposition.json', import.meta.url), 'utf8')) as {
    sourceSwfSha256: string; sourceCatalogContentSha256: string; swfmillXmlGzipSha256: string;
    shapes: {characterId: number; sourceTagSha256: string; sourceFrames: [number, number] | null;
      nativeMarker: string | null}[];
  };
  const rawCatalog = gunzipSync(readFileSync(new URL(
    `../../../../catalog/typography-v1/source-catalog/assets/${source.sourceSwfSha256}.json.gz`, import.meta.url)));
  const catalog = JSON.parse(rawCatalog.toString()) as {
    shapeDefinitions: {characterId: number; sourceTagSha256: string}[];
    buttonDefinitions: {statePlacements: {characterId: number; states: {
      hitTest: boolean; up: boolean; over: boolean; down: boolean}}[]}[];
  };
  const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  assert.equal(disposition.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(hash(rawCatalog), disposition.sourceCatalogContentSha256);
  assert.equal(hash(readFileSync(new URL(
    '../../../../migrations/course-g04-l03-ts-004/audit/machine/swfmill.xml.gz', import.meta.url))),
  disposition.swfmillXmlGzipSha256);
  assert.deepEqual(disposition.shapes.map(({characterId, sourceTagSha256}) => ({characterId, sourceTagSha256})),
    catalog.shapeDefinitions.map(({characterId, sourceTagSha256}) => ({characterId, sourceTagSha256})));
  for (const shape of disposition.shapes) {
    const frames = source.frames.filter(frame => frame.placements.some(item => item.characterId === shape.characterId));
    assert.deepEqual(frames.length ? [frames[0].frame, frames.at(-1)?.frame] : null, shape.sourceFrames);
  }
  assert(catalog.buttonDefinitions.every(button => button.statePlacements.length === 1 &&
    button.statePlacements[0].characterId === 18 && button.statePlacements[0].states.hitTest &&
    !button.statePlacements[0].states.up && !button.statePlacements[0].states.over &&
    !button.statePlacements[0].states.down));
  const html = renderToStaticMarkup(<G4L3Ts004Scene frame={336}/>);
  for (const id of [4, 14, 25, 29, 61, 69]) assert(html.includes(`data-source-shape="${id}"`));
  for (const id of [18, 23]) assert(!html.includes(`data-source-shape="${id}"`));
});

test('source geometry reconstructs eight separate strategies in two teaching columns', () => {
  const state = getTs004SceneState(336);
  assert.deepEqual(state.left.map(item => item.text), [
    'write an equation and solve it', 'draw a picture',
    'look for a pattern', 'systematically guess and check',
  ]);
  assert.deepEqual(state.right.map(item => item.text), [
    'act it out', 'make a table', 'work a simpler problem', 'work backwards',
  ]);
  assert.equal(state.left.reduce((count, item) => count + item.depths.length, 0), 79);
  assert.equal(state.activeStep, `${source.texts['16'].text} ${source.texts['15'].text}`);
  assert.deepEqual(state.planNumbers, ['1.', '2.', '3.', '4.']);
  assert.deepEqual(state.plan, [source.texts['11'].text, source.texts['13'].text,
    source.texts['17'].text, null]);
  const html = renderToStaticMarkup(<G4L3Ts004Scene frame={336}/>);
  assert.match(html, /data-lesson-text-block="active-step" data-source-characters="16,15"/);
  assert.match(html, /data-lesson-text-block="step-3"[^>]*>Solve the problem\.<\/span>/);
  assert.match(html, /data-source-shape="4"/);
  assert.equal((html.match(/data-lesson-text-block="step-[1-4]-number"/g) ?? []).length, 4);
  assert(!html.includes('counter(step)'));
  assert.equal((html.match(/class="ts004-native__columns"/g) ?? []).length, 1);
  assert.equal((html.match(/data-lesson-text-block="(?:write-equation|draw-picture|look-pattern|guess-check|right-[0-9]+)"/g) ?? []).length, 8);
  assert.match(html, /data-lesson-text-block="final-instruction"/);
  assert(!html.includes('<canvas'));
  assert(!html.includes('<img'));
  assert(!html.includes('Map</button>'));
});

test('native controls retain source words, exact keys and all ten source button windows', () => {
  assert.equal(glossaryTargets.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(glossaryTargets.sourceCatalogContentSha256, source.sourceCatalogContentSha256);
  assert.deepEqual(glossaryTargets.buttons.map(item => item.buttonId),
    source.glossary.map(item => item.buttonId));
  for (const target of glossaryTargets.buttons) {
    assert.equal(source.glossary.find(item => item.buttonId === target.buttonId)?.sourceKey,
      target.sourceKey);
    const frames = source.frames.filter(frame => frame.placements.some(item =>
      item.characterId === target.buttonId && item.alpha > 0)).map(frame => frame.frame);
    const expected = target.sourceWindows.flatMap(([start, end]) =>
      Array.from({length: end - start + 1}, (_, index) => start + index));
    assert.deepEqual(frames, expected, `source button ${target.buttonId} windows`);
  }
  assert.equal(glossaryTargets.buttons.find(item => item.buttonId === 27)?.nativeTarget, 'active-step/solve');
  assert.equal(glossaryTargets.buttons.find(item => item.buttonId === 28)?.nativeTarget, 'active-step/problem');
  assert.deepEqual(getTs004SceneState(21).buttons.map(item => item.buttonId), []);
  assert.deepEqual(getTs004SceneState(22).buttons.map(item => item.buttonId), [19, 20]);
  assert.deepEqual(getTs004SceneState(84).buttons.map(item => item.buttonId), [19, 20]);
  assert.deepEqual(getTs004SceneState(85).buttons.map(item => item.buttonId), [26, 27, 28]);
  assert.deepEqual(getTs004SceneState(110).buttons.map(item => item.buttonId), [26, 27, 28]);
  for (const frame of [85, 110]) {
    const rawRequests = getTs004SceneState(frame).buttons.filter(item => item.lookup === 'source-key');
    assert.deepEqual(rawRequests.map(item => [item.buttonId, item.sourceKey]), [[27, 'Data tables'], [28, 'strategies']]);
    assert(rawRequests.every(item => !('entryId' in item)), 'actual index lookup must not use a fabricated or preselected ID');
  }
  assert.deepEqual(getTs004SceneState(111).buttons.map(item => item.buttonId),
    [19, 20, 63, 64, 65, 66, 67]);
  const render = (frame: number) => renderToStaticMarkup(<G4L3Ts004Scene frame={frame}
    onOpenKeyTerm={() => {}}/>);
  assert.deepEqual([...render(85).matchAll(/data-source-button="(\d+)"/g)].map(match => Number(match[1])), [27, 28, 26]);
  assert.match(render(85), /data-source-button="27"[^>]*data-source-key="Data tables"[^>]*>Solve<\/button>/);
  assert.match(render(85), /data-source-button="28"[^>]*data-source-key="strategies"[^>]*>problem<\/button>/);
  assert.deepEqual([...render(111).matchAll(/data-source-button="(\d+)"/g)].map(match => Number(match[1])),
    [19, 20, 63, 64, 65, 66, 67]);
  assert(!render(111).includes('data-source-button="27"'));
  assert(!render(111).includes('data-source-button="28"'));
});

test('source Solve/problem overlay words emphasize existing terms without duplicate DOM copy', () => {
  for (const frame of [39, 40, 44, 45, 49, 50, 54, 55]) {
    const state = getTs004SceneState(frame);
    assert.equal(state.emphasis.Solve, frame >= 40 && frame <= 44);
    assert.equal(state.emphasis.problem, frame >= 50 && frame <= 54);
  }
  assert.deepEqual(getTs004SceneState(40, true).emphasis, {Solve: false, problem: false});
  const html = renderToStaticMarkup(<G4L3Ts004Scene frame={40} onOpenKeyTerm={() => {}}/>);
  assert.match(html, /data-source-button="19" data-emphasis="true"/);
  assert.equal((html.match(/>Solve<\/button>/g) ?? []).length, 1);
});

test('all 336 source frames drive native text reveal without early strategies or final instruction', () => {
  for (let frame = 1; frame <= source.frameCount; frame++) {
    const state = getTs004SceneState(frame);
    const placements = source.frames[frame - 1].placements;
    const alpha = (id: number) => Math.max(0, ...placements.filter(item => item.characterId === id)
      .map(item => item.alpha));
    assert.equal(state.strategiesHeading !== null, alpha(24) > 0, `heading frame ${frame}`);
    assert.equal(state.finalInstruction !== null, alpha(68) > 0, `final frame ${frame}`);
    assert.equal(state.activeStep !== null, alpha(15) > 0 && alpha(16) > 0,
      `active step frame ${frame}`);
    assert.equal(state.plan[2] !== null, alpha(17) > 0, `step three board frame ${frame}`);
    assert.equal(state.planStepThreeOpacity, alpha(17), `step three alpha frame ${frame}`);
    assert.equal(state.right[0].opacity, alpha(62), `right strategies frame ${frame}`);
    for (const item of state.left) {
      const letters = item.depths.map(depth => placements.find(placement => placement.depth === depth)?.alpha ?? 0);
      assert.equal(item.opacity, Math.min(...letters), `${item.id} frame ${frame}`);
    }
  }
  assert.equal(getTs004SceneState(105).left[0].opacity, 0);
  assert.equal(getTs004SceneState(106).left[0].opacity, 43 / 256);
  assert.equal(getTs004SceneState(274).finalInstruction, null);
  assert.equal(getTs004SceneState(275).finalInstruction, source.texts['68'].text);
});

test('narrow layout uses native reflow and reduced motion keeps authored copy', () => {
  const html = renderToStaticMarkup(<G4L3Ts004Scene frame={106} reducedMotion/>);
  assert.match(html, /@container \(max-width:34rem\)/);
  assert.match(html, /@container \(max-width:22rem\)/);
  assert.equal(getTs004SceneState(106, true).left[0].opacity, 1);
  assert.equal(getTs004SceneState(105, true).left[0].opacity, 1);
  for (const frame of [0, -1, 1.5, 337, NaN]) {
    assert.throws(() => getTs004SceneState(frame));
  }
});
