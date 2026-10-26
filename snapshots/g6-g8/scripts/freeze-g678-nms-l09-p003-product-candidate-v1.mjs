#!/usr/bin/env node
// Prepare a hash-bound P003 product candidate; never install a registry entry.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, mkdirSync, readFileSync, realpathSync,
  writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID = 'shared-nms002-l09-p003';
const CALIBRATION = 'g678-nms-l09-p003-product-candidate-v1';
const RUN_ROOT = `work/g678-shared-page-factory/${CALIBRATION}`;
const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const SOURCE = 'G6-G8-shared/NMS002/L9/RW/L9RW03.swf';
const XML = 'G6-G8-shared/NMS002/L9/index.xml';
const MODULE = 'packages/demos/src/modules/g678-nms-l09-native-candidate-p003.tsx';
const TIMELINE = 'packages/demos/src/timelines/g678-nms-l09-p003.ts';
const RUNTIME = 'work/g678-shared-page-factory/g678-nms-l09-p003-native-candidate-v1/canvas-renderer.js';
const BINDING = 'work/g678-shared-page-factory/g678-nms-l09-p003-native-candidate-v1/binding.json';
const MANIFEST = 'work/g678-shared-page-factory/g678-nms-l09-p003-native-candidate-v1/manifest.json';
const CLOSURE = 'migrations/shared-nms002-l09-p003/audit/CANDIDATE_CLOSURE_V2.json';
const IR = 'migrations/shared-nms002-l09-p003/audit/ROOT_HELD_NESTED_DRAWING_V1.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const TEST = 'packages/demos/src/modules/g678-nms-l09-p003-private-candidate.test.tsx';
const THIS_SCRIPT = path.relative(ROOT, fileURLToPath(import.meta.url));
const SHA = bytes => createHash('sha256').update(bytes).digest('hex');
const absolute = value => path.isAbsolute(value) ? value : path.join(ROOT, value);

function pin(value) {
  const full = absolute(value);
  const before = lstatSync(full, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `P003 requires a single-link ordinary file: ${value}`);
  assert.equal(realpathSync(full), full, `P003 real path drift: ${value}`);
  const bytes = readFileSync(full);
  const after = lstatSync(full, {bigint: true});
  for (const field of ['dev', 'ino', 'size', 'mtimeNs', 'nlink']) {
    assert.equal(before[field], after[field], `P003 file changed during read: ${value}`);
  }
  return {path: path.isAbsolute(value) ? value : value,
    bytes: bytes.length, sha256: SHA(bytes)};
}

function put(value, object, check) {
  const bytes = Buffer.from(`${JSON.stringify(object, null, 2)}\n`);
  const full = absolute(value);
  if (check) assert.deepEqual(readFileSync(full), bytes,
    `P003 prepared candidate drift: ${value}`);
  else {
    mkdirSync(path.dirname(full), {recursive: true});
    writeFileSync(full, bytes, {flag: 'wx'});
  }
  const observed = pin(value);
  assert.equal(observed.sha256, SHA(bytes));
  return observed;
}

function uniquePins(values) {
  const byPath = new Map();
  for (const value of values) {
    const prior = byPath.get(value.path);
    if (prior) assert.deepEqual(prior, value);
    else byPath.set(value.path, value);
  }
  return [...byPath.values()].sort((left, right) =>
    left.path.localeCompare(right.path));
}

async function productGraph() {
  const result = await build({entryPoints: [MODULE], absWorkingDir: ROOT,
    bundle: true, platform: 'browser', format: 'esm', packages: 'external',
    loader: {'.css': 'empty'}, write: false, outdir: 'unused-output',
    metafile: true, logLevel: 'silent'});
  const paths = Object.keys(result.metafile.inputs).sort();
  assert(paths.length >= 6 && paths.every(value =>
    !path.isAbsolute(value) && !value.startsWith('..')),
  'P003 product source graph escaped worktree or is incomplete');
  return uniquePins(paths.map(pin));
}

function checkCandidate() {
  const env = {...process.env, HELP_MATH_G678_SOURCE_ROOT: SOURCE_ROOT};
  const checks = [
    [process.execPath, ['scripts/verify-g678-nms-l09-p003-candidate-closure-v2.mjs']],
    [path.join(ROOT, 'node_modules/.bin/tsx'), ['--test', TEST,
      'packages/demos/src/timelines/shared-nms002-l09-p003-source-clock.test.ts',
      'packages/demos/src/timelines/shared-nms002-l09-p003-source-text.test.ts',
      'packages/demos/src/timelines/shared-nms002-l09-p003-canvas-bridge.test.ts']],
  ];
  for (const [command, args] of checks) {
    const result = spawnSync(command, args, {cwd: ROOT, env,
      encoding: 'utf8', timeout: 120_000, maxBuffer: 1024 * 1024});
    assert.equal(result.status, 0,
      `P003 prerequisite failed: ${command} ${args.join(' ')}\n${result.stderr}`);
  }
}

export async function freezeP003ProductCandidate({check = false} = {}) {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT,
    'P003 requires the real AWS source root');
  assert.equal(realpathSync(SOURCE_ROOT), SOURCE_ROOT,
    'P003 source root must not be a symlink');
  if (!check) {
    assert(!existsSync(absolute(RUN_ROOT)) && !existsSync(absolute(FREEZE)),
      'P003 prepared candidate already exists; do not overwrite');
    const registry = JSON.parse(readFileSync(absolute(
      'packages/demos/private-current-js-registry.json'), 'utf8'));
    assert(!registry.calibrations.some(calibration => calibration.entries.some(
      entry => entry.key === ID)), 'P003 is already registered');
  }
  checkCandidate();
  const source = pin(path.join(SOURCE_ROOT, SOURCE));
  const xml = pin(path.join(SOURCE_ROOT, XML));
  assert.deepEqual([source.bytes, source.sha256], [473410,
    'd6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd']);
  assert.deepEqual([xml.bytes, xml.sha256], [13941,
    '29e77c35dfa9d8942bf453f377743c7548d15015d9e1d9333353366b6516c200']);
  const catalog = pin(CATALOG);
  const lesson = JSON.parse(readFileSync(absolute(CATALOG), 'utf8')).lessons.find(
    value => value.stableLessonKey === 'shared-nms002-l09');
  const page = lesson?.pages?.[2];
  assert(lesson.activePageCount === 53 && lesson.sourceXmlSha256 === xml.sha256 &&
    page.animationId === ID && page.globalOrdinal === 3 &&
    page.sectionCode === 'RW' && page.sectionPageOrdinal === 2 &&
    page.sourceSha256 === source.sha256 && page.assetId === `swf-${source.sha256}`,
  'P003 source-ordered catalog placement drift');
  const graph = await productGraph();
  const module = pin(MODULE), timeline = pin(TIMELINE), runtime = pin(RUNTIME);
  const closure = pin(CLOSURE), ir = pin(IR), script = pin(THIS_SCRIPT);
  const inputs = uniquePins([source, xml, catalog, closure, ir,
    pin(BINDING), pin(MANIFEST), pin(TEST), script, ...graph]);
  const outputs = uniquePins([module, timeline, runtime]);
  const boundary = Object.freeze({originalRuntime: false,
    fidelityAccepted: false, audioAcceptance: false, humanReview: false,
    ownerAcceptance: false, strictComplete: false, publication: false});
  const sourceSpec = put(`${RUN_ROOT}/source-spec.json`, {
    schemaVersion: 1, kind: 'g678-p003-product-candidate-source-spec-v1',
    animationId: ID, source, sourceXml: {...xml, path: XML}, sourceCatalog: catalog,
    compilerAssistedLane: 'advanced-manual-nested-root-canvas-native-text',
    laneReason: 'The calibrated terminal factory excludes a nested-sprite main domain; preserve the verified root drawing and maintained native text.',
    sourceClock: {stage: {width: 800, height: 600}, fps: 12,
      rootFrameCount: 10, rootBeginFrame: 6,
      frameDomain: 'sprite-246', frameCount: 635, terminalStopFrame: 635},
    generatorClosure: closure, sourceIr: ir, productSourceGraph: graph,
    claimBoundary: {registered: false, productHostVerified: false,
      scaleOutAuthorized: false, ...boundary},
  }, check);
  const sourceRun = put(`${RUN_ROOT}/run-manifest.json`, {
    schemaVersion: 1, kind: 'bounded-advanced-manual-p003-product-candidate-v1',
    generatedBy: script, source, sourceSpec, inputs, outputs,
    scaleOutAuthorized: false,
  }, check);
  const memberManifest = put(`${RUN_ROOT}/members/${ID}/member-manifest.json`, {
    schemaVersion: 1, animationId: ID, source, sourceSpec, sourceRun,
    inputs, outputs, claimBoundary: {registered: false,
      productHostVerified: false, ...boundary},
  }, check);
  const binding = {kind: 'maintained-dom-module-v1', module, timeline,
    memberManifest, sourceRun};
  const entry = {key: ID,
    module: './modules/g678-nms-l09-native-candidate-p003',
    maturity: 'private-current-js', complexityLane: 'behavior-heavy',
    artifacts: binding};
  const selected = {animationId: ID, sourceSha256: source.sha256,
    stableLessonKey: 'shared-nms002-l09', moduleCode: 'NMS002',
    lessonNumber: 9, globalPageOrdinal: 3, sectionCode: 'RW',
    sectionPageOrdinal: 2, implementationLane: 'advanced-manual',
    complexityLane: 'behavior-heavy',
    runtime: {stage: {width: 800, height: 600}, fps: 12,
      rootFrameCount: 10, rootBeginFrame: 6, frameDomain: 'sprite-246',
      frameCount: 635, language: 'fixed-en',
      scenario: 'source-static-frame', seed: '0', rendererBinding: binding},
    runtimeEvidenceBoundary: {runtimeKind: 'source-static-current-js-candidate',
      actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics: 'product-complete-state-reset-original-runtime-parity-not-established'}};
  const freeze = put(FREEZE, {schemaVersion: 1, calibrationId: CALIBRATION,
    deploymentScope: 'local-only', source, sourceXml: {...xml, path: XML},
    sourceCatalog: catalog, sourceSpec, selectedPages: [selected], entry,
    inputs: uniquePins([...inputs, sourceSpec]),
    outputs: uniquePins([...outputs, sourceRun, memberManifest]),
    productCalibrationPassed: false, scaleOutAuthorized: false,
    acceptanceEffects: boundary}, check);
  return {freeze, sourceRun, memberManifest, registered: false,
    productHostVerified: false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  freezeP003ProductCandidate({check: process.argv.includes('--check')})
    .then(value => process.stdout.write(`${JSON.stringify(value)}\n`))
    .catch(error => {process.stderr.write(`${error.stack ?? error}\n`);
      process.exitCode = 1;});
}
