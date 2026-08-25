import assert from 'node:assert/strict';
import test from 'node:test';

import {
  type CanvasPerformanceTarget,
  validatePerformanceBaselineCoverage,
} from '../e2e/canvas-resolution-performance-contract';

function renderer(index: number): CanvasPerformanceTarget {
  return {
    animationId: `course-g03-l02-test-${String(index).padStart(3, '0')}`,
    grade: 3,
    lesson: 2,
    ordinal: index + 1,
    placementId: `g03-l02-placement-${String(index + 1).padStart(3, '0')}`,
    sourceFps: 12,
    v1FirstReadyMs: 100 + index,
  };
}

function fixture() {
  const renderers = Array.from({length: 283}, (_, index) => renderer(index));
  const requiredPilotIds = renderers.slice(0, 12)
    .map(({animationId}) => animationId);
  return {
    profileRendererIds: renderers.map(({animationId}) => animationId),
    renderers,
    pilots: renderers.slice(0, 12).map((row) => ({...row})),
    requiredPilotIds,
  };
}

test('performance baseline contract requires exact 283 renderer and fixed pilot sets', () => {
  assert.deepEqual(validatePerformanceBaselineCoverage(fixture()), {
    rendererCount: 283,
    pilotCount: 12,
  });
});

test('performance baseline contract rejects missing, duplicate, and extra renderer IDs', () => {
  const missing = fixture();
  assert.throws(() => validatePerformanceBaselineCoverage({
    ...missing,
    renderers: missing.renderers.slice(0, -1),
  }), /exactly 283 renderers/u);

  const duplicate = fixture();
  duplicate.renderers[282] = {...duplicate.renderers[0]!};
  assert.throws(() => validatePerformanceBaselineCoverage(duplicate),
    /appears twice/u);

  const drift = fixture();
  drift.profileRendererIds[282] = 'course-g05-l05-unexpected-999';
  assert.throws(() => validatePerformanceBaselineCoverage(drift),
    /differs from v2 profile/u);
});

test('performance baseline contract rejects pilot omissions and row drift', () => {
  const missing = fixture();
  assert.throws(() => validatePerformanceBaselineCoverage({
    ...missing,
    pilots: missing.pilots.slice(0, -1),
  }), /pilot baseline count/u);

  const drift = fixture();
  drift.pilots[0] = {...drift.pilots[0]!, sourceFps: 24};
  assert.throws(() => validatePerformanceBaselineCoverage(drift),
    /differs from its full baseline row/u);
});

test('performance baseline contract rejects invalid performance measurements', () => {
  const invalidFps = fixture();
  invalidFps.renderers[20] = {
    ...invalidFps.renderers[20]!,
    sourceFps: 0,
  };
  assert.throws(() => validatePerformanceBaselineCoverage(invalidFps),
    /sourceFps is invalid/u);

  const invalidReady = fixture();
  invalidReady.renderers[20] = {
    ...invalidReady.renderers[20]!,
    v1FirstReadyMs: Number.NaN,
  };
  assert.throws(() => validatePerformanceBaselineCoverage(invalidReady),
    /v1FirstReadyMs is invalid/u);
});
