import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampFrame,
  audioCueMatchesContext,
  createPlaybackContext,
  createRuntimeContext,
  frameAtElapsedMs,
  frameDomainMovie,
  frameToElapsedMs,
  isSameOriginAssetSource,
  listFrameDomains,
  parseFrame,
  parseLanguage,
  parseScenario,
  parseSeed,
  resolveFrameDomain,
  resolvePlaybackEndFrame,
  resolveReducedMotionFrame,
  resolveAudioCueTransition,
  stateSupportsFrameDomain,
  stateSupportsRuntimeContext
} from '../src/runtime';

const movie = {stage: {width: 780, height: 379}, fps: 12, frameCount: 109, durationMs: 9083};
const scenarios = [{id: 'default', label: 'Default'}, {id: 'success', label: 'Success'}];

test('Flash frames are one-indexed and clamped to the movie', () => {
  assert.equal(clampFrame(0, 109), 1);
  assert.equal(clampFrame(110, 109), 109);
  assert.equal(parseFrame('17', 109), 17);
  assert.equal(parseFrame('999', 109), 109);
  assert.equal(parseFrame('1.5', 109), undefined);
  assert.equal(parseFrame('-1', 109), undefined);
});

test('runtime query values have deterministic safe defaults', () => {
  assert.equal(parseLanguage('es'), 'es');
  assert.equal(parseLanguage('fr'), 'en');
  assert.equal(parseScenario('success', scenarios), 'success');
  assert.equal(parseScenario('missing', scenarios), 'default');
  assert.equal(parseSeed('-1'), 4_294_967_295);
  assert.equal(parseSeed('noise'), 0);
});

test('audio asset sources reject protocol-relative and normalized cross-origin URLs', () => {
  assert.equal(isSameOriginAssetSource('/flash-assets/audio/local.mp3'), true);
  assert.equal(isSameOriginAssetSource('/flash-assets/audio/local.mp3?lang=es'), true);
  assert.equal(isSameOriginAssetSource('//evil.example/audio.mp3'), false);
  assert.equal(isSameOriginAssetSource('/\\evil.example/audio.mp3'), false);
  assert.equal(isSameOriginAssetSource('https://evil.example/audio.mp3'), false);
  assert.equal(isSameOriginAssetSource(' /flash-assets/audio/local.mp3'), false);
});

test('frame elapsed time lands just inside the requested Flash frame', () => {
  assert.equal(frameToElapsedMs(1, movie), 0.001);
  assert.ok(frameToElapsedMs(2, movie) > 1000 / 12);
  assert.ok(frameToElapsedMs(109, movie) < movie.durationMs);
});

test('live playback can preserve a source root-timeline loop without changing one-shot defaults', () => {
  const loopMovie = {stage: {width: 225, height: 225}, fps: 12, frameCount: 60, durationMs: 5_000};
  const inside = 0.001;

  assert.equal(frameAtElapsedMs((59 * 1000) / 12 + inside, loopMovie, 'loop'), 60);
  assert.equal(frameAtElapsedMs((60 * 1000) / 12 + inside, loopMovie, 'loop'), 1);
  assert.equal(frameAtElapsedMs((61 * 1000) / 12 + inside, loopMovie, 'loop'), 2);
  assert.equal(frameAtElapsedMs(loopMovie.durationMs + inside, loopMovie), 60);
});

test('optional playback end preserves declared capture frames while stopping live playback early', () => {
  assert.equal(resolvePlaybackEndFrame(movie), movie.frameCount);
  assert.equal(resolvePlaybackEndFrame(movie, 51), 51);
  assert.equal(resolvePlaybackEndFrame(movie, 999), movie.frameCount);
  assert.equal(resolvePlaybackEndFrame(movie, Number.NaN), 1);
  assert.equal(frameAtElapsedMs(movie.durationMs, movie, 'once', 51), 51);
  assert.equal(frameAtElapsedMs((51 * 1000) / movie.fps, movie, 'loop', 51), 1);
  assert.equal(parseFrame('55', 55), 55, 'deterministic capture retains the declared root domain');
});

test('timeline audio resolves exact scenario/seed branches and source removal boundaries', () => {
  const cues = [
    {id: 'explicit', frame: 5, endFrame: 137, frameDomain: 'sprite-21', language: 'shared' as const, scenario: 'sound-0', source: '/explicit.mp3'},
    {id: 'seed-even', frame: 5, endFrame: 137, frameDomain: 'sprite-21', language: 'shared' as const, scenario: 'seeded', seedModulo: {divisor: 2, remainder: 0}, source: '/even.mp3'},
    {id: 'seed-odd', frame: 5, endFrame: 137, frameDomain: 'sprite-21', language: 'shared' as const, scenario: 'seeded', seedModulo: {divisor: 2, remainder: 1}, source: '/odd.mp3'}
  ];
  assert.equal(audioCueMatchesContext(cues[1]!, {frameDomain: 'sprite-21', lang: 'es', scenario: 'seeded', seed: 4}), true);
  assert.equal(audioCueMatchesContext(cues[2]!, {frameDomain: 'sprite-21', lang: 'en', scenario: 'seeded', seed: 4}), false);
  const start = resolveAudioCueTransition(cues, {previousFrame: 4, frame: 6, fps: 12, frameDomain: 'sprite-21', lang: 'es', scenario: 'seeded', seed: 4});
  assert.deepEqual(start.start.map(({cue}) => cue.id), ['seed-even']);
  assert.equal(start.start[0]!.offsetSeconds, 1 / 12);
  assert.deepEqual(start.stopIds, []);
  const stop = resolveAudioCueTransition(cues, {previousFrame: 136, frame: 137, fps: 12, frameDomain: 'sprite-21', lang: 'es', scenario: 'seeded', seed: 4});
  assert.deepEqual(stop.start, []);
  assert.deepEqual(stop.stopIds, ['seed-even']);
});

test('createRuntimeContext keeps capture intent separate from normal playback', () => {
  const live = createRuntimeContext({lang: 'es'}, movie, scenarios);
  assert.equal(live.frame, 1);
  assert.equal(live.captureFrame, undefined);
  assert.equal(live.frameDomain, 'root');
  assert.equal(live.rootFrame, 1);
  assert.equal(live.traceId, 'default-root-es');
  assert.equal(live.requirementId, 'runtime-default-root-es');
  assert.equal(live.entryStateSha256, '');
  assert.equal(live.lang, 'es');

  const captured = createRuntimeContext(
    {frame: ['42', '8'], scenario: 'success', seed: '7'},
    movie,
    scenarios
  );
  assert.equal(captured.captureFrame, 42);
  assert.equal(captured.frameDomain, 'root');
  assert.equal(captured.rootFrame, 42);
  assert.equal(captured.traceId, 'success-root-en');
  assert.equal(captured.requirementId, 'runtime-success-root-en');
  assert.equal(captured.scenario, 'success');
  assert.equal(captured.seed, 7);
});

test('defaultFrameDomain addresses a nested MovieClip without replacing root SWF metadata', () => {
  const runtime = {
    ...movie,
    frameCount: 10,
    durationMs: (10 * 1000) / 12,
    frameDomains: [{id: 'sprite-58', frameCount: 142, rootFrame: 6}],
    defaultFrameDomain: 'sprite-58'
  };
  const context = createRuntimeContext({frame: '120'}, runtime, scenarios);
  const domain = resolveFrameDomain(runtime, context.frameDomain);

  assert.equal(runtime.frameCount, 10, 'runtime frameCount remains the root SWF timeline');
  assert.deepEqual(listFrameDomains(runtime), [
    {id: 'root', frameCount: 10},
    {id: 'sprite-58', frameCount: 142, rootFrame: 6}
  ]);
  assert.equal(context.frameDomain, 'sprite-58');
  assert.equal(context.captureFrame, 120);
  assert.equal(context.rootFrame, 6);
  assert.equal(domain.frameCount, 142);
  assert.equal(frameDomainMovie(runtime, domain).frameCount, 142);

  const clamped = createRuntimeContext(
    {frame: '999', frameDomain: 'sprite-58'},
    runtime,
    scenarios
  );
  assert.equal(clamped.captureFrame, 142);
  assert.equal(clamped.rootFrame, 6);

  const rootCapture = createRuntimeContext(
    {frame: '9', frameDomain: 'root'},
    runtime,
    scenarios
  );
  assert.equal(rootCapture.frameDomain, 'root');
  assert.equal(rootCapture.captureFrame, 9);
  assert.equal(rootCapture.rootFrame, 9);
});

test('scenario fallback is selected for the resolved frame domain', () => {
  const runtime = {
    ...movie,
    frameCount: 10,
    frameDomains: [{id: 'sprite-58', frameCount: 142, rootFrame: 6}],
    defaultFrameDomain: 'sprite-58'
  };
  const domainDefaults = {root: 'root-standalone', 'sprite-58': 'success'};
  const domainScenarios = [
    {id: 'default', label: 'Default'},
    {id: 'success', label: 'Success'},
    {id: 'root-standalone', label: 'Root'}
  ];

  assert.equal(
    createRuntimeContext({}, runtime, domainScenarios, domainDefaults).scenario,
    'success'
  );
  assert.equal(
    createRuntimeContext({frameDomain: 'root'}, runtime, domainScenarios, domainDefaults).scenario,
    'root-standalone'
  );
  assert.equal(
    createRuntimeContext(
      {frameDomain: 'root', scenario: 'missing'},
      runtime,
      domainScenarios,
      domainDefaults
    ).scenario,
    'root-standalone'
  );
});

test('unknown domains fall back deterministically and legacy movies remain root-only', () => {
  const nested = {
    ...movie,
    frameCount: 10,
    frameDomains: [{id: 'sprite-21', frameCount: 142, rootFrame: 6}],
    defaultFrameDomain: 'sprite-21'
  };
  assert.equal(resolveFrameDomain(nested, 'missing').id, 'sprite-21');
  assert.deepEqual(listFrameDomains(movie), [{id: 'root', frameCount: 109}]);
  assert.equal(createRuntimeContext({frameDomain: 'missing', frame: '20'}, movie, scenarios).frameDomain, 'root');
});

test('multi-domain state cannot masquerade as a different requested frame domain', () => {
  const runtime = {
    ...movie,
    frameCount: 10,
    frameDomains: [{id: 'sprite-21', frameCount: 142, rootFrame: 6}],
    defaultFrameDomain: 'sprite-21'
  };

  assert.equal(stateSupportsFrameDomain({frameDomain: 'sprite-21'}, 'sprite-21', runtime), true);
  assert.equal(stateSupportsFrameDomain({frameDomain: 'sprite-21'}, 'root', runtime), false);
  assert.equal(stateSupportsFrameDomain({}, 'root', runtime), false);
  assert.equal(stateSupportsFrameDomain({frameDomain: 'anything'}, 'root', movie), true);
  const context = {
    frameDomain: 'sprite-21',
    scenario: 'sound-0',
    lang: 'es' as const
  };
  assert.equal(
    stateSupportsRuntimeContext(
      {frameDomain: 'sprite-21', scenario: 'sound-0', language: 'es'},
      context,
      runtime
    ),
    true
  );
  assert.equal(
    stateSupportsRuntimeContext(
      {frameDomain: 'sprite-21', scenario: 'root-standalone', language: 'es'},
      context,
      runtime
    ),
    false
  );
  assert.equal(
    stateSupportsRuntimeContext(
      {frameDomain: 'sprite-21', scenario: 'sound-0', language: 'en'},
      context,
      runtime
    ),
    false
  );
});

test('Replay creates a complete composite host context at frame one', () => {
  const entryStateSha256 = 'a'.repeat(64);
  const runtime = {
    ...movie,
    frameCount: 10,
    frameDomains: [{id: 'sprite-58', frameCount: 142, rootFrame: 6}],
    defaultFrameDomain: 'sprite-58'
  };
  const initial = createRuntimeContext(
    {
      scenario: 'success',
      lang: 'es',
      seed: '42',
      requirementId: 'req-success-sprite-58-es',
      trace: 'success-sprite-58-es',
      entryStateSha256
    },
    runtime,
    scenarios
  );
  const domain = resolveFrameDomain(runtime, initial.frameDomain);
  const replayed = createPlaybackContext(initial, 1, 3, domain);

  assert.deepEqual(replayed, {
    frame: 1,
    frameDomain: 'sprite-58',
    rootFrame: 6,
    scenario: 'success',
    lang: 'es',
    seed: 42,
    requirementId: 'req-success-sprite-58-es',
    traceId: 'success-sprite-58-es',
    entryStateSha256,
    replay: 3
  });
});

test('reduced motion defaults existing modules to frame 1 and supports an explicit safe frame', () => {
  assert.equal(resolveReducedMotionFrame(movie), 1);
  assert.equal(resolveReducedMotionFrame(movie, 50), 50);
  assert.equal(resolveReducedMotionFrame(movie, 999), movie.frameCount);
  assert.equal(resolveReducedMotionFrame(movie, Number.NaN), 1);
});
