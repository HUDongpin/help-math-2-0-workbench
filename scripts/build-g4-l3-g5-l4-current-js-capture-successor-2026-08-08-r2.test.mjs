import assert from 'node:assert/strict';
import test from 'node:test';

import {parseMode} from './build-g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.mjs';

test('r2 successor requires an explicit no-clobber mode', () => {
  assert.equal(parseMode(['--json']), 'json');
  assert.equal(parseMode(['--check']), 'check');
  assert.equal(parseMode(['--write-no-clobber']), 'write-no-clobber');
  assert.throws(() => parseMode([]), /exactly/u);
  assert.throws(() => parseMode(['--write']), /exactly/u);
});
