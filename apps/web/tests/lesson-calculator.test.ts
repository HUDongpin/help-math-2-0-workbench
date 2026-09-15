import assert from 'node:assert/strict';
import test from 'node:test';

import {evaluateCalculator} from '../lib/lesson-calculator';

test('calculator arithmetic matches the four operators', () => {
  assert.deepEqual(evaluateCalculator('+', 5, 2), {ok: true, value: 7});
  assert.deepEqual(evaluateCalculator('-', 5, 2), {ok: true, value: 3});
  assert.deepEqual(evaluateCalculator('*', 5, 2), {ok: true, value: 10});
  assert.deepEqual(evaluateCalculator('/', 5, 2), {ok: true, value: 2.5});
});

test('calculator division by zero is undefined rather than the dividend', () => {
  assert.deepEqual(evaluateCalculator('/', 5, 0), {ok: false, display: 'undefined'});
});
