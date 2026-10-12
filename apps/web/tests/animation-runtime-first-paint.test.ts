import assert from 'node:assert/strict';
import test, {type TestContext} from 'node:test';
import {
  observeAnimationFirstPaint,
  playbackReachedEnd,
  resolveAnimationPlaybackProgress,
} from '../components/animation-runtime';

function readinessStage(
  t: TestContext,
  initial: Record<string, string>[],
  descendants: Record<number, Record<string, string>[]> = {},
) {
  let markers = initial;
  let notify: () => void;
  let disconnected = false;
  const original = Object.getOwnPropertyDescriptor(globalThis, 'MutationObserver');
  class TestObserver {
    constructor(callback: () => void) { notify = callback; disconnected = false; }
    observe() {}
    disconnect() { disconnected = true; }
  }
  Object.defineProperty(globalThis, 'MutationObserver', {
    configurable: true,
    value: TestObserver,
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'MutationObserver', original);
    else Reflect.deleteProperty(globalThis, 'MutationObserver');
  });
  const stage = {
    querySelectorAll: () => markers.map((attributes, index) => ({
      getAttribute: (name: string) => attributes[name] ?? null,
      querySelector: (selector: string) => {
        assert.equal(selector, '[data-render-state="ready"]');
        return descendants[index]?.find((child) => child['data-render-state'] === 'ready') ?? null;
      },
    })),
  } as unknown as HTMLElement;
  return {
    stage,
    change(next: Record<string, string>[]) {
      markers = next;
      // Also exercises a queued callback arriving after disconnect/cleanup.
      notify();
    },
    disconnected: () => disconnected,
  };
}

test('synchronous React/SVG renderers are ready after their committed render', (t) => {
  const fixture = readinessStage(t, []);
  let ready = 0;
  observeAnimationFirstPaint(fixture.stage, () => ready++);
  assert.equal(ready, 1);
  assert.equal(fixture.disconnected(), true);
});

for (const disposition of ['root-source-structural', 'root-authoritative-frame', 'root-ffdec-structural-frame']) {
  test(`synchronous ${disposition} roots require their corresponding ready drawing`, (t) => {
    const markers: Record<string, string>[] = [
      {'data-canvas-status': disposition},
      {'data-canvas-status': disposition, 'data-render-state': 'ready'},
      {'data-render-state': 'ready'},
    ];
    const fixture = readinessStage(t, markers, {0: markers.slice(1), 1: markers.slice(2)});
    let ready = 0;
    observeAnimationFirstPaint(fixture.stage, () => ready++);
    assert.equal(ready, 1);
    assert.equal(fixture.disconnected(), true);
  });

  test(`synchronous ${disposition} roots cannot borrow an unrelated ready surface`, (t) => {
    const fixture = readinessStage(t, [{'data-canvas-status': disposition}, {'data-render-state': 'ready'}]);
    let ready = 0;
    const stop = observeAnimationFirstPaint(fixture.stage, () => ready++);
    for (const renderState of [null, 'loading', 'error', 'blocked', 'unknown', 'updating']) {
      const marker: Record<string, string> = {'data-canvas-status': disposition};
      if (renderState !== null) marker['data-render-state'] = renderState;
      fixture.change([marker, {'data-render-state': 'ready'}]);
      assert.equal(ready, 0, `unexpected ready for ${renderState}`);
    }
    stop();
  });
}

test('unknown Canvas dispositions remain blocked even alongside a ready drawing', (t) => {
  const fixture = readinessStage(t, [{'data-canvas-status': 'root-unknown', 'data-render-state': 'ready'}]);
  let ready = 0;
  const stop = observeAnimationFirstPaint(fixture.stage, () => ready++);
  assert.equal(ready, 0);
  stop();
});

test('the host waits for both Canvas loading and its actual drawing marker', (t) => {
  const fixture = readinessStage(t, [
    {'data-canvas-status': 'idle'},
    {'data-render-state': 'idle'},
  ]);
  let ready = 0;
  observeAnimationFirstPaint(fixture.stage, () => ready++);
  fixture.change([{'data-canvas-status': 'loading'}, {'data-render-state': 'loading'}]);
  assert.equal(ready, 0);
  fixture.change([{'data-canvas-status': 'ready'}, {'data-render-state': 'loading'}]);
  assert.equal(ready, 0);
  fixture.change([{'data-canvas-status': 'ready'}, {'data-render-state': 'ready'}]);
  assert.equal(ready, 1);
  assert.equal(fixture.disconnected(), true);
});

test('a painted Canvas updating its next frame does not wait again', (t) => {
  const fixture = readinessStage(t, [{'data-canvas-status': 'updating', 'data-render-state': 'ready'}]);
  let ready = 0;
  observeAnimationFirstPaint(fixture.stage, () => ready++);
  assert.equal(ready, 1);
  fixture.change([{'data-canvas-status': 'loading'}]);
  fixture.change([{'data-canvas-status': 'ready'}]);
  assert.equal(ready, 1);
});

test('blocked or failed renderers do not start playback, but a recovered drawing can', (t) => {
  const fixture = readinessStage(t, [{'data-canvas-status': 'error'}]);
  let ready = 0;
  observeAnimationFirstPaint(fixture.stage, () => ready++);
  fixture.change([{'data-render-state': 'blocked'}]);
  fixture.change([{'data-render-state': 'loading'}]);
  assert.equal(ready, 0);
  fixture.change([{'data-render-state': 'ready'}]);
  assert.equal(ready, 1);
});

test('a loaded-SWF composite waits for every declared drawing surface', (t) => {
  const fixture = readinessStage(t, [
    {'data-canvas-status': 'ready'},
    {'data-render-state': 'ready'},
    {'data-render-state': 'loading'},
  ]);
  let ready = 0;
  observeAnimationFirstPaint(fixture.stage, () => ready++);
  assert.equal(ready, 0);
  fixture.change([{'data-canvas-status': 'ready'}, {'data-render-state': 'ready'}]);
  assert.equal(ready, 1);
});

test('page navigation or Replay cleanup cannot release a stale first-paint wait', (t) => {
  const fixture = readinessStage(t, [{'data-canvas-status': 'loading'}]);
  let ready = 0;
  const stop = observeAnimationFirstPaint(fixture.stage, () => ready++);
  stop();
  fixture.change([{'data-canvas-status': 'ready'}]);
  assert.equal(ready, 0);
  assert.equal(fixture.disconnected(), true);
  const stopNext = observeAnimationFirstPaint(fixture.stage, () => ready++);
  assert.equal(ready, 1);
  stopNext();
});

const playback = {
  captureFrame: undefined,
  fps: 12,
  frame: 1,
  playbackEndFrame: 241,
  reducedMotion: false,
  rendererDomainSupported: true,
};

test('a reduced-motion still frame does not count an unplayed lesson as complete', () => {
  for (const frame of [1, playback.playbackEndFrame]) {
    const waitingForPlay = {...playback, frame, reducedMotion: true};
    assert.equal(playbackReachedEnd(waitingForPlay), false);
    assert.equal(resolveAnimationPlaybackProgress({...waitingForPlay, capture: false}), 0);
  }
});

test('ordinary playback reports actual timeline progress and completes at the end', () => {
  for (const [frame, expectedProgress, expectedComplete] of [
    [1, 0, false],
    [121, .5, false],
    [241, 1, true],
  ] as const) {
    const current = {...playback, frame};
    assert.equal(playbackReachedEnd(current), expectedComplete);
    assert.equal(resolveAnimationPlaybackProgress({...current, capture: false}), expectedProgress);
  }
});

test('a static no-fps drawing retains completion after motion preference resolves', () => {
  const staticDrawing = {...playback, fps: 0, playbackEndFrame: 1};
  assert.equal(playbackReachedEnd(staticDrawing), true);
  assert.equal(resolveAnimationPlaybackProgress({...staticDrawing, capture: false}), 1);
  assert.equal(playbackReachedEnd({...staticDrawing, reducedMotion: true}), false);
  assert.equal(resolveAnimationPlaybackProgress({...staticDrawing, reducedMotion: true, capture: false}), 0);
});

test('unresolved motion preference and unsupported renderers cannot report progress', () => {
  for (const unavailable of [
    {...playback, reducedMotion: undefined},
    {...playback, frame: playback.playbackEndFrame, rendererDomainSupported: false},
  ]) {
    assert.equal(playbackReachedEnd(unavailable), false);
    assert.equal(resolveAnimationPlaybackProgress({...unavailable, capture: false}), null);
  }
});

test('deterministic capture never counts as played even at the final frame', () => {
  for (const reducedMotion of [false, true]) {
    const capture = {...playback, frame: playback.playbackEndFrame, reducedMotion};
    assert.equal(playbackReachedEnd({...capture, captureFrame: capture.frame}), false);
    assert.equal(resolveAnimationPlaybackProgress({...capture, capture: true}), null);
  }
});
