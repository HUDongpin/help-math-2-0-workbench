import assert from 'node:assert/strict';
import test from 'node:test';

import type {RuntimeContext} from '../contract';
import {renderNmsL09P003CanvasCandidate, type NmsL09P003CanvasCandidate} from
  './shared-nms002-l09-p003-canvas-bridge';
import {createNmsL09P003Clock, reduceNmsL09P003Clock} from
  './shared-nms002-l09-p003-source-clock';

function fixture(frame: number, lang: 'en' | 'es' = 'en') {
  const calls: {kind: 'text' | 'raw'; request: Record<string, unknown>}[] = [];
  const state = {localFrame: frame, frameDomain: 'sprite-246', rootFrame: 6,
    scenario: 'source-static-frame', lang: 'en', seed: 0,
    visualOnly: true, audioRendered: false};
  const adapter: NmsL09P003CanvasCandidate = {
    metadata: {animationId: 'course-shared-nms002-l09-p003',
      classification: 'private-root-held-nested-source-drawing-candidate-v1',
      sourceSwfSha256:
        'd6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd',
      stage: {width: 800, height: 600}},
    async ready() {},
    render(_canvas, request) {calls.push({kind: 'raw', request}); return state;},
    renderWithText(_canvas, request) {
      calls.push({kind: 'text', request});
      const text = request.text as {suppressInstanceIds: string[];
        suppressShapeInstanceIds: string[]};
      const activeText = text.suppressInstanceIds.slice(0, frame >= 591 ? 9 : 8);
      const emphasis = [590, 592, 594, 615, 617, 619].indexOf(frame);
      if (emphasis >= 0) activeText.push(text.suppressInstanceIds[9 + emphasis]!);
      const shapes = [text.suppressShapeInstanceIds[0]!];
      if (emphasis >= 0) shapes.push(text.suppressShapeInstanceIds[emphasis + 1]!);
      return {state, suppressedInstanceIds: [...activeText, ...shapes]};
    },
  };
  const clock = createNmsL09P003Clock(frame);
  const context: RuntimeContext = {frame, frameDomain: 'sprite-246',
    rootFrame: 6, scenario: 'source-static-frame', lang, seed: 0,
    replay: clock.revision};
  const canvas = {width: 800, height: 600} as HTMLCanvasElement;
  return {adapter, calls, clock, context, canvas};
}

test('fixed 800x600 bridge requests all source IDs and validates only active sites', () => {
  for (const frame of [1, 590, 591, 592, 594, 615, 616, 617, 619, 635]) {
    const setup = fixture(frame);
    const result = renderNmsL09P003CanvasCandidate(setup);
    assert.equal(result.status, 'ready', `frame ${frame}`);
    assert.equal(setup.calls.length, 1);
    const text = setup.calls[0]!.request.text as Record<string, unknown>;
    assert.equal((text.suppressInstanceIds as string[]).length, 15);
    assert.equal((text.suppressShapeInstanceIds as string[]).length, 7);
    assert.deepEqual((text.suppressShapeInstanceIds as string[]).slice(0, 2), [
      'root:298:1:249/sprite-249:1:1:248',
      'root:1:1:246/sprite-246:282:1:227',
    ]);
    assert.equal(result.suppressedInstanceIds.length,
      9 + (frame >= 591 ? 1 : 0) +
      ([590, 592, 594, 615, 617, 619].includes(frame) ? 2 : 0));
  }
});

test('Spanish host identity uses explicit English-source graphic fallback', () => {
  const setup = fixture(616, 'es');
  const result = renderNmsL09P003CanvasCandidate(setup);
  assert.equal(result.status, 'ready');
  assert.equal(result.sourceLanguagePolicy, 'source-fallback');
  assert.equal(result.snapshot.identity.language, 'es');
  assert.equal(setup.calls[0]!.request.lang, 'en');
  assert(result.snapshot.blocks.every(block => block.language === 'en'));
});

test('missing shape suppression redraws raw source and hides native text', () => {
  const setup = fixture(590);
  const original = setup.adapter.renderWithText;
  const adapter = {...setup.adapter, renderWithText(canvas: HTMLCanvasElement,
    request: Record<string, unknown>) {
    const result = original(canvas, request) as {state: unknown;
      suppressedInstanceIds: string[]};
    return {...result, suppressedInstanceIds: result.suppressedInstanceIds.slice(0, -1)};
  }};
  const result = renderNmsL09P003CanvasCandidate({...setup, adapter});
  assert.equal(result.status, 'legacy-fallback');
  assert.equal(result.snapshot.status, 'blocked');
  assert.equal(result.snapshot.blocks.length, 0);
  assert.deepEqual(setup.calls.map(call => call.kind), ['text', 'raw']);
});

test('a thrown partial suppression redraws raw; invalid raw state fails closed', () => {
  const setup = fixture(635);
  const adapter = {...setup.adapter,
    renderWithText() {throw new Error('partial draw');}};
  const result = renderNmsL09P003CanvasCandidate({...setup, adapter});
  assert.equal(result.status, 'legacy-fallback');
  assert.deepEqual(setup.calls.map(call => call.kind), ['raw']);
  assert.throws(() => renderNmsL09P003CanvasCandidate({...setup,
    adapter: {...adapter, render() {return {localFrame: 1};}}}),
  /raw source fallback state mismatch/u);
});

test('wrong canvas, source, and stale Replay identity fail before drawing', () => {
  const setup = fixture(1);
  assert.throws(() => renderNmsL09P003CanvasCandidate({...setup,
    canvas: {width: 1600, height: 1200} as HTMLCanvasElement}),
  /fixed-canvas/u);
  assert.throws(() => renderNmsL09P003CanvasCandidate({...setup,
    adapter: {...setup.adapter, metadata: {...setup.adapter.metadata,
      sourceSwfSha256: 'wrong'}}}), /source identity/u);
  const replay = reduceNmsL09P003Clock(setup.clock, {type: 'replay'});
  assert.throws(() => renderNmsL09P003CanvasCandidate({...setup,
    clock: replay}), /exact frozen source clock/u);
  assert.equal(setup.calls.length, 0);
});

test('Replay after the terminal frame returns to the eight base text sites', () => {
  const setup = fixture(1);
  const replay = reduceNmsL09P003Clock(createNmsL09P003Clock(635),
    {type: 'replay'});
  const result = renderNmsL09P003CanvasCandidate({...setup,
    clock: replay, context: {...setup.context, replay: replay.revision}});
  assert.equal(result.status, 'ready');
  assert.equal(result.snapshot.identity.replay, 1);
  assert.equal(result.suppressedInstanceIds.length, 9);
  assert.equal(result.snapshot.blocks.find(block => block.id === 'expression')?.visible,
    false);
});
