#!/usr/bin/env node
// Package the frozen, external P003 generator result for a local-only host.
// Never mutate the source SWF or hand-edit the generated JavaScript.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_PATH = 'G6-G8-shared/NMS002/L9/RW/L9RW03.swf';
const SOURCE_SHA = 'd6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd';
const CANDIDATE = '/Volumes/American Dream/hudongpin/g678-p003-text-variant-20260923-v5';
const RUNTIME_SHA = 'c03538f5fc07a5697a549f911b15c0aac1c7e4c8da62819188141bba001bad27';
const RUNTIME_BYTES = 8910358;
const TARGET = path.join(ROOT, 'work/g678-shared-page-factory/g678-nms-l09-p003-native-candidate-v1/canvas-renderer.js');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function verifyFrozenFile(target, bytes) {
  const metadata = await lstat(target);
  assert(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `P003 frozen file must be an ordinary single-link file: ${path.basename(target)}`);
  assert((await readFile(target)).equals(bytes),
    `P003 frozen file collision: ${path.basename(target)}`);
}

async function writeFrozenFile(target, bytes) {
  try {await writeFile(target, bytes, {flag: 'wx'});}
  catch (error) {if (error.code !== 'EEXIST') throw error;}
  await verifyFrozenFile(target, bytes);
}

export async function prepareP003LocalRuntime({check = false} = {}) {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT,
    'P003 requires the real AWS source root');
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT,
    'P003 source root must not be a symlink');
  const source = await readFile(path.join(SOURCE_ROOT, SOURCE_PATH));
  assert.equal(digest(source), SOURCE_SHA, 'P003 source SWF drift');
  const [runtime, binding, manifestBytes, generator] = await Promise.all([
    readFile(path.join(CANDIDATE, 'canvas-renderer-with-text.js')),
    readFile(path.join(CANDIDATE, 'binding.json')),
    readFile(path.join(CANDIDATE, 'manifest.json')),
    readFile(path.join(ROOT, 'scripts/build-g678-nms-l09-p003-text-variant-v1.mts')),
  ]);
  const manifest = JSON.parse(manifestBytes.toString());
  const bound = JSON.parse(binding.toString());
  assert.equal(runtime.length, RUNTIME_BYTES);
  assert.equal(digest(runtime), RUNTIME_SHA, 'P003 generated runtime drift');
  assert.equal(manifest.kind, 'g678-p003-unregistered-exact-text-suppression-candidate-v1');
  assert.equal(manifest.sourceSwfSha256, SOURCE_SHA);
  assert.equal(manifest.output.bytes, RUNTIME_BYTES);
  assert.equal(manifest.output.sha256, RUNTIME_SHA);
  assert.equal(manifest.bindingSha256, digest(binding));
  assert.equal(manifest.generatorSha256, digest(generator));
  assert.equal(bound.sourceSwfSha256, SOURCE_SHA);
  assert.equal(bound.blocks.length, 15);
  assert.equal(manifest.boundInstances.length, 15);
  assert.equal(manifest.boundEmphasisShapeInstances.length, 6);
  assert.equal(manifest.claimBoundary.localOnly, true);
  assert.equal(manifest.claimBoundary.registered, false);
  if (!check) {
    await mkdir(path.dirname(TARGET), {recursive: true});
    assert.equal(await realpath(path.dirname(TARGET)), path.dirname(TARGET),
      'P003 target directory must not be a symlink');
    await writeFrozenFile(TARGET, runtime);
    await writeFrozenFile(path.join(path.dirname(TARGET), 'binding.json'), binding);
    await writeFrozenFile(path.join(path.dirname(TARGET), 'manifest.json'), manifestBytes);
  }
  await verifyFrozenFile(TARGET, runtime);
  await verifyFrozenFile(path.join(path.dirname(TARGET), 'binding.json'), binding);
  await verifyFrozenFile(path.join(path.dirname(TARGET), 'manifest.json'), manifestBytes);
  return Object.freeze({path: path.relative(ROOT, TARGET), bytes: RUNTIME_BYTES,
    sha256: RUNTIME_SHA, sourceSwfSha256: SOURCE_SHA, localOnly: true});
}

if (process.argv[1] && path.resolve(process.argv[1]) ===
  fileURLToPath(import.meta.url)) {
  prepareP003LocalRuntime({check: process.argv.includes('--check')})
    .then(result => process.stdout.write(JSON.stringify(result) + '\n'))
    .catch(error => {process.stderr.write(`${error.stack ?? error}\n`);
      process.exitCode = 1;});
}
