import assert from 'node:assert/strict';
import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  buildInteractive10ModuleSource,
  buildInteractive10TimelineSource,
  runInteractive10TrancheCCurrentJs,
  validateInteractive10GeneratorInputs,
} from './build-g678-alg-l11-interactive10-tranche-c-current-js.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = 'g678-alg-l11-interactive10-tranche-c';
const AUDIT_PATH = path.join(ROOT, `catalog/${PREFIX}-audit-v1.json`);
const CORE_PATH = path.join(ROOT, `packages/demos/src/${PREFIX}-core.ts`);
const STATE_PATH = path.join(ROOT, `packages/demos/src/${PREFIX}-state.ts`);
const WRAPPER_PATH = path.join(ROOT,
  `packages/demos/src/${PREFIX}-wrappers.tsx`);
const CANDIDATE_PATH = path.join(ROOT,
  `packages/demos/src/${PREFIX}-candidates.tsx`);
const FRAGMENT_PATH = path.join(ROOT,
  `catalog/product-bridge-calibrations/${PREFIX}-current-js-v1.fragment.json`);
const IDS = Object.freeze([
  'shared-alg001-l11-p006', 'shared-alg001-l11-p008',
  'shared-alg001-l11-p009', 'shared-alg001-l11-p010',
  'shared-alg001-l11-p011', 'shared-alg001-l11-p014',
  'shared-alg001-l11-p019', 'shared-alg001-l11-p020',
  'shared-alg001-l11-p021', 'shared-alg001-l11-p025',
]);
const HASHES = Object.freeze({
  audit: '45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578',
  core: '92ab35656d3e295466c1641145cc9ec6496dbf98dc44cf72707f3553e9369284',
  state: '4c9542bd54f3ae5ee2a41a297107fb6a6e3ce597bda5c0b3cad2446502794554',
  wrappers: '662785ff4e16e15b4b6123a287b352c4899aa4a129e786f9aa3f3942106221d4',
  candidates: '492b8d9eb4ae44991411a4f7e29e69de522d1ffa3223eb8e04b233f191900c63',
});

async function inputs() {
  const [auditBytes, coreBytes, stateBytes, wrapperBytes, candidateBytes] =
    await Promise.all([readFile(AUDIT_PATH), readFile(CORE_PATH),
      readFile(STATE_PATH), readFile(WRAPPER_PATH), readFile(CANDIDATE_PATH)]);
  return {audit: JSON.parse(auditBytes.toString('utf8')),
    coreSource: coreBytes.toString('utf8'),
    stateSource: stateBytes.toString('utf8'),
    wrapperSource: wrapperBytes.toString('utf8'),
    candidateSource: candidateBytes.toString('utf8'), hashes: HASHES};
}

test('generator accepts only the exact reviewed audit and maintained candidate chain', async () => {
  const current = await inputs();
  assert.equal(validateInteractive10GeneratorInputs(current), true);
  assert.throws(() => validateInteractive10GeneratorInputs({...current,
    hashes: {...HASHES, audit: '0'.repeat(64)}}),
  /input hash binding drifted/u);
  assert.throws(() => validateInteractive10GeneratorInputs({...current,
    audit: {...current.audit, productCalibrationPassed: true}}),
  /downstream gate drifted/u);
  assert.throws(() => validateInteractive10GeneratorInputs({...current,
    coreSource: current.coreSource.replace(
      'candidateModuleMaturity: "private-current-js"',
      'candidateModuleMaturity: "legacy-prototype"')}),
  /maintained core boundary drifted/u);
  assert.throws(() => validateInteractive10GeneratorInputs({...current,
    stateSource: `${current.stateSource}\nfetch("/forbidden")`}),
  /maintained state boundary drifted/u);
  assert.throws(() => validateInteractive10GeneratorInputs({...current,
    wrapperSource: current.wrapperSource.replace(
      'data-current-javascript-registered="false"',
      'data-current-javascript-registered="true"')}),
  /maintained wrapper boundary drifted/u);
  assert.throws(() => validateInteractive10GeneratorInputs({...current,
    wrapperSource: current.wrapperSource.replace(
      'data-source-need-more-help-open="true"',
      'data-source-need-more-help-open="false"')}),
  /maintained wrapper boundary drifted/u);
  assert.throws(() => validateInteractive10GeneratorInputs({...current,
    candidateSource: `${current.candidateSource}\n// registry.generated`}),
  /candidate boundary drifted/u);
  const changedAudio = structuredClone(current.audit);
  changedAudio.members[0].physicalAudioCandidate.accepted = true;
  assert.throws(() => validateInteractive10GeneratorInputs({...current,
    audit: changedAudio}), /page gate drifted/u);
});

test('timeline and module constructors preserve exact source contracts and private unregistered maturity', async () => {
  const {audit} = await inputs();
  for (const page of audit.members) {
    const timeline = buildInteractive10TimelineSource(page);
    const module = buildInteractive10ModuleSource(page);
    assert.match(timeline, new RegExp(page.source.sha256, 'u'));
    assert.match(timeline,
      new RegExp(page.exactScriptInventory.checksumSetSha256, 'u'));
    assert.match(timeline,
      new RegExp(page.exactTextInventory.checksumSetSha256, 'u'));
    assert.match(timeline, /candidateModuleMaturity": "private-current-js"/u);
    assert.match(timeline, /currentJavaScriptRegistered": false/u);
    assert.match(timeline, /browserProductCalibrationPassed": false/u);
    assert.match(timeline, /accepted": false/u);
    assert.match(module, /maturity !== "private-current-js"/u);
    assert.match(module, /REGISTRATION_CANDIDATE = false/u);
    assert.match(module, /CURRENT_JAVASCRIPT_REGISTERED = false/u);
    assert.doesNotMatch(module,
      /registry\.generated|local-only-animation-registry|private-animation-registry/u);
  }
});

test('checked outputs exactly reconstruct all ten generated timelines and modules', async () => {
  const {audit} = await inputs();
  for (const page of audit.members) {
    const suffix = page.animationId.slice(-4);
    const [timeline, module] = await Promise.all([
      readFile(path.join(ROOT,
        `packages/demos/src/timelines/${PREFIX}-${suffix}.ts`), 'utf8'),
      readFile(path.join(ROOT,
        `packages/demos/src/modules/${PREFIX}-${suffix}.tsx`), 'utf8'),
    ]);
    assert.equal(timeline, buildInteractive10TimelineSource(page));
    assert.equal(module, buildInteractive10ModuleSource(page));
  }
});

test('frozen run and fragment retain exact10 membership with zero registration and all false gates', async () => {
  const runPath = path.join(ROOT,
    `work/g678-shared-page-factory/${PREFIX}-current-js-v1/run-manifest.json`);
  const [run, fragment, runMode, fragmentMode] = await Promise.all([
    readFile(runPath, 'utf8').then(JSON.parse),
    readFile(FRAGMENT_PATH, 'utf8').then(JSON.parse),
    lstat(runPath), lstat(FRAGMENT_PATH),
  ]);
  assert.deepEqual(run.members.map((member) => member.animationId), IDS);
  assert.deepEqual(fragment.entries.map((entry) => entry.key), IDS);
  assert.equal(run.exactPlacementCount, 10);
  assert.equal(run.generatedTimelineCount, 10);
  assert.equal(run.generatedModuleCount, 10);
  assert.equal(run.currentJavaScriptImplementedPlacementCount, 10);
  assert.equal(run.sourceExtractionCommandsExecutedByThisGenerator, false);
  assert.equal(run.audioPlayedByThisGenerator, false);
  assert.equal(run.registryEntriesWritten, 0);
  assert.equal(fragment.registryEntriesWritten, 0);
  assert.equal(fragment.registrationCandidatePlacementCount, 0);
  assert.equal(fragment.currentJavaScriptImplementedPlacementCount, 10);
  assert.equal(fragment.candidateModuleMaturity, 'private-current-js');
  assert.equal(fragment.currentJavaScriptRegisteredCount, 0);
  assert.equal(fragment.productCalibrationPassed, false);
  assert.equal(fragment.browserProductCalibrationPassed, false);
  assert.equal(fragment.wholeLessonEngineeringPreviewCount, 0);
  assert.equal(fragment.acceptancePassed, false);
  assert.equal(fragment.releaseAuthorized, false);
  assert.equal(fragment.published, false);
  assert.equal(fragment.scaleOutAuthorized, false);
  assert.ok(Object.values(fragment.acceptanceEffects)
    .every((value) => value === false));
  assert.ok(run.members.every((member) =>
    member.moduleMaturity === 'private-current-js' &&
    member.registrationCandidate === false &&
    member.currentJavaScriptRegistered === false &&
    member.physicalAudioCandidate.accepted === false));
  assert.equal(runMode.mode & 0o222, 0);
  assert.equal(runMode.nlink, 1);
  assert.equal(fragmentMode.mode & 0o222, 0);
  assert.equal(fragmentMode.nlink, 1);
});

test('full generator check reconstructs the frozen run and every tracked output', async () => {
  const result = await runInteractive10TrancheCCurrentJs({check: true});
  assert.equal(result.check, true);
  assert.equal(result.generatedPlacementCount, 10);
  assert.equal(result.generatedTimelineCount, 10);
  assert.equal(result.generatedModuleCount, 10);
  assert.equal(result.registryEntriesWritten, 0);
  assert.equal(result.candidateModuleMaturity, 'private-current-js');
  assert.equal(result.currentJavaScriptRegisteredCount, 0);
  assert.equal(result.productCalibrationPassed, false);
  assert.equal(result.browserProductCalibrationPassed, false);
  assert.equal(result.wholeLessonEngineeringPreviewReady, false);
  assert.equal(result.acceptancePassed, false);
  assert.equal(result.releaseAuthorized, false);
  assert.equal(result.published, false);
  assert.equal(result.scaleOutAuthorized, false);
  assert.ok(Object.values(result.acceptanceEffects)
    .every((value) => value === false));
});
