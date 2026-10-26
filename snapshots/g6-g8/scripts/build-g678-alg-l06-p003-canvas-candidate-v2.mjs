#!/usr/bin/env node
/** Exact-placement Canvas successor; preserves the v1 course-prefixed candidate. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCandidate} from './build-g678-alg-l06-p003-canvas-candidate-v1.mjs';

export function buildP003PlacementCandidate(sourceRoot) {
  const predecessor = buildCandidate(sourceRoot);
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha(predecessor.runtime), '12dd005081028a24f968036996b69baae98401e0d39ff6bdb221330a4062f487',
    'exact v1 drawing predecessor');
  const previousId = 'course-shared-alg001-l06-p003', nextId = 'shared-alg001-l06-p003';
  const spec = JSON.parse(predecessor.spec);
  assert.equal(spec.animationId, previousId);
  spec.animationId = nextId;
  const specBytes = Buffer.from(`${JSON.stringify(spec, null, 2)}\n`);
  const runtime = Buffer.from(predecessor.runtime.toString().replaceAll(previousId, nextId));
  const preview = Buffer.from(predecessor.preview.toString().replaceAll(previousId, nextId));
  assert.equal(sha(runtime), '87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c',
    'exact-placement-only Canvas successor');
  const manifest = JSON.parse(predecessor.manifest);
  for (const [name, bytes] of [['adapter-spec.json', specBytes], ['canvas-renderer.js', runtime], ['preview.html', preview]]) {
    const entry = manifest.outputs.find(item => item.name === name);
    assert(entry, `missing v1 output: ${name}`);
    entry.bytes = bytes.length;
    entry.sha256 = sha(bytes);
  }
  const built = {spec: specBytes, runtime, preview,
    manifest: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)};
  assert.equal(spec.animationId, spec.finalAnimationId);
  assert(built.runtime.includes(Buffer.from('registry["shared-alg001-l06-p003"]')));
  assert(!built.runtime.includes(Buffer.from('registry["course-shared-alg001-l06-p003"]')));
  return built;
}

function main() {
  const args = process.argv.slice(2), check = args.includes('--check');
  const normalized = args.filter(arg => arg !== '--check');
  assert(normalized.length === 2 && normalized[0] === '--output',
    'usage: script --output <existing-external-directory> [--check]');
  const output = path.resolve(normalized[1]);
  assert.equal(realpathSync(output), output);
  assert(output.startsWith('/Volumes/American Dream/hudongpin/') &&
    lstatSync(output).isDirectory() && !lstatSync(output).isSymbolicLink());
  const built = buildP003PlacementCandidate(process.env.HELP_MATH_G678_SOURCE_ROOT);
  const files = [['adapter-spec.json', built.spec], ['canvas-renderer.js', built.runtime],
    ['preview.html', built.preview], ['candidate-manifest.json', built.manifest]];
  for (const [name, bytes] of files) {
    const target = path.join(output, name);
    if (check) assert(readFileSync(target).equals(bytes), `${name} drifted`);
    else try {writeFileSync(target, bytes, {flag: 'wx'});}
    catch (error) {if (error.code !== 'EEXIST') throw error; assert(readFileSync(target).equals(bytes), `${name} drifted`);}
  }
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  console.log(JSON.stringify({status: check ? 'verified' : 'created', output,
    files: files.map(([name, bytes]) => ({name, bytes: bytes.length, sha256: sha(bytes)}))}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
