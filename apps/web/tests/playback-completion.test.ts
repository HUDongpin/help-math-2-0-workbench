import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  playbackReachedEnd,
  resolveAnimationPlaybackProgress,
} from '@/components/animation-runtime';
import {frameAtElapsedMs, resolvePlaybackEndFrame} from '@helpmath/demos/runtime';

const PLAYING = {
  captureFrame: undefined,
  fps: 12,
  playbackEndFrame: 43,
  reducedMotion: false,
  rendererDomainSupported: true,
} as const;

test('a page is complete only once its timeline reaches the authored end frame', () => {
  assert.equal(playbackReachedEnd({...PLAYING, frame: 1}), false);
  assert.equal(playbackReachedEnd({...PLAYING, frame: 42}), false);
  assert.equal(playbackReachedEnd({...PLAYING, frame: 43}), true);
  // A short authored end frame finishes before the movie runs out of frames.
  assert.equal(
    playbackReachedEnd({...PLAYING, frame: 43, playbackEndFrame: 68}),
    false,
  );
});

test('a looping page completes on its first pass instead of never', () => {
  const movie = {stage: {width: 800, height: 600}, fps: 12, frameCount: 24, durationMs: 2000};
  const endFrame = resolvePlaybackEndFrame(movie);
  const seen = [];
  for (let elapsed = 0; elapsed <= 4000; elapsed += 1000 / movie.fps) {
    seen.push(frameAtElapsedMs(elapsed, movie, 'loop'));
  }
  // The loop wraps, so it revisits frame 1 — but it does reach the end frame,
  // and the runtime latches the first report.
  assert.ok(seen.filter((frame) => frame === 1).length > 1, 'loop must wrap');
  const firstCompleteIndex = seen.findIndex((frame) =>
    playbackReachedEnd({...PLAYING, frame, playbackEndFrame: endFrame})
  );
  assert.equal(seen[firstCompleteIndex], endFrame);
  assert.ok(
    firstCompleteIndex > 0 && firstCompleteIndex <= seen.length / 2,
    `a looping page must complete during its first pass, not at ${firstCompleteIndex}`,
  );
});

test('a page with nothing to play is complete as soon as it renders', () => {
  // Reduced motion holds one authored frame; waiting for an end frame that
  // never arrives would deny a learner their progress.
  assert.equal(
    playbackReachedEnd({...PLAYING, frame: 1, reducedMotion: true}),
    true,
  );
  // A movie with no live frame rate never advances either.
  assert.equal(playbackReachedEnd({...PLAYING, frame: 1, fps: 0}), true);
});

test('a page that is not really playing reports nothing', () => {
  // The reduced-motion preference has not resolved yet.
  assert.equal(
    playbackReachedEnd({...PLAYING, frame: 43, reducedMotion: undefined}),
    false,
  );
  // A deterministic capture URL is frozen evidence, not a learner watching.
  assert.equal(playbackReachedEnd({...PLAYING, frame: 43, captureFrame: 43}), false);
  // The renderer cannot draw the requested source timeline domain.
  assert.equal(
    playbackReachedEnd({...PLAYING, frame: 43, rendererDomainSupported: false}),
    false,
  );
});

test('page animation progress uses the authored playback end rather than asset frame count', () => {
  const progressing = {
    capture: false,
    fps: 12,
    playbackEndFrame: 328,
    reducedMotion: false,
    rendererDomainSupported: true,
  } as const;

  assert.equal(resolveAnimationPlaybackProgress({...progressing, frame: 1}), 0);
  assert.equal(
    resolveAnimationPlaybackProgress({...progressing, frame: 164}),
    163 / 327,
  );
  // Page 36 owns 789 source frames but its authored playback stops at 328.
  // Reaching that real endpoint must report 100%, and later frames clamp.
  assert.equal(resolveAnimationPlaybackProgress({...progressing, frame: 328}), 1);
  assert.equal(resolveAnimationPlaybackProgress({...progressing, frame: 789}), 1);
  // A loop returns to the beginning of its next pass; this is a playhead, not
  // earned completion, so the reset to zero is intentional.
  assert.equal(resolveAnimationPlaybackProgress({...progressing, frame: 1}), 0);
});

test('page animation progress handles static, reduced-motion and unavailable states', () => {
  const base = {
    capture: false,
    fps: 12,
    frame: 1,
    playbackEndFrame: 68,
    reducedMotion: false,
    rendererDomainSupported: true,
  } as const;

  assert.equal(
    resolveAnimationPlaybackProgress({...base, playbackEndFrame: 1}),
    1,
    'a ready static page is immediately complete',
  );
  assert.equal(
    resolveAnimationPlaybackProgress({...base, reducedMotion: true}),
    1,
    'reduced motion holds an authored frame but must not look stuck',
  );
  assert.equal(resolveAnimationPlaybackProgress({...base, fps: 0}), 1);
  assert.equal(resolveAnimationPlaybackProgress({...base, capture: true}), null);
  assert.equal(
    resolveAnimationPlaybackProgress({...base, reducedMotion: undefined}),
    null,
  );
  assert.equal(
    resolveAnimationPlaybackProgress({
      ...base,
      rendererDomainSupported: false,
    }),
    null,
  );
});

test('the runtime reports completion once per page and per replay', async () => {
  const source = await readFile(
    new URL('../components/animation-runtime.tsx', import.meta.url),
    'utf8',
  );
  // The report is latched on an identity that includes the replay counter, so
  // one page cannot repeatedly re-report, and a deliberate Replay can.
  assert.match(
    source,
    /const completionIdentity = `\$\{playbackIdentity\}:\$\{replay\}`/,
  );
  assert.match(
    source,
    /if \(reportedCompletionRef\.current === completionIdentity\) return;\s*reportedCompletionRef\.current = completionIdentity;\s*onPlaybackComplete\?\.\(\);/,
  );
  assert.match(source, /data-runtime-playback-complete=\{playbackComplete/);
});
