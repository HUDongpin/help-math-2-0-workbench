import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {pinFile} from '../lib/g678-admission-proof.mjs';
import {buildFrozenRuntimeExport, extractFrozenRuntime, P012_FROZEN_SOURCE,
  P012_RUNTIME_EXPORT} from './build-g678-frozen-runtime-export.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceText = fs.readFileSync(path.join(ROOT, P012_FROZEN_SOURCE.path), 'utf8');

test('generated export contains the exact frozen function text with only an export prefix', () => {
  const sourceBefore = pinFile(ROOT, P012_FROZEN_SOURCE.path);
  const plan = buildFrozenRuntimeExport({root: ROOT});
  const extracted = extractFrozenRuntime(sourceText);
  const generated = plan.output.bytes.toString('utf8');
  assert.deepEqual(plan.sourcePin, sourceBefore);
  assert.equal(plan.output.path, P012_RUNTIME_EXPORT);
  assert(generated.includes(`export ${extracted.runtimeText}\n`));
  assert.equal(generated.split('export function P012Runtime(').length, 2);
  assert(generated.includes(`Source SHA-256: ${sourceBefore.sha256}`));
  assert.deepEqual(pinFile(ROOT, P012_FROZEN_SOURCE.path), sourceBefore);
});

test('proof-bound export rejects an expected source pin different from the frozen proof', () => {
  assert.throws(() => buildFrozenRuntimeExport({root: ROOT,
    expectedSourcePin: {...P012_FROZEN_SOURCE, sha256: '0'.repeat(64)}}),
  /caller expected the frozen source pin/);
});

test('bounded AST extraction rejects missing or multiple P012Runtime declarations', () => {
  assert.throws(() => extractFrozenRuntime(sourceText.replace('function P012Runtime(', 'function DifferentRuntime(')),
    /one top-level P012Runtime/);
  assert.throws(() => extractFrozenRuntime(`${sourceText}\nfunction P012Runtime() {}`),
    /one top-level P012Runtime/);
});
