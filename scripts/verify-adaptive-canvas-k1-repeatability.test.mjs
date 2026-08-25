import assert from 'node:assert/strict';
import {test} from 'node:test';

import {summarizeK1RepeatabilityRows} from
  './verify-adaptive-canvas-k1-repeatability.mjs';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const C = 'c'.repeat(64);

test('repeatability summary separates baseline drift from candidate drift', () => {
  assert.deepEqual(summarizeK1RepeatabilityRows([
    {
      stateId: 'state-1',
      expectedK1RgbaSha256: A,
      freshV1RgbaSha256: A,
      candidateK1RgbaSha256: A,
      freshV1RenderStateSha256: B,
      candidateRenderStateSha256: B,
    },
    {
      stateId: 'state-2',
      expectedK1RgbaSha256: A,
      freshV1RgbaSha256: B,
      candidateK1RgbaSha256: B,
      freshV1RenderStateSha256: B,
      candidateRenderStateSha256: C,
    },
    {
      stateId: 'state-3',
      expectedK1RgbaSha256: A,
      freshV1RgbaSha256: A,
      candidateK1RgbaSha256: C,
      freshV1RenderStateSha256: B,
      candidateRenderStateSha256: B,
    },
  ]), {
    stateCount: 3,
    frozenBaselineMismatchCount: 1,
    directCandidateMismatchCount: 1,
    directRenderStateMismatchCount: 1,
  });
});
