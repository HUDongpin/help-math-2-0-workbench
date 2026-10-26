import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  pureLinearPayloadInventoryProjection,
} from './build-g678-pure-linear-current-js-scaleout.mjs';

const EMPTY_SHA =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

test('payload inventory excludes only the two control files and detects drift', () => {
  const files = [
    {path: 'members/a/canvas-renderer.js', bytes: 1,
      sha256: '1'.repeat(64), mode: 0o444},
    {path: 'output-inventory.json', bytes: 2,
      sha256: '2'.repeat(64), mode: 0o444},
    {path: 'run-manifest.json', bytes: 3,
      sha256: '3'.repeat(64), mode: 0o444},
    {path: 'sources/a/source.swf', bytes: 4,
      sha256: EMPTY_SHA, mode: 0o444},
  ];
  const expected = pureLinearPayloadInventoryProjection(files);
  assert.equal(expected.fileCount, 2);
  assert.equal(expected.totalBytes, 5);
  assert.deepEqual(expected.files.map(({path}) => path), [
    'members/a/canvas-renderer.js',
    'sources/a/source.swf',
  ]);
  const drifted = pureLinearPayloadInventoryProjection(files.map((file) =>
    file.path === 'sources/a/source.swf'
      ? {...file, sha256: '4'.repeat(64)}
      : file));
  assert.notEqual(drifted.checksumSetSha256, expected.checksumSetSha256);
});

test('checker rebuilds every runtime from raw frames, helper, XML, and spec', async () => {
  const source = await readFile(new URL(
    './build-g678-pure-linear-current-js-scaleout.mjs', import.meta.url),
  'utf8');
  assert.match(source, /pure-linear output inventory does not match the frozen run payload/u);
  assert.match(source, /const rebuilt = buildSafeRuntime\(\{/u);
  assert.match(source, /runtime is not reproducible from raw evidence/u);
  assert.match(source, /const target = parseRootTarget\(xmlText, member\.animationId\)/u);
  assert.match(source, /const metadata = deriveMetadata\(frames\.buffer\.toString/u);
  assert.match(source, /specBinding\.buffer\.equals\(specBytes\)/u);
  assert.match(source, /pure-linear toolchain changed during extraction/u);
  assert.match(source, /verifyToolchain\(context\.ffdec\.identity\)/u);
  assert.match(source, /verifySwfmill\(\)/u);
  assert.match(source, /pure-linear authority chain or scale-out policy drifted/u);
  assert.match(source, /await verifyFrozenTree\(projectPath\(OUTPUT_ROOT\)\)/u);
  assert.match(source, /currentExternalSources = await mapConcurrent\(context\.records/u);
  assert.match(source, /member\/runtime declaration drifted/u);
  assert.match(source, /pure-linear run acceptance boundary drifted/u);
});
