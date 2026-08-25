import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
  captureBackingDimensions,
  parseArguments,
  percentile95,
  rmseLimit,
  summarizeStateRows,
} from './verify-adaptive-canvas-v10-core-browser.mjs';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const HASH_C = 'c'.repeat(64);

function row(overrides = {}) {
  return {
    stateId: 'state-1',
    expectedK1RgbaSha256: HASH_A,
    adaptiveK1RgbaSha256: HASH_A,
    adaptiveK2RgbaSha256: HASH_B,
    downsampledK2RgbaSha256: HASH_C,
    normalizedRgbRmse: 0.01,
    k2RenderDurationMs: 4,
    k1Parity: true,
    fidelityPass: true,
    renderStateParity: true,
    ...overrides,
  };
}

test('p95 and RMSE limits implement the fixed performance/fidelity contract', () => {
  assert.equal(percentile95([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), 12);
  assert.equal(rmseLimit('static'), 0.05);
  assert.equal(rmseLimit('transition'), 0.08);
  assert.throws(() => rmseLimit('unknown'), /unsupported threshold/u);
});

test('state capture resets the exact approved backing before every render', () => {
  assert.deepEqual(captureBackingDimensions(1), {width: 800, height: 600});
  assert.deepEqual(captureBackingDimensions(2), {width: 1600, height: 1200});
  assert.throws(() => captureBackingDimensions(3), /unsupported capture/u);
});

test('state summaries count parity, fidelity, and render-state failures', () => {
  assert.deepEqual(summarizeStateRows([
    row(),
    row({
      stateId: 'state-2',
      adaptiveK1RgbaSha256: HASH_C,
      adaptiveK2RgbaSha256: HASH_C,
      normalizedRgbRmse: 0.09,
      k2RenderDurationMs: 251,
      k1Parity: false,
      fidelityPass: false,
      renderStateParity: false,
    }),
  ]), {
    stateCount: 2,
    uniquePixelComparisonCount: 2,
    k1ParityFailureCount: 1,
    fidelityFailureCount: 1,
    renderStateFailureCount: 1,
    maximumNormalizedRgbRmse: 0.09,
    maximumK2RenderDurationMs: 251,
  });
});

test('CLI requires one explicit bounded mode and lesson', () => {
  assert.deepEqual(parseArguments(['--plan']), {mode: 'plan', lessonId: null});
  assert.deepEqual(parseArguments(['--execute', '--lesson', 'g04-l03']), {
    mode: 'execute',
    lessonId: 'g04-l03',
  });
  assert.throws(() => parseArguments([]), /explicit mode/u);
  assert.throws(
    () => parseArguments(['--execute', '--lesson', 'g04-l10']),
    /must be one of/u,
  );
  assert.throws(
    () => parseArguments(['--plan', '--lesson', 'g04-l03']),
    /only valid/u,
  );
});
