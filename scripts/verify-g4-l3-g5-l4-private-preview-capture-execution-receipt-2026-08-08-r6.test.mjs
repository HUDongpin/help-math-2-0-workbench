import assert from 'node:assert/strict';
import test from 'node:test';

import {parseMode} from './verify-g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.mjs';

test('r6 receipt verifier requires one explicit read-only check mode', () => {
  assert.equal(parseMode(['--check']), 'check');
  assert.throws(() => parseMode([]), /exactly/u);
  assert.throws(() => parseMode(['--write']), /exactly/u);
});
