import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps, RuntimeContext} from '../src/contract';
import type {SourceStaticCanvasFrameState} from '../src/source-static-canvas-candidate';
import {
  createAlgL06P004TextPresentationV1,
  p004PresentationTextSnapshot,
} from '../src/alg-l06-p004-text-presentation-v1';
import {P004_SEMANTIC_TEXT_BINDING} from '../src/alg-l06-p004-semantic-text-v1';

const context = (frame: number, lang: 'en' | 'es' = 'en', replay = 0): RuntimeContext => ({
  frame, frameDomain: 'sprite-95', rootFrame: 6,
  scenario: 'source-static-frame', lang, seed: 0, replay,
});
const drawingState = (frame: number): SourceStaticCanvasFrameState => ({
  animationId: P004_SEMANTIC_TEXT_BINDING.animationId,
  sourceSwfSha256: P004_SEMANTIC_TEXT_BINDING.sourceSwfSha256,
  frame, exportFrame: frame - 1, frameDomain: 'sprite-95', rootFrame: 6,
  rootState: 'stopped-at-begin-while-child-static-frame-is-inspected',
  scenario: 'source-static-frame', language: 'en', seed: 0,
  status: 'ready', blocker: null, sourceStaticVisualReady: true,
  visibleSourceMarkers: [], interactiveControlsEnabled: false,
  sourceHostBehaviorResolved: false, naturalRuntimeEstablished: false, audioRendered: false,
});
function DrawingRenderer(props: AnimationRendererProps) {
  return <canvas data-test-drawing="true" data-test-frame={props.frame}
    data-test-domain={props.frameDomain} data-test-replay={props.replay}/>;
}
const capability = createAlgL06P004TextPresentationV1(DrawingRenderer);
const render = (frame: number, overrides: Partial<AnimationRendererProps> = {}) =>
  renderToStaticMarkup(React.createElement(capability.Renderer!, {
    ...context(frame), state: drawingState(frame), ...overrides,
  }));

test('capability binds the real P004 source and keeps the source drawing beside native text', () => {
  assert.equal(capability.schemaVersion, 1);
  assert.equal(capability.binding, P004_SEMANTIC_TEXT_BINDING);
  assert.equal(capability.getSnapshot, p004PresentationTextSnapshot);
  const html = render(93, {replay: 2});
  assert.match(html, /data-p004-text-composite="true"/);
  assert.match(html, /<canvas[^>]*data-test-frame="93"[^>]*data-test-replay="2"/);
  assert.match(html, /data-p004-native-companion="true"/);
  assert.match(html, /data-p004-text-block="equation93"/);
  assert.match(html, /data-p004-text-replay="2"/);
  assert.match(html, /data-p004-canvas-suppression="none"/);
});

test('the supplied frame and UI locale select source-bound reveal and Spanish fallback', () => {
  for (const [before, after, sourceId] of [
    [92, 93, 'equation93'],
    [610, 611, 'character-78/run-0'],
    [683, 684, 'character-83/run-0'],
  ] as const) {
    const active = (frame: number) => capability.getSnapshot(drawingState(frame), context(frame))
      .blocks.filter(block => block.visible &&
        (block.id === sourceId || P004_SEMANTIC_TEXT_BINDING.blocks.find(source => source.id === block.id)?.sourceTextIds.includes(sourceId)));
    assert.equal(active(before).length, 0);
    assert.equal(active(after).length, 1);
  }
  const html = render(684, {lang: 'en', uiLanguage: 'es'});
  assert.match(html, /data-p004-source-fallback="true"/);
  assert.match(html, /data-p004-language-policy="source-fallback"/);
  assert.match(html, /data-p004-content-language="en"/);
  assert.match(html, /data-p004-text-frame="684"/);
});

test('a supplied drawing state must match frame, provenance, source identity and trace', () => {
  const state = drawingState(93), request = context(93, 'es', 4);
  assert.equal(capability.getSnapshot(state, request).identity.replay, 4);
  for (const patch of [
    {frame: 92}, {frameDomain: 'root'}, {rootFrame: 1}, {language: 'es'},
    {sourceSwfSha256: '0'.repeat(64)}, {animationId: 'shared-alg001-l06-p003'},
    {status: 'blocked', blocker: 'root-baseline-unavailable'},
  ] as const) {
    assert.throws(() => capability.getSnapshot({...state, ...patch} as SourceStaticCanvasFrameState, request),
      /P004_TEXT_DRAWING_STATE_MISMATCH/);
  }
  assert.throws(() => capability.getSnapshot(
    {...state, traceId: 'actual'}, {...request, traceId: 'other'}),
    /P004_TEXT_DRAWING_STATE_MISMATCH/);
  assert.throws(() => capability.getSnapshot(state, {...request, frameDomain: 'root'}), RangeError);
});

test('unsupported root and sibling capture remain on the original drawing renderer', () => {
  for (const overrides of [
    {frameDomain: 'root', rootFrame: 1, scenario: 'root-unavailable'},
    {frameDomain: 'sprite-98', scenario: 'sprite-98-unavailable'},
    {lang: 'es' as const},
  ]) {
    const html = render(1, overrides);
    assert.match(html, /data-test-drawing="true"/);
    assert.doesNotMatch(html, /data-p004-native-text|data-p004-text-composite/);
  }
});
