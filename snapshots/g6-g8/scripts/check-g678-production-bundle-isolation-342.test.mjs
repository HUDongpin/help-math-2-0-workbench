import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {parseArguments} from
  './check-g678-production-bundle-isolation-342.mjs';

test('342 production scanner keeps receipt checking bounded', () => {
  assert.deepEqual(parseArguments([
    '--next-root', 'apps/web/.next',
    '--output', 'output/final342-isolation.json',
    '--check',
  ]), {
    nextRoot: 'apps/web/.next',
    output: 'output/final342-isolation.json',
    check: true,
  });
  assert.throws(() => parseArguments(['--check', '--check']), /only once/u);
  assert.throws(() => parseArguments(['--output']), /usage/u);
});

test('342 production scanner derives exact local-only patterns and preserves downstream gates', async () => {
  const source = await readFile(new URL(
    './check-g678-production-bundle-isolation-342.mjs', import.meta.url),
  'utf8');
  assert.match(source, /forbiddenPatterns\(freeze\)/u);
  assert.match(source, /page\.animationId/u);
  assert.match(source, /page\.runtime\?\.canvasRenderer\?\.path/u);
  assert.match(source, /localOnlyG678MaterialAbsent: true/u);
  assert.match(source, /authoritativeOriginalRuntime: false/u);
  assert.match(source, /releaseEligible: false/u);
  assert.match(source, /published: false/u);
  assert.match(source, /production isolation receipt drifted/u);
});
