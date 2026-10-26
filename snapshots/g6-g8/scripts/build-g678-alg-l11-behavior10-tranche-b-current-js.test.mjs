import assert from 'node:assert/strict';
import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  buildBehavior10ModuleSource,
  buildBehavior10TimelineSource,
  runBehavior10TrancheBCurrentJs,
  validateBehavior10GeneratorInputs,
} from './build-g678-alg-l11-behavior10-tranche-b-current-js.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = 'g678-alg-l11-behavior10-tranche-b';
const IDS = ['026', '027', '028', '029', '030', '031', '032', '040',
  '041', '042'].map((suffix) => `shared-alg001-l11-p${suffix}`);
const PATHS = {
  audit: `catalog/${PREFIX}-audit-v1.json`,
  decision: `catalog/${PREFIX}-source-divergence-v1.json`,
  state: `packages/demos/src/${PREFIX}-state.ts`,
  core: `packages/demos/src/${PREFIX}-candidate-core.tsx`,
  tutorial: `packages/demos/src/${PREFIX}-tutorial-candidate.tsx`,
  guided: `packages/demos/src/${PREFIX}-guided-candidate.tsx`,
  candidates: `packages/demos/src/${PREFIX}-candidates.tsx`,
};
const HASHES = {
  audit: '2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8',
  decision:
    'e4214120ddff6b052487dd339efb4421bdba88cd0532cf448c8200cf1969a89e',
  state: '664b790258ff06c6a18189acd3153954accfdd138135282a7557190654f3a492',
  core: '1e87c5320cde77bc06e81c7f28d9d3a58e6e58a425a5e346f43530141d75be57',
  tutorial:
    '0d980da48db1b2a3d82079d99bc67b2a33067e657b175b3a2d95b78a255c1d98',
  guided:
    '102a2969a749a36ed8784cf6c7d389c994427257e703a250372db2b0bb11be19',
  candidates:
    '165580c6eb79458ef5c9cdab20db64b859d3a97b882a821ba5fdd6d6bdb1f29c',
};

async function inputs() {
  const values = Object.fromEntries(await Promise.all(Object.entries(PATHS)
    .map(async ([key, relative]) => [key,
      await readFile(path.join(ROOT, relative), 'utf8')])));
  return {audit: JSON.parse(values.audit),
    decision: JSON.parse(values.decision), stateSource: values.state,
    coreSource: values.core, tutorialSource: values.tutorial,
    guidedSource: values.guided, candidatesSource: values.candidates,
    hashes: HASHES};
}

test('generator hard-binds exact audit, decision, state, and wrapper chain',
  async () => {
    const current = await inputs();
    assert.equal(validateBehavior10GeneratorInputs(current), true);
    const mutations = [
      {...current, hashes: {...HASHES, audit: '0'.repeat(64)}},
      {...current, audit: {...current.audit,
        registrationCandidatePlacementCount: 10}},
      {...current, decision: {...current.decision,
        maintainedCandidateSuppressionAuthorizedPlacementCount: 0}},
      {...current, stateSource: current.stateSource.replace(
        'currentJavaScriptRegisteredPlacementCount: 0',
        'currentJavaScriptRegisteredPlacementCount: 10')},
      {...current, coreSource: `${current.coreSource}\nfetch("/forbidden")`},
      {...current, tutorialSource: current.tutorialSource.replace(
        'l11-tutorial-multi-question-choice',
        'l11-guided-tutorial-choice')},
      {...current, guidedSource: current.guidedSource.replace(
        'suppressedByMaintainedCandidate', 'suppressionMissing')},
    ];
    for (const value of mutations) {
      assert.throws(() => validateBehavior10GeneratorInputs(value),
        /drifted/u);
    }
  });

test('timeline and module constructors retain exact source config and false gates',
  async () => {
    const {audit, decision} = await inputs();
    for (const member of audit.members) {
      const divergence = decision.entries.find((entry) =>
        entry.animationId === member.animationId) ?? null;
      const timeline = buildBehavior10TimelineSource(member, divergence);
      const module = buildBehavior10ModuleSource(member);
      assert.match(timeline, new RegExp(member.source.sha256, 'u'));
      assert.match(timeline, new RegExp(
        member.answerVisibleGeometryCrosswalk.frameSvg.sha256, 'u'));
      assert.match(timeline,
        /candidateModuleMaturity": "private-current-js"/u);
      assert.match(timeline, /currentJavaScriptImplemented": true/u);
      assert.match(timeline, /domRendererImplemented": true/u);
      assert.match(timeline, /currentJavaScriptRegistered": false/u);
      assert.match(timeline, /browserProductCalibrationPassed": false/u);
      assert.match(module, /maturity !== "private-current-js"/u);
      assert.match(module, /DOM_RENDERER_IMPLEMENTED = true/u);
      assert.match(module, /REGISTRATION_CANDIDATE = false/u);
      assert.doesNotMatch(module,
        /registry\.generated|private-current-js-registry|fetch\s*\(/u);
      assert.equal(timeline.includes('Mc_PopUp'), divergence !== null);
    }
  });

test('checked files exactly reconstruct all ten timelines and modules',
  async () => {
    const {audit, decision} = await inputs();
    for (const member of audit.members) {
      const suffix = member.animationId.slice(-4);
      const divergence = decision.entries.find((entry) =>
        entry.animationId === member.animationId) ?? null;
      const expectedTimeline = buildBehavior10TimelineSource(member,
        divergence);
      const expectedModule = buildBehavior10ModuleSource(member);
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

test('frozen run and fragment preserve exact10 private DOM but zero registration',
  async () => {
    const runPath = path.join(ROOT,
      `work/g678-shared-page-factory/${PREFIX}-current-js-v1/run-manifest.json`);
    const fragmentPath = path.join(ROOT,
      `catalog/product-bridge-calibrations/${PREFIX}-current-js-v1.fragment.json`);
    const [runText, fragmentText, runMode, fragmentMode] = await Promise.all([
      readFile(runPath, 'utf8'), readFile(fragmentPath, 'utf8'),
      lstat(runPath), lstat(fragmentPath),
    ]);
    const run = JSON.parse(runText);
    const fragment = JSON.parse(fragmentText);
    assert.deepEqual(run.members.map((member) => member.animationId), IDS);
    assert.deepEqual(fragment.entries.map((entry) => entry.key), IDS);
    assert.equal(run.generatedTimelineCount, 10);
    assert.equal(run.generatedModuleCount, 10);
    assert.equal(run.candidateModuleMaturity, 'private-current-js');
    assert.equal(run.currentJavaScriptImplementedPlacementCount, 10);
    assert.equal(run.domRendererImplementedPlacementCount, 10);
    assert.equal(run.staleAngleOverlaySuppressedPlacementCount, 3);
    assert.equal(fragment.currentJavaScriptImplementedCount, 10);
    assert.equal(fragment.domRendererImplementedCount, 10);
    assert.equal(fragment.registryEntriesWritten, 0);
    assert.equal(fragment.registrationCandidatePlacementCount, 0);
    assert.equal(fragment.currentJavaScriptRegisteredCount, 0);
    assert.equal(fragment.productCalibrationPassed, false);
    assert.equal(fragment.browserProductCalibrationPassed, false);
    assert.equal(fragment.wholeLessonEngineeringPreviewCount, 0);
    assert.equal(fragment.scaleOutAuthorized, false);
    assert.equal(fragment.releaseAuthorized, false);
    assert.equal(fragment.published, false);
    assert.ok(Object.values(fragment.acceptanceEffects)
      .every((value) => value === false));
    assert.equal(runMode.mode & 0o222, 0);
    assert.equal(runMode.nlink, 1);
    assert.equal(fragmentMode.mode & 0o222, 0);
    assert.equal(fragmentMode.nlink, 1);
  });

test('full generator check rebuilds the frozen run and every tracked output',
  async () => {
    const result = await runBehavior10TrancheBCurrentJs({check: true});
    assert.equal(result.check, true);
    assert.equal(result.generatedPlacementCount, 10);
    assert.equal(result.generatedTimelineCount, 10);
    assert.equal(result.generatedModuleCount, 10);
    assert.equal(result.registryEntriesWritten, 0);
    assert.equal(result.candidateModuleMaturity, 'private-current-js');
    assert.equal(result.currentJavaScriptImplementedCount, 10);
    assert.equal(result.domRendererImplementedCount, 10);
    assert.equal(result.staleAngleOverlaySuppressedPlacementCount, 3);
    assert.equal(result.currentJavaScriptRegisteredCount, 0);
    assert.equal(result.productCalibrationPassed, false);
    assert.equal(result.browserProductCalibrationPassed, false);
    assert.equal(result.wholeLessonEngineeringPreviewReady, false);
    assert.equal(result.scaleOutAuthorized, false);
    assert.equal(result.releaseAuthorized, false);
    assert.equal(result.published, false);
  });
