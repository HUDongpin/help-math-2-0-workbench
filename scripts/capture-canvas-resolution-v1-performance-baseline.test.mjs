import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalize,
  parseArguments,
} from './capture-canvas-resolution-v1-performance-baseline.mjs';

test('performance baseline CLI is explicit and has no apply/deploy mode', () => {
  assert.deepEqual(parseArguments(['--plan']), {mode: 'plan', lessonId: null});
  assert.deepEqual(parseArguments(['--check-plan']), {
    mode: 'check-plan', lessonId: null,
  });
  assert.deepEqual(parseArguments(['--execute', '--lesson', 'g04-l03']), {
    mode: 'execute', lessonId: 'g04-l03',
  });
  assert.deepEqual(parseArguments(['--font']), {mode: 'font', lessonId: null});
  assert.deepEqual(parseArguments(['--aggregate']), {
    mode: 'aggregate', lessonId: null,
  });
  for (const argv of [
    [], ['--apply'], ['--deploy'], ['--execute'],
    ['--font', '--lesson', 'g04-l03'], ['--execute', '--lesson', 'g04-l05'],
  ]) assert.throws(() => parseArguments(argv));
});

test('canonicalize recursively sorts object keys without reordering arrays', () => {
  assert.deepEqual(canonicalize({z: 1, a: [{d: 4, c: 3}]}), {
    a: [{c: 3, d: 4}],
    z: 1,
  });
});
