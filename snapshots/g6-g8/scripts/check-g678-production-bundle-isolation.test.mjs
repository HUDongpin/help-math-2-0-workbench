import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {parseArguments} from './check-g678-production-bundle-isolation.mjs';

test('production scanner supports a bounded receipt check mode', () => {
  assert.deepEqual(parseArguments([
    '--output', 'output/receipt.json', '--check',
  ]), {nextRoot: 'apps/web/.next', output: 'output/receipt.json', check: true});
  assert.throws(() => parseArguments(['--check', '--check']),
    /only once/u);
});

test('production receipt binds scanner, freeze, pattern set, and stable reads', async () => {
  const source = await readFile(new URL(
    './check-g678-production-bundle-isolation.mjs', import.meta.url), 'utf8');
  assert.match(source, /scanner: scanner\.binding/u);
  assert.match(source, /freeze: freezeFile\.binding/u);
  assert.match(source, /forbiddenPatternSetSha256/u);
  assert.match(source, /production isolation receipt drifted/u);
  assert.match(source, /changed during read/u);
});
