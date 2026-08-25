import assert from 'node:assert/strict';
import {test} from 'node:test';

import {summarizePerformanceRows} from
  './build-adaptive-canvas-real-browser-gate-review.mjs';

test('performance summary keeps lesson and failure classes separate', () => {
  assert.deepEqual(summarizePerformanceRows([
    {
      lessonId: 'g03-l02',
      singleRendererDurationPass: false,
      redrawP95Pass: true,
      firstReadyPass: true,
      longTaskCount: 0,
      contextLostCount: 0,
    },
    {
      lessonId: 'g05-l05',
      singleRendererDurationPass: true,
      redrawP95Pass: false,
      firstReadyPass: true,
      longTaskCount: 1,
      contextLostCount: 0,
    },
  ]), {
    runtimeCount: 2,
    byLesson: {
      'g03-l02': {
        runtimeCount: 1,
        singleRendererFailureCount: 1,
        redrawP95FailureCount: 0,
        firstReadyFailureCount: 0,
        longTaskRuntimeCount: 0,
        contextLostCount: 0,
      },
      'g04-l03': {
        runtimeCount: 0,
        singleRendererFailureCount: 0,
        redrawP95FailureCount: 0,
        firstReadyFailureCount: 0,
        longTaskRuntimeCount: 0,
        contextLostCount: 0,
      },
      'g05-l03': {
        runtimeCount: 0,
        singleRendererFailureCount: 0,
        redrawP95FailureCount: 0,
        firstReadyFailureCount: 0,
        longTaskRuntimeCount: 0,
        contextLostCount: 0,
      },
      'g05-l04': {
        runtimeCount: 0,
        singleRendererFailureCount: 0,
        redrawP95FailureCount: 0,
        firstReadyFailureCount: 0,
        longTaskRuntimeCount: 0,
        contextLostCount: 0,
      },
      'g05-l05': {
        runtimeCount: 1,
        singleRendererFailureCount: 0,
        redrawP95FailureCount: 1,
        firstReadyFailureCount: 0,
        longTaskRuntimeCount: 1,
        contextLostCount: 0,
      },
    },
  });
});
