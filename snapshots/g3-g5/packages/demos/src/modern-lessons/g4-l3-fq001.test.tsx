import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {loadLessonTextPresentation} from '../lesson-text-registry';
import {getCourseG04L03Fq001FrameState} from '../modules/course-g04-l03-fq-001';
import {COURSE_G04_L03_FQ_001_SOURCE} from '../timelines/course-g04-l03-fq-001';
import {FQ001_PRESENTATION, FQ001_SOURCE_ROLES, FQ001_TEXT_BINDING, getFq001TextSnapshot, ModernRenderer} from './g4-l3-fq001';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const context = (frame: number, extra: Partial<RuntimeContext> = {}): RuntimeContext => ({
  frame, frameDomain: 'sprite-41', rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 7,
  replay: 0, ...extra,
});
const snapshotAt = (frame: number, extra: Partial<RuntimeContext> = {}) => {
  const request = context(frame, extra);
  return getFq001TextSnapshot(getCourseG04L03Fq001FrameState(frame, request), request);
};

interface SourceAsset {
  sourceSha256: string;
  textDefinitions: Array<{sourceTextId: string; runs: Array<{sourceTextId: string; text: string}>}>;
  timelines: Array<{timelineId: string; events: Array<{frame: number; depth?: number; colorTransform?: {multiply: number[]}}>}>;
}
async function source(): Promise<SourceAsset> {
  const bytes = gunzipSync(await readFile(`${root}catalog/typography-v1/source-catalog/assets/${FQ001_TEXT_BINDING.sourceSwfSha256}.json.gz`));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), FQ001_SOURCE_ROLES.sourceCatalogContentSha256);
  return JSON.parse(bytes.toString('utf8'));
}

test('page 037 binds the exact source and classifies every source text character', async () => {
  const asset = await source();
  assert.equal(FQ001_TEXT_BINDING.placementId, 'g04-l03-placement-037');
  assert.equal(asset.sourceSha256, COURSE_G04_L03_FQ_001_SOURCE.swfSha256);
  const ids = asset.textDefinitions.map(definition => Number(definition.sourceTextId.replace('character-', '')));
  const disposition = [...FQ001_SOURCE_ROLES.titleCharacters, ...FQ001_SOURCE_ROLES.ambientNegativeCharacters,
    ...FQ001_SOURCE_ROLES.omittedGraphCharacters, ...FQ001_SOURCE_ROLES.omittedCompanionCharacters];
  assert.deepEqual(disposition.toSorted((a, b) => a - b), ids.toSorted((a, b) => a - b));
  const sourceTextIds = new Set(asset.textDefinitions.flatMap(definition => definition.runs.map(run => run.sourceTextId)));
  for (const block of FQ001_TEXT_BINDING.blocks) for (const id of block.sourceTextIds) assert.ok(sourceTextIds.has(id), id);
  const sourceTexts = new Map(asset.textDefinitions.flatMap(definition => definition.runs.map(run => [run.sourceTextId, run.text] as const)));
  assert.equal(sourceTexts.get('character-39/run-0'), 'Final Quiz');
  assert.equal(sourceTexts.get('character-40/run-0'), 'Final Quiz');
  assert.deepEqual(FQ001_SOURCE_ROLES.ambientNegativeCharacters.map(id => sourceTexts.get(`character-${id}/run-0`)!.replace(/\s/g, '').replace('–', '−')),
    ['−4', '−17', '−25', '−40']);
});

test('native title follows the source first-visible frame and Replay resets it', async () => {
  const asset = await source();
  const timeline = asset.timelines.find(item => item.timelineId === 'sprite-41')!;
  const title = timeline.events.filter(event => event.depth === 16 || event.depth === 17);
  assert.ok(title.filter(event => event.frame === 1).every(event => event.colorTransform?.multiply[3] === 0));
  assert.ok(title.filter(event => event.frame === 2).every(event => event.colorTransform?.multiply[3] === 13));
  assert.ok(title.filter(event => event.frame === 20).every(event => event.colorTransform?.multiply[3] === 256));
  assert.equal(snapshotAt(1).blocks[0]?.visible, false);
  assert.equal(snapshotAt(2).blocks[0]?.visible, true);
  assert.equal(snapshotAt(52).blocks[0]?.visible, true);
  assert.deepEqual(snapshotAt(1, {replay: 3}).blocks, snapshotAt(1).blocks);
  assert.equal(snapshotAt(1, {replay: 3}).identity.replay, 3);
  assert.equal(FQ001_PRESENTATION.reducedMotionFrameByDomain?.['sprite-41'], 52);
  assert.equal(FQ001_SOURCE_ROLES.sourceContextAlpha, 26 / 256);
});

test('product candidate uses real responsive text, without old Canvas or invented quiz controls', () => {
  const html = renderToStaticMarkup(<ModernRenderer {...context(52)}/>);
  assert.match(html, /data-presentation-status="candidate"/);
  assert.match(html, /<h2[^>]*>Final Quiz<\/h2>/);
  for (const value of ['−4', '−17', '−25', '−40']) assert.ok(html.includes(value));
  assert.ok(!/<(?:canvas|img|button|input|audio|video)\b/.test(html));
  assert.ok(!html.includes('f(x)=mx+b'));
  assert.match(html, /data-original-runtime-accepted="false"/);
  assert.match(html, /data-strict-migration-complete="false"/);
  assert.ok(!renderToStaticMarkup(<ModernRenderer {...context(1)}/>).includes('<h2'));
});

test('Spanish UI discloses English source fallback; source-es and mismatched requests fail closed', () => {
  const html = renderToStaticMarkup(<ModernRenderer {...context(52)} uiLanguage="es"/>);
  assert.match(html, /data-language-policy="source-fallback"/);
  assert.match(html, /data-spanish-translation="false"/);
  assert.match(html, /lang="en"/);
  assert.equal(snapshotAt(52, {lang: 'es'}).status, 'blocked');
  assert.equal(snapshotAt(0).status, 'blocked');
  assert.equal(snapshotAt(53).status, 'blocked');
  assert.equal(snapshotAt(52, {frameDomain: 'root'}).status, 'blocked');
  assert.equal(snapshotAt(52, {rootFrame: 7}).status, 'blocked');
  assert.equal(getFq001TextSnapshot(getCourseG04L03Fq001FrameState(52, context(52)), context(51)).status, 'blocked');
});

test('the maintained page is an explicit opt-in, not a change to the legacy source-static module', async () => {
  assert.equal(await loadLessonTextPresentation(FQ001_TEXT_BINDING.animationId), FQ001_PRESENTATION);
});
