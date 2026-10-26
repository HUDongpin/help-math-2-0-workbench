import assert from 'node:assert/strict';
import {readFile, lstat} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  buildAdvanced3ModuleSource,
  buildAdvanced3TimelineSource,
  runAdvanced3TrancheDCurrentJs,
  validateAdvanced3GeneratorInputs,
} from './build-g678-alg-l11-advanced3-tranche-d-current-js.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = 'g678-alg-l11-advanced3-tranche-d';
const AUDIT_PATH = path.join(ROOT, `catalog/${PREFIX}-audit-v1.json`);
const STATE_PATH = path.join(ROOT, `packages/demos/src/${PREFIX}-state.ts`);
const CANDIDATE_PATH = path.join(ROOT,
  `packages/demos/src/${PREFIX}-candidates.tsx`);
const FRAGMENT_PATH = path.join(ROOT,
  `catalog/product-bridge-calibrations/${PREFIX}-current-js-v1.fragment.json`);
const IDS = [
  'shared-alg001-l11-p033',
  'shared-alg001-l11-p034',
  'shared-alg001-l11-p044',
];
const HASHES = Object.freeze({
  audit: '03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42',
  state: '7c604771e89366c65b37be255880d95360ac8cc693eec80272eab14bc75d56b6',
  candidates: 'bd602c53b7d3a730a6b6f8b825f1eb1fe3ddb927eaa9035c79e12853ff13bd70',
});

async function inputs() {
  const [auditBytes, stateBytes, candidateBytes] = await Promise.all([
    readFile(AUDIT_PATH), readFile(STATE_PATH), readFile(CANDIDATE_PATH),
  ]);
  return {audit: JSON.parse(auditBytes.toString('utf8')),
    stateSource: stateBytes.toString('utf8'),
    candidateSource: candidateBytes.toString('utf8'), hashes: HASHES};
}

function behaviorFor(audit, id) {
  return id.endsWith('p033')
    ? audit.behaviorContracts.p033CrossPageController
    : id.endsWith('p034')
      ? audit.behaviorContracts.p034MatchingGame
      : audit.behaviorContracts.p044RandomFinalAssessment;
}

test('generator accepts only the exact audit03e9/state7c60/candidatebd60 chain', async () => {
  const current = await inputs();
  assert.equal(validateAdvanced3GeneratorInputs(current), true);
  assert.throws(() => validateAdvanced3GeneratorInputs({...current,
    hashes: {...HASHES, audit: '0'.repeat(64)}}), /input hash binding drifted/u);
  assert.throws(() => validateAdvanced3GeneratorInputs({...current,
    audit: {...current.audit, productCalibrationPassed: true}}),
  /downstream gate drifted/u);
  assert.throws(() => validateAdvanced3GeneratorInputs({...current,
    stateSource: current.stateSource.replace(
      'currentJavaScriptRegisteredPlacementCount: 0',
      'currentJavaScriptRegisteredPlacementCount: 3')}),
  /maintained state boundary drifted/u);
  assert.throws(() => validateAdvanced3GeneratorInputs({...current,
    candidateSource: `${current.candidateSource}\nfetch("/forbidden")`}),
  /candidate boundary drifted/u);
});

test('timeline and module constructors preserve exact source/runtime/commands and unregistered maturity', async () => {
  const {audit} = await inputs();
  for (const page of audit.pages) {
    const receipt = JSON.parse(await readFile(path.join(ROOT,
      page.ffdec.commandReceipt.path), 'utf8'));
    const timeline = buildAdvanced3TimelineSource(page,
      behaviorFor(audit, page.animationId), receipt);
    const module = buildAdvanced3ModuleSource(page);
    assert.match(timeline, new RegExp(page.source.sha256, 'u'));
    assert.match(timeline, /commandsExecutedByThisGenerator": false/u);
    assert.match(timeline, /candidateModuleMaturity": "private-current-js"/u);
    assert.match(timeline, /currentJavaScriptRegistered": false/u);
    assert.match(timeline, /browserProductCalibrationPassed": false/u);
    assert.match(module, /maturity !== "private-current-js"/u);
    assert.match(module, /REGISTRATION_CANDIDATE = false/u);
    assert.match(module, /CURRENT_JAVASCRIPT_REGISTERED = false/u);
    assert.doesNotMatch(module,
      /registry\.generated|local-only-animation-registry|private-animation-registry/u);
  }
});

test('checked outputs exactly reconstruct all three generated timelines and modules', async () => {
  const {audit} = await inputs();
  for (const page of audit.pages) {
    const suffix = page.animationId.slice(-4);
    const receipt = JSON.parse(await readFile(path.join(ROOT,
      page.ffdec.commandReceipt.path), 'utf8'));
    const expectedTimeline = buildAdvanced3TimelineSource(page,
      behaviorFor(audit, page.animationId), receipt);
    const expectedModule = buildAdvanced3ModuleSource(page);
    const [timeline, module] = await Promise.all([
      readFile(path.join(ROOT,
        `packages/demos/src/timelines/${PREFIX}-${suffix}.ts`), 'utf8'),
      readFile(path.join(ROOT,
        `packages/demos/src/modules/${PREFIX}-${suffix}.tsx`), 'utf8'),
    ]);
    assert.equal(timeline, expectedTimeline);
    assert.equal(module, expectedModule);
  }
});

test('frozen run and fragment retain exact3 membership with zero registration and all false gates', async () => {
  const runPath = path.join(ROOT,
    `work/g678-shared-page-factory/${PREFIX}-current-js-v1/run-manifest.json`);
  const [run, fragment, runMode, fragmentMode] = await Promise.all([
    readFile(runPath, 'utf8').then(JSON.parse),
    readFile(FRAGMENT_PATH, 'utf8').then(JSON.parse),
    lstat(runPath), lstat(FRAGMENT_PATH),
  ]);
  assert.deepEqual(run.members.map((member) => member.animationId), IDS);
  assert.deepEqual(fragment.entries.map((entry) => entry.key), IDS);
  assert.equal(run.generatedTimelineCount, 3);
  assert.equal(run.generatedModuleCount, 3);
  assert.equal(run.registryEntriesWritten, 0);
  assert.equal(fragment.registryEntriesWritten, 0);
  assert.equal(fragment.registrationCandidatePlacementCount, 0);
  assert.equal(fragment.currentJavaScriptImplementedPlacementCount, 3);
  assert.equal(fragment.candidateModuleMaturity, 'private-current-js');
  assert.equal(fragment.currentJavaScriptRegisteredCount, 0);
  assert.equal(fragment.productCalibrationPassed, false);
  assert.equal(fragment.browserProductCalibrationPassed, false);
  assert.equal(fragment.wholeLessonEngineeringPreviewCount, 0);
  assert.equal(fragment.releaseAuthorized, false);
  assert.equal(fragment.published, false);
  assert.equal(fragment.scaleOutAuthorized, false);
  assert.ok(Object.values(fragment.acceptanceEffects)
    .every((value) => value === false));
  assert.equal(runMode.mode & 0o222, 0);
  assert.equal(runMode.nlink, 1);
  assert.equal(fragmentMode.mode & 0o222, 0);
  assert.equal(fragmentMode.nlink, 1);
});

test('full generator check reconstructs the frozen run and all tracked outputs', async () => {
  const result = await runAdvanced3TrancheDCurrentJs({check: true});
  assert.equal(result.check, true);
  assert.equal(result.generatedPlacementCount, 3);
  assert.equal(result.generatedTimelineCount, 3);
  assert.equal(result.generatedModuleCount, 3);
  assert.equal(result.registryEntriesWritten, 0);
  assert.equal(result.candidateModuleMaturity, 'private-current-js');
  assert.equal(result.currentJavaScriptRegisteredCount, 0);
  assert.equal(result.productCalibrationPassed, false);
  assert.equal(result.browserProductCalibrationPassed, false);
  assert.equal(result.wholeLessonEngineeringPreviewReady, false);
  assert.equal(result.releaseAuthorized, false);
  assert.equal(result.published, false);
  assert.equal(result.scaleOutAuthorized, false);
});
