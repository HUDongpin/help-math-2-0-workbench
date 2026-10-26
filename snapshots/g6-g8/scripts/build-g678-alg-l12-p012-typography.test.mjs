import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {prepareP012Typography} from './build-g678-alg-l12-p012-typography.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'migrations/shared-alg001-l12-p012/typography-v1');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('P012 typography regenerates exactly from frozen source evidence', async () => {
  const {files, runtimeMeta, specs} = await prepareP012Typography();
  for (const [name, expected] of files) {
    const actual = await readFile(path.join(output, name));
    assert.equal(actual.toString(), expected, `${name} differs from generated content`);
  }
  assert.equal(runtimeMeta.runtimeSha256, sha(files.get('renderer.js')));
  assert.equal(runtimeMeta.runtimeBytes, Buffer.byteLength(files.get('renderer.js')));
  assert.equal(runtimeMeta.sourceSha256,
    'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa');
  assert.equal(runtimeMeta.renderScale, 2);
  assert.equal(specs.length, 60);
});

test('P012 suppression is limited to proved teaching text and two classified vectors', async () => {
  const {specs, files} = await prepareP012Typography();
  const byId = new Map(specs.map(spec => [spec.instanceId, spec]));
  assert.equal(byId.get('root/depth-1/generation-1')?.sourceFunction, 'shape1');
  assert.equal(byId.get('sprite-86/depth-2/generation-1')?.sourceFunction, 'shape50');
  assert.equal(byId.get('sprite-61/depth-2/generation-1')?.sourceFunction, 'text34');
  assert.equal(byId.get('button-71/record-4')?.sourceFunction, 'text66');
  assert.equal(new Set(specs.map(spec => spec.instanceId)).size, specs.length);
  assert(specs.every(spec => ['static-text','dynamic-text','button-state-text',
    'outlined-English-title','instruction-underline'].includes(spec.kind)));
  assert(specs.every(spec => ![49,52,54,56,47,48].includes(spec.characterId)));
  const script = files.get('renderer.js');
  assert.match(script, /HELP_MATH_P012_TYPOGRAPHY=Object\.freeze/);
  assert.match(script, /unfulfilledSuppressionIds/);
  assert.match(script, /sprite32:Object\.freeze/);
});
