import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G4_R5,
  G5_R5,
  parseMode,
} from './run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r5.mjs';

test('r5 requires an explicit execution mode and fresh successor output roots', () => {
  assert.equal(parseMode(['--run']), 'run');
  assert.equal(parseMode(['--help']), 'help');
  assert.throws(() => parseMode([]), /expected exactly/u);
  assert.notEqual(G4_R5.outputRoot, G5_R5.outputRoot);
  assert.match(G4_R5.outputRoot, /-r9$/u);
  assert.match(G5_R5.outputRoot, /-r5$/u);
});

test('r5 preserves the full source-bound G4 and G5 capture domains at native dimensions', () => {
  assert.deepEqual({frames: G4_R5.frameCount, frameDomain: G4_R5.frameDomain}, {frames: 128, frameDomain: 'sprite-23'});
  assert.deepEqual({frames: G5_R5.frameCount, frameDomain: G5_R5.frameDomain, scene: G5_R5.scene}, {frames: 419, frameDomain: 'sprite-341', scene: 'course-g05-l04-rw-002'});
});
