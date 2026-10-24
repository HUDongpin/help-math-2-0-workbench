import assert from 'node:assert/strict';
import test from 'node:test';

import {
  candidateQaNextEnvPostimage,
  isAllowedNextEnvPostimage,
  validateRunId,
} from './run-current-js-e2e.mjs';

const generic = Buffer.from([
  '/// <reference types="next" />',
  '/// <reference types="next/image-types/global" />',
  'import "./.next/types/routes.d.ts";',
  'import "./.next/types/root-params.d.ts";',
  '',
].join('\n'));

test('candidate-QA postimage is the exact two-import Next rewrite', () => {
  const candidate = candidateQaNextEnvPostimage(generic);
  assert.match(candidate.toString('utf8'), /\.next-current-js-candidate-qa\/dev\/types\/routes/u);
  assert.match(candidate.toString('utf8'), /\.next-current-js-candidate-qa\/dev\/types\/root-params/u);
  assert.equal(isAllowedNextEnvPostimage(generic, generic), true);
  assert.equal(isAllowedNextEnvPostimage(generic, candidate), true);
  assert.equal(
    isAllowedNextEnvPostimage(generic, Buffer.from('foreign rewrite\n')),
    false,
  );
});

test('runner rejects an already-drifted preimage and unsafe run IDs', () => {
  assert.throws(
    () => candidateQaNextEnvPostimage(Buffer.from('foreign rewrite\n')),
    /tracked generic Next type contract/u,
  );
  assert.equal(validateRunId('p0-e2e_01.2'), 'p0-e2e_01.2');
  assert.throws(() => validateRunId('../escape'), /must contain only/u);
});
