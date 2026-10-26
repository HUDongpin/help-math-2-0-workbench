import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import module from '../src/modules/g678-alg-l06-source-title-p001';

const context = (frame: number) => ({frame, frameDomain: 'sprite-142',
  rootFrame: 6, scenario: 'source-static-frame', lang: 'en' as const,
  seed: 0});

test('P001 module declares the root and nested source domains without claiming audio', () => {
  assert.equal(module.key, 'shared-alg001-l06-p001');
  assert.equal(module.maturity, 'private-current-js');
  assert.deepEqual(module.movie.stage, {width: 800, height: 600});
  assert.equal(module.movie.fps, 12);
  assert.equal(module.movie.frameCount, 10);
  assert.deepEqual(module.runtime?.frameDomains, [
    {id: 'root', frameCount: 10},
    {id: 'sprite-142', frameCount: 134, rootFrame: 6},
  ]);
  assert.equal(module.playbackEndFrameByDomain?.['sprite-142'], 134);
  assert.deepEqual(module.audioCues, []);
});

test('P001 module queries every source title frame and rejects a mismatched host context', () => {
  for (let frame = 1; frame <= 134; frame++) {
    const state = module.getFrameState(frame, context(frame));
    assert.equal(state.frame, frame);
    assert.equal(state.frameDomain, 'sprite-142');
    assert.equal(state.layers.length, 2);
  }
  for (const bad of [
    {...context(1), frameDomain: 'root'},
    {...context(1), rootFrame: 5},
    {...context(1), scenario: 'other'},
    {...context(1), lang: 'es' as const},
    {...context(1), seed: 1},
  ]) assert.throws(() => module.getFrameState(1, bad));
  assert.throws(() => module.getFrameState(135, context(135)));
});

test('P001 renderer fails closed on audio and never presents a blank stage before glyphs load', () => {
  const props = {...context(133), audioEnabled: false, uiLanguage: 'es' as const};
  assert.match(renderToStaticMarkup(<module.Renderer {...props}/>),
    /Loading source title/);
  assert.throws(() => renderToStaticMarkup(<module.Renderer {...props} audioEnabled/>),
    /source audio is not admitted/);
});
