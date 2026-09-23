import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G4_R6,
  G5_R6,
  g5CaptureFrameUrl,
  parseMode,
} from './run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r6.mjs';

test('r6 requires an explicit execution mode and fresh successor output roots', () => {
  assert.equal(parseMode(['--run']), 'run');
  assert.equal(parseMode(['--help']), 'help');
  assert.throws(() => parseMode([]), /expected exactly/u);
  assert.match(G4_R6.outputRoot, /-r10$/u);
  assert.match(G5_R6.outputRoot, /-r6$/u);
  assert.notEqual(G4_R6.outputRoot, G5_R6.outputRoot);
});

test('r6 retains the exact G4 and G5 source-bound frame domains', () => {
  assert.deepEqual({frames: G4_R6.frameCount, domain: G4_R6.frameDomain}, {frames: 128, domain: 'sprite-23'});
  assert.deepEqual({frames: G5_R6.frameCount, domain: G5_R6.frameDomain}, {frames: 419, domain: 'sprite-341'});
});

test('r6 preflight URL supplies the one permitted G5 capture contract', () => {
  const url = new URL(g5CaptureFrameUrl('http://127.0.0.1:43121', 1));
  assert.equal(url.pathname, '/executive-preview/g5-l4');
  assert.equal(url.searchParams.get('scene'), 'course-g05-l04-rw-002');
  assert.equal(url.searchParams.get('capture'), '1');
  assert.equal(url.searchParams.get('frame'), '1');
  assert.equal(url.searchParams.get('frameDomain'), 'sprite-341');
  assert.equal(url.searchParams.get('requirementId'), 'req:sprite-341:lesson-shell-natural-entry:en');
  assert.throws(() => g5CaptureFrameUrl('https://127.0.0.1:43121', 1), /loopback/u);
  assert.throws(() => g5CaptureFrameUrl('http://127.0.0.1:43121', 420), /outside/u);
});
