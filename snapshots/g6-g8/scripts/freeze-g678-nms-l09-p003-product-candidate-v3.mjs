#!/usr/bin/env node
// Immutable successor for the P003 multi-domain host-state repair.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, mkdirSync, readFileSync, realpathSync,
  writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID = 'shared-nms002-l09-p003';
const CALIBRATION = 'g678-nms-l09-p003-product-candidate-v3';
const RUN_ROOT = `work/g678-shared-page-factory/${CALIBRATION}`;
const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const PREDECESSOR = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l09-p003-product-candidate-v2.json',
  bytes: 10790,
  sha256: 'd03103047c41ca08e69e6b60c055c00cfef112d1eb2a8769b34f01967ba80e3f',
});
const MODULE = 'packages/demos/src/modules/g678-nms-l09-native-candidate-p003.tsx';
const TEST = 'packages/demos/src/modules/g678-nms-l09-p003-private-candidate.test.tsx';
const SCRIPT = path.relative(ROOT, fileURLToPath(import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const absolute = value => path.isAbsolute(value) ? value : path.join(ROOT, value);

function pin(value) {
  const full = absolute(value);
  const before = lstatSync(full, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `P003 v3 requires one ordinary file: ${value}`);
  assert.equal(realpathSync(full), full, `P003 v3 real-path drift: ${value}`);
  const bytes = readFileSync(full);
  const after = lstatSync(full, {bigint: true});
  for (const field of ['dev', 'ino', 'size', 'mtimeNs', 'nlink']) {
    assert.equal(before[field], after[field], `P003 v3 file changed: ${value}`);
  }
  return {path: value, bytes: bytes.length, sha256: sha256(bytes)};
}

function uniquePins(values) {
  const result = new Map();
  for (const value of values) {
    const earlier = result.get(value.path);
    if (earlier) assert.deepEqual(earlier, value);
    else result.set(value.path, value);
  }
  return [...result.values()].sort((left, right) =>
    left.path.localeCompare(right.path));
}

function put(value, object, check) {
  const bytes = Buffer.from(`${JSON.stringify(object, null, 2)}\n`);
  const full = absolute(value);
  if (check) assert.deepEqual(readFileSync(full), bytes,
    `P003 v3 frozen output drift: ${value}`);
  else {
    mkdirSync(path.dirname(full), {recursive: true});
    writeFileSync(full, bytes, {flag: 'wx'});
  }
  return pin(value);
}

function runChecks() {
  const env = {...process.env, HELP_MATH_G678_SOURCE_ROOT: SOURCE_ROOT};
  for (const [command, args] of [
    [process.execPath, ['scripts/verify-g678-nms-l09-p003-candidate-closure-v2.mjs']],
    [path.join(ROOT, 'node_modules/.bin/tsx'), ['--test', TEST,
      'packages/demos/src/timelines/shared-nms002-l09-p003-source-clock.test.ts',
      'packages/demos/src/timelines/shared-nms002-l09-p003-source-text.test.ts',
      'packages/demos/src/timelines/shared-nms002-l09-p003-canvas-bridge.test.ts']],
  ]) {
    const result = spawnSync(command, args, {cwd: ROOT, env,
      encoding: 'utf8', timeout: 120_000, maxBuffer: 1024 * 1024});
    assert.equal(result.status, 0,
      `P003 v3 prerequisite failed: ${command} ${args.join(' ')}\n${result.stderr}`);
  }
}

export function freezeP003ProductCandidateV3({check = false} = {}) {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT,
    'P003 v3 requires the real AWS source root');
  assert.equal(realpathSync(SOURCE_ROOT), SOURCE_ROOT,
    'P003 v3 source root is a symlink');
  if (!check) {
    assert(!existsSync(absolute(RUN_ROOT)) && !existsSync(absolute(FREEZE)),
      'P003 v3 is already frozen; do not overwrite');
    const registry = JSON.parse(readFileSync(absolute(
      'packages/demos/private-current-js-registry.json'), 'utf8'));
    const matches = registry.calibrations.filter(value => value.entries.some(
      entry => entry.key === ID));
    assert.equal(matches.length, 1);
    assert.equal(matches[0].calibrationId, 'g678-nms-l09-p003-product-candidate-v2');
    assert.equal(matches[0].freezeManifestSha256, PREDECESSOR.sha256);
  }
  runChecks();
  assert.deepEqual(pin(PREDECESSOR.path), PREDECESSOR);
  const previous = JSON.parse(readFileSync(absolute(PREDECESSOR.path), 'utf8'));
  assert.equal(previous.calibrationId, 'g678-nms-l09-p003-product-candidate-v2');
  assert.equal(previous.entry.key, ID);
  assert.equal(previous.productCalibrationPassed, false);
  assert.equal(previous.scaleOutAuthorized, false);
  assert(Object.values(previous.acceptanceEffects).every(value => value === false));
  const changed = new Set([MODULE, TEST]);
  for (const binding of previous.inputs) {
    if (!changed.has(binding.path)) assert.deepEqual(pin(binding.path), binding);
  }
  for (const binding of previous.outputs) {
    if (binding.path !== MODULE && !binding.path.includes(
      '/g678-nms-l09-p003-product-candidate-v2/')) {
      assert.deepEqual(pin(binding.path), binding);
    }
  }
  const source = previous.source;
  const xml = previous.sourceXml;
  assert.deepEqual(pin(source.path), source);
  assert.deepEqual(pin(path.join(SOURCE_ROOT, xml.path)),
    {...xml, path: path.join(SOURCE_ROOT, xml.path)});
  const module = pin(MODULE);
  const test = pin(TEST);
  assert.notEqual(module.sha256, previous.entry.artifacts.module.sha256,
    'P003 v3 must change the module');
  const timeline = previous.entry.artifacts.timeline;
  assert.deepEqual(pin(timeline.path), timeline);
  const runtime = previous.outputs.find(value => value.path.endsWith(
    '/g678-nms-l09-p003-native-candidate-v1/canvas-renderer.js'));
  assert(runtime);
  assert.deepEqual(pin(runtime.path), runtime);
  const inputs = uniquePins([PREDECESSOR, pin(SCRIPT), module, test,
    ...previous.inputs.filter(value => !changed.has(value.path))]);
  const outputs = uniquePins([module, timeline, runtime]);
  const boundary = {...previous.acceptanceEffects};
  const sourceSpec = put(`${RUN_ROOT}/source-spec.json`, {
    schemaVersion: 1, kind: 'g678-p003-product-candidate-source-spec-v3',
    predecessor: PREDECESSOR, animationId: ID, source, sourceXml: xml,
    sourceCatalog: previous.sourceCatalog,
    repair: 'Expose exact frameDomain, scenario and language in the pure frame state for the multi-domain My Lesson guard.',
    module, test, timeline, runtime,
    claimBoundary: {registered: false, productHostVerified: false,
      scaleOutAuthorized: false, ...boundary},
  }, check);
  const sourceRun = put(`${RUN_ROOT}/run-manifest.json`, {
    schemaVersion: 1, kind: 'bounded-advanced-manual-p003-product-candidate-v3',
    generatedBy: pin(SCRIPT), predecessor: PREDECESSOR,
    source, sourceSpec, inputs, outputs, scaleOutAuthorized: false,
  }, check);
  const memberManifest = put(`${RUN_ROOT}/members/${ID}/member-manifest.json`, {
    schemaVersion: 1, animationId: ID, predecessor: PREDECESSOR,
    source, sourceSpec, sourceRun, inputs, outputs,
    claimBoundary: {registered: false, productHostVerified: false, ...boundary},
  }, check);
  const artifacts = {kind: 'maintained-dom-module-v1', module,
    timeline, memberManifest, sourceRun};
  const selected = {...previous.selectedPages[0], runtime: {
    ...previous.selectedPages[0].runtime, rendererBinding: artifacts}};
  const entry = {...previous.entry, artifacts};
  const freeze = put(FREEZE, {
    schemaVersion: 1, calibrationId: CALIBRATION, deploymentScope: 'local-only',
    predecessor: PREDECESSOR, source, sourceXml: xml,
    sourceCatalog: previous.sourceCatalog, sourceSpec,
    selectedPages: [selected], entry,
    inputs: uniquePins([...inputs, sourceSpec]),
    outputs: uniquePins([...outputs, sourceRun, memberManifest]),
    productCalibrationPassed: false, scaleOutAuthorized: false,
    acceptanceEffects: boundary,
  }, check);
  return {freeze, sourceRun, memberManifest,
    registered: false, productHostVerified: false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${JSON.stringify(freezeP003ProductCandidateV3({
      check: process.argv.includes('--check'),
    }))}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  }
}
