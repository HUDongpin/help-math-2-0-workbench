import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {lessonTypographyLanguages} from
  '../../../../apps/web/lib/lesson-typography-policy';
import {prepareG678LessonTypography} from
  '../../../../apps/web/lib/g678-lesson-typography-presentation';
import type {RuntimeContext} from '../contract';
import {stateSupportsRuntimeContext} from '../runtime';

// The real candidate imports its product CSS. Bundle the module with only CSS
// elided for Node SSR tests; the production import graph stays unchanged.
const built = await build({entryPoints: [fileURLToPath(new URL(
  './g678-nms-l09-native-candidate-p003.tsx', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs',
  packages: 'external', loader: {'.css': 'empty'}});
const exportsObject: {default?: typeof import(
  './g678-nms-l09-native-candidate-p003')['default']} = {};
const moduleObject = {exports: exportsObject};
new Function('require', 'module', 'exports', built.outputFiles[0]!.text)(
  createRequire(import.meta.url), moduleObject, exportsObject);
const candidate = moduleObject.exports.default!;

const context: RuntimeContext = Object.freeze({frame: 616,
  frameDomain: 'sprite-246', rootFrame: 6, replay: 2,
  scenario: 'source-static-frame', lang: 'en', seed: 0});

test('exposes only the exact nested source domain and no accepted audio', () => {
  assert.equal(candidate.key, 'shared-nms002-l09-p003');
  assert.equal(candidate.movie.frameCount, 10);
  assert.equal(candidate.runtime?.defaultFrameDomain, 'sprite-246');
  assert.deepEqual(candidate.runtime?.frameDomains, [
    {id: 'root', frameCount: 10},
    {id: 'sprite-246', frameCount: 635, rootFrame: 6},
  ]);
  assert.equal(candidate.playbackEndFrameByDomain?.['sprite-246'], 635);
  assert.deepEqual(candidate.audioCues, []);
  assert.equal(candidate.maturity, 'private-current-js');
  assert.equal(candidate.textPresentation?.binding.sourceSwfSha256,
    'd6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd');
  assert(candidate.textPresentation?.binding.blocks.every(block =>
    block.language === 'en'));
  assert.equal(candidate.textPresentation?.Renderer, candidate.Renderer);
  assert.deepEqual(lessonTypographyLanguages('en', 'es',
    candidate.textPresentation?.binding), {
    requestedLanguage: 'en', visualLanguage: 'en', uiLanguage: 'es',
    usesEnglishFallback: true,
  });
});

test('passes the existing G678 host text-presentation contract', async () => {
  assert.equal(await prepareG678LessonTypography(candidate, false), candidate);
});

test('maps host seek and replay identity to deterministic source text', () => {
  const reveal = candidate.getFrameState(616, context);
  assert(stateSupportsRuntimeContext(reveal,
    {frameDomain: 'sprite-246', scenario: 'source-static-frame', lang: 'en'},
    candidate.runtime!));
  assert.equal(stateSupportsRuntimeContext(reveal,
    {frameDomain: 'root', scenario: 'source-static-frame', lang: 'en'},
    candidate.runtime!), false);
  assert.equal(reveal.formulaRevealStep, 5);
  assert.equal(reveal.snapshot.blocks.find(block => block.id === 'expression')?.text,
    '5 + 3 × 2');
  const reset = candidate.getFrameState(1, {...context, frame: 1, replay: 3});
  assert.equal(reset.formulaRevealStep, 0);
  assert.equal(reset.snapshot.blocks.find(block => block.id === 'expression')?.visible,
    false);
  assert.equal(candidate.getFrameState(616, {...context, lang: 'es'})
    .sourceLanguagePolicy, 'source-fallback');
  assert.deepEqual(candidate.textPresentation?.getSnapshot(reveal, context),
    reveal.snapshot);
  assert.throws(() => candidate.textPresentation?.getSnapshot(reveal,
    {...context, frame: 615}), /state mismatch/u);
});

test('rejects mismatched source identities and out-of-range host frames', () => {
  for (const changed of [
    {...context, frame: 615}, {...context, frameDomain: 'root'},
    {...context, rootFrame: 7}, {...context, seed: 1},
    {...context, scenario: 'other'}, {...context, replay: -1},
  ]) assert.throws(() => candidate.getFrameState(616, changed));
  assert.throws(() => candidate.getFrameState(636, {...context, frame: 636}));
});

test('host-facing renderer permits ES controls over EN source and denies audio', () => {
  const props = {...context, frameDomain: 'sprite-246', rootFrame: 6};
  assert.match(renderToStaticMarkup(<candidate.Renderer {...props}/>),
    /Loading source-bound lesson figure/u);
  assert.match(renderToStaticMarkup(<candidate.Renderer {...props}
    uiLanguage="es"/>), /Loading source-bound lesson figure/u);
  assert.throws(() => renderToStaticMarkup(
    <candidate.Renderer {...props} audioEnabled/>), /not admitted/u);
});
