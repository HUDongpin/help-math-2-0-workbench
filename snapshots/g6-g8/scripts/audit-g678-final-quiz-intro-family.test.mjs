import assert from 'node:assert/strict';
import test from 'node:test';

import {stableFfdecCommandReceipt} from
  './audit-g678-final-quiz-intro-family.mjs';

test('FQ01 command receipt excludes volatile FFDec progress text', () => {
  const first = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/staging-a/frame.as, 00:00.001\n'),
    stderr: Buffer.alloc(0)});
  const second = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/staging-b/frame.as, 00:00.987\n'),
    stderr: Buffer.alloc(0)});

  assert.deepEqual(first, second);
  assert.deepEqual(first.stdout, {
    captured: true,
    recorded: false,
    exclusionReason:
      'FFDec progress contains volatile staging paths, parallel completion order, and timings; exported scripts are hash-bound below.',
  });
});

test('FQ01 command receipt rejects failed or noisy exports', () => {
  assert.throws(() => stableFfdecCommandReceipt({code: 1, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('failed')}),
  /FFDec script export failed/u);
  assert.throws(() => stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('warning')}),
  /FFDec script export emitted stderr/u);
});
