#!/usr/bin/env node
// Source-locked, unregistered P001 candidate. Never overwrite an existing run.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID = 'shared-alg001-l06-p001';
const CALIBRATION = 'g678-alg-l06-p001-source-title-candidate-v1';
const RUN = `work/g678-shared-page-factory/${CALIBRATION}`;
const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const SWF = 'G6-G8-shared/ALG001/L6/IR/L6IR01.swf';
const XML = 'G6-G8-shared/ALG001/L6/index.xml';
const MODULE = 'packages/demos/src/modules/g678-alg-l06-source-title-p001.tsx';
const TIMELINE = 'packages/demos/src/alg-l06-p001-title-state.ts';
const SCRIPT = path.relative(ROOT, fileURLToPath(import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const absolute = value => path.isAbsolute(value) ? value : path.join(ROOT, value);

function pin(value) {
  const full = absolute(value), before = lstatSync(full, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n &&
    realpathSync(full) === full, `P001 requires an ordinary physical file: ${value}`);
  const bytes = readFileSync(full), after = lstatSync(full, {bigint: true});
  for (const field of ['dev', 'ino', 'size', 'mtimeNs', 'nlink']) {
    assert.equal(before[field], after[field], `P001 input changed during read: ${value}`);
  }
  return {path: value, bytes: bytes.length, sha256: digest(bytes)};
}

function put(value, object, check) {
  const bytes = Buffer.from(`${JSON.stringify(object, null, 2)}\n`), full = absolute(value);
  if (check) assert.deepEqual(readFileSync(full), bytes, `P001 output drift: ${value}`);
  else {
    mkdirSync(path.dirname(full), {recursive: true});
    writeFileSync(full, bytes, {flag: 'wx'});
  }
  return pin(value);
}

function unique(values) {
  const byPath = new Map();
  for (const value of values) {
    if (byPath.has(value.path)) assert.deepEqual(byPath.get(value.path), value);
    byPath.set(value.path, value);
  }
  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function checks() {
  const tests = [
    'packages/demos/tests/alg-l06-p001-module.test.tsx',
    'packages/demos/tests/alg-l06-p001-title-state.test.ts',
    'packages/demos/tests/alg-l06-p001-title-view.test.tsx',
    'apps/web/tests/g678-alg-l06-p001-local-route.test.mjs',
  ];
  const result = spawnSync(path.join(ROOT, 'node_modules/.bin/tsx'),
    ['--test', ...tests], {cwd: ROOT, encoding: 'utf8', timeout: 120_000,
      env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: SOURCE_ROOT},
      maxBuffer: 1024 * 1024});
  assert.equal(result.status, 0, `P001 candidate checks failed: ${result.stderr}`);
}

export function freezeP001SourceTitle({check = false} = {}) {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT,
    'P001 requires the real AWS source root');
  assert(realpathSync(SOURCE_ROOT) === SOURCE_ROOT &&
    !lstatSync(SOURCE_ROOT).isSymbolicLink(), 'P001 source root is a symlink');
  if (!check) {
    assert(!existsSync(absolute(RUN)) && !existsSync(absolute(FREEZE)),
      'P001 candidate already exists; do not overwrite');
    const registry = JSON.parse(readFileSync(absolute(
      'packages/demos/private-current-js-registry.json'), 'utf8'));
    assert(!registry.calibrations.some(value => value.entries.some(entry => entry.key === ID)),
      'P001 is already registered');
  }
  checks();
  const source = pin(path.join(SOURCE_ROOT, SWF));
  const sourceXml = pin(path.join(SOURCE_ROOT, XML));
  assert.deepEqual([source.bytes, source.sha256], [72330,
    '9daa5ffe3a1ea275d9467eadafc7addbbb26d14ad1c289e84b3f66f6b0ab9d35']);
  assert.equal(sourceXml.sha256,
    '9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c');
  const catalog = pin('catalog/g678-shared-catalog.v1.json');
  const lesson = JSON.parse(readFileSync(absolute(catalog.path), 'utf8')).lessons
    .find(value => value.stableLessonKey === 'shared-alg001-l06');
  const page = lesson?.pages?.[0];
  assert(lesson.activePageCount === 60 && lesson.sourceXmlSha256 === sourceXml.sha256 &&
    page.animationId === ID && page.globalOrdinal === 1 && page.sectionCode === 'IR' &&
    page.sectionPageOrdinal === 1 && page.sourceSha256 === source.sha256 &&
    page.assetId === `swf-${source.sha256}`, 'P001 source-ordered placement drift');
  const sourceInputs = [
    'migrations/shared-alg001-l06-p001/migration.json',
    'migrations/shared-alg001-l06-p001/audit/title-timeline-v1.json',
    'migrations/shared-alg001-l06-p001/asset-inventory.csv',
    'migrations/shared-alg001-l06-p001/audio-inventory.csv',
    'migrations/shared-alg001-l06-p001/assets/title-svg/140.svg',
    'migrations/shared-alg001-l06-p001/assets/title-svg/141.svg',
    'migrations/shared-alg001-l06-p001/assets/source-stream-142.mp3',
    'packages/demos/src/alg-l06-p001-title-data-v1.ts',
    'packages/demos/src/alg-l06-p001-glyph-paths.ts',
    TIMELINE, 'packages/demos/src/alg-l06-p001-title-view.tsx', MODULE,
    'apps/web/lib/g678-alg-l06-p001-glyph-access.ts',
    'apps/web/lib/g678-alg-l06-p001-glyph-response.server.ts',
    'apps/web/lib/g678-alg-l06-p001-local-assets.server.ts',
    'apps/web/app/flash-assets/g678-local/shared-alg001-l06-p001/title-glyph/[id]/route.ts',
    ...[
      'packages/demos/tests/alg-l06-p001-module.test.tsx',
      'packages/demos/tests/alg-l06-p001-title-state.test.ts',
      'packages/demos/tests/alg-l06-p001-title-view.test.tsx',
      'apps/web/tests/g678-alg-l06-p001-local-route.test.mjs',
    ],
  ];
  const inputs = unique([source, sourceXml, catalog, pin(SCRIPT),
    ...sourceInputs.map(pin)]);
  const module = pin(MODULE), timeline = pin(TIMELINE);
  const outputs = unique([module, timeline,
    pin('packages/demos/src/alg-l06-p001-title-view.tsx'),
    pin('packages/demos/src/alg-l06-p001-title-data-v1.ts'),
    pin('packages/demos/src/alg-l06-p001-glyph-paths.ts')]);
  const boundary = {originalRuntime: false, fidelityAccepted: false,
    audioAcceptance: false, humanReview: false, ownerAcceptance: false,
    strictComplete: false, publication: false};
  const sourceSpec = put(`${RUN}/source-spec.json`, {
    schemaVersion: 1, animationId: ID, source,
    sourceXml: {...sourceXml, path: XML}, sourceCatalog: catalog,
    lane: 'advanced-manual-nested-stream-title',
    laneReason: 'A nested 134-frame source title and embedded stream are outside the calibrated silent linear factory.',
    sourceClock: {stage: {width: 800, height: 600}, fps: 12,
      rootFrameCount: 10, rootEntryFrame: 6, frameDomain: 'sprite-142', frameCount: 134},
    claimBoundary: {registered: false, productHostVerified: false,
      scaleOutAuthorized: false, ...boundary},
  }, check);
  const sourceRun = put(`${RUN}/run-manifest.json`, {
    schemaVersion: 1, kind: 'bounded-advanced-manual-p001-source-title-v1',
    generatedBy: pin(SCRIPT), source, sourceSpec, inputs, outputs,
    scaleOutAuthorized: false,
  }, check);
  const memberManifest = put(`${RUN}/members/${ID}/member-manifest.json`, {
    schemaVersion: 1, animationId: ID, source, sourceSpec, sourceRun,
    inputs, outputs, claimBoundary: {registered: false,
      productHostVerified: false, ...boundary},
  }, check);
  const artifacts = {kind: 'maintained-dom-module-v1', module, timeline,
    memberManifest, sourceRun};
  const entry = {key: ID, module: './modules/g678-alg-l06-source-title-p001',
    maturity: 'private-current-js', complexityLane: 'behavior-heavy', artifacts};
  const selectedPages = [{animationId: ID, sourceSha256: source.sha256,
    stableLessonKey: 'shared-alg001-l06', moduleCode: 'ALG001',
    lessonNumber: 6, globalPageOrdinal: 1, sectionCode: 'IR',
    sectionPageOrdinal: 1, implementationLane: 'advanced-manual',
    complexityLane: 'behavior-heavy',
    runtime: {stage: {width: 800, height: 600}, fps: 12,
      rootFrameCount: 10, rootEntryFrame: 6, frameDomain: 'sprite-142',
      frameCount: 134, language: 'fixed-en', scenario: 'source-static-frame',
      seed: '0', rendererBinding: artifacts},
    runtimeEvidenceBoundary: {runtimeKind: 'source-static-current-js-candidate',
      actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics: 'renderer-restart-only-source-behavior-not-established'}}];
  const freeze = put(FREEZE, {schemaVersion: 1, calibrationId: CALIBRATION,
    deploymentScope: 'local-only', source, sourceXml: {...sourceXml, path: XML},
    sourceCatalog: catalog, sourceSpec, selectedPages, entry,
    inputs: unique([...inputs, sourceSpec]),
    outputs: unique([...outputs, sourceRun, memberManifest]),
    productCalibrationPassed: false, scaleOutAuthorized: false,
    acceptanceEffects: boundary}, check);
  return {freeze, memberManifest, sourceRun, registered: false,
    productHostVerified: false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {process.stdout.write(`${JSON.stringify(freezeP001SourceTitle({
    check: process.argv.includes('--check'),
  }))}\n`);} catch (error) {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  }
}
