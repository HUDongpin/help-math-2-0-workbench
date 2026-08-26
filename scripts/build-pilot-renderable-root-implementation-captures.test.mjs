import assert from 'node:assert/strict';
import test from 'node:test';

import {buildReport} from './build-pilot-renderable-root-implementation-captures.mjs';

test('indexes every checked current-JavaScript root capture without promoting source authority', async () => {
  const report = await buildReport({generatedAt: '2026-07-22T00:00:00.000Z'});

  assert.equal(report.summary.requirementCount, 9);
  assert.equal(report.summary.completeRequirementCount, 9);
  assert.equal(report.summary.capturedFrameCount, 135);
  assert.equal(report.strictAcceptanceEffect, false);

  const gs = report.requirements.find(
    ({animationId, language}) =>
      animationId === 'course-g04-l09-gs-002' && language === 'en'
  );
  assert.ok(gs, 'GS002 English root capture must be indexed');
  assert.equal(gs.frameSet.capturedFrameCount, 10);
  assert.equal(gs.originalRuntimeAuthority, 'not-established-by-this-report');
  assert.deepEqual(
    {
      authority: gs.structuralSourceComparison.authority,
      originalRuntimeBaseline: gs.structuralSourceComparison.originalRuntimeBaseline,
      actionScriptExecuted: gs.structuralSourceComparison.actionScriptExecuted,
      naturalPlaybackClaimed: gs.structuralSourceComparison.naturalPlaybackClaimed,
      comparedFrameCount: gs.structuralSourceComparison.comparedFrameCount,
      maximumNormalizedRgbRmse: gs.structuralSourceComparison.maximumNormalizedRgbRmse,
      exactPixelMatchFrameCount: gs.structuralSourceComparison.exactPixelMatchFrameCount,
      strictAcceptanceEffect: gs.structuralSourceComparison.strictAcceptanceEffect
    },
    {
      authority:
        'hash-bound-ffdec-static-root-timeline-structural-render-not-original-runtime',
      originalRuntimeBaseline: false,
      actionScriptExecuted: false,
      naturalPlaybackClaimed: false,
      comparedFrameCount: 10,
      maximumNormalizedRgbRmse: 0,
      exactPixelMatchFrameCount: 10,
      strictAcceptanceEffect: false
    }
  );
});
